import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as vault from 'node-vault';
import { VaultSecret, VaultResponse, WalletResponse } from './vault.types';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class VaultService implements OnModuleInit {
  private client: vault.client;
  private readonly logger = new Logger(VaultService.name);

  constructor(private readonly redisService: RedisService) {
    const options = {
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
      token: process.env.VAULT_TOKEN || 'vault-token',
    };

    this.client = vault(options);
  }

  private AESEcnrypt(data): { key: string; iv: string; encrypted: string } {
    const key = randomBytes(32);
    const iv = randomBytes(16);

    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');

    return {
      key: key.toString('hex'),
      iv: iv.toString('hex'),
      encrypted,
    };
  }

  private AESDecrypt(encrypted, key, iv): string {
    const cipher = createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex'),
    );

    return cipher.update(encrypted, 'hex', 'utf8') + cipher.final('utf8');
  }

  /**
   * Checks if a wallet exists in both Redis and vault
   * @param {string} name - Wallet identifier/name
   * @returns {Promise<{ exists: boolean, location?: string[] }>}
   */
  private async checkWalletExists(
    name: string,
  ): Promise<{ exists: boolean; location?: string[] }> {
    const existingLocations: string[] = [];

    // Check Redis
    try {
      const redisData = await this.redisService.getValue(`${name}`);

      if (redisData) {
        existingLocations.push('Redis');
      }
    } catch (error) {
      console.error('Error checking Redis:', error);
      throw new Error('Failed to check Redis storage');
    }

    // Check Vault
    const vaultResponse = await this.readSecret(`wallets/${name}`);
    if (vaultResponse.success && vaultResponse.data?.privateKey) {
      this.logger.debug(`Wallet exists in Vault: ${name}`);
      existingLocations.push('Vault');
    }

    return {
      exists: existingLocations.length > 0,
      location: existingLocations.length > 0 ? existingLocations : undefined,
    };
  }

  async onModuleInit() {
    try {
      await this.client.health();
      this.logger.log('Successfully connected to Vault');
    } catch (error) {
      this.logger.error('Failed to connect to Vault', error);
      throw error;
    }
  }

  async writeSecret(secret: VaultSecret): Promise<VaultResponse> {
    try {
      await this.client.write(`secret/data/${secret.path}`, {
        data: secret.data,
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to write secret at path ${secret.path}`, error);
      return { success: false, error: error.message };
    }
  }

  async readSecret(path: string): Promise<VaultResponse> {
    try {
      const result = await this.client.read(`secret/data/${path}`);
      return { success: true, data: result.data.data };
    } catch (error) {
      // Handle 404 not found as a normal case
      if (
        error.response?.statusCode === 404 ||
        error.message?.includes('Status 404')
      ) {
        // Only log at debug level when checking for existence
        if (path.startsWith('wallets/')) {
          this.logger.verbose(
            `Creating new wallet - path ${path} not found in vault`,
          );
        }
        return { success: false, error: 'Secret not found' };
      }

      // Log other errors as actual errors
      this.logger.error(`Failed to read secret at path ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  async deleteSecret(path: string): Promise<VaultResponse> {
    try {
      await this.client.delete(`secret/data/${path}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete secret at path ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  async listSecrets(path: string = ''): Promise<VaultResponse> {
    try {
      const result = await this.client.list(`secret/metadata/${path}`);
      return { success: true, data: result.data.keys };
    } catch (error) {
      this.logger.error(`Failed to list secrets at path ${path}`, error);
      return { success: false, error: error.message };
    }
  }

  async storeWalletKey(name: string): Promise<WalletResponse> {
    console.log(name);
    try {
      // Check if wallet already exists
      const { exists, location } = await this.checkWalletExists(name);

      if (exists) {
        return {
          success: false,
          error: `Wallet already exists in ${location?.join(' and ')}`,
        };
      }

      const inAppWallet = Keypair.generate();

      const privateKey = bs58.encode(inAppWallet.secretKey);
      const { key, iv, encrypted } = this.AESEcnrypt(privateKey);

      const timestamp = new Date().toISOString();
      const walletData = {
        publicKey: inAppWallet.publicKey.toBase58(),
        encryptedPkey: encrypted,
        createdAt: timestamp,
      };

      // Try storing in Redis
      try {
        await this.redisService.setValue(`${name}`, JSON.stringify(walletData));
      } catch (redisError) {
        console.error('Redis storage failed:', redisError);
        return {
          success: false,
          error: 'Failed to store encrypted key in redis',
        };
      }

      // Verify Redis storage was successful
      try {
        const storedData = await this.redisService.getValue(`${name}`);
        if (!storedData) {
          throw new Error('Redis storage verification failed');
        }
      } catch (verificationError) {
        console.error('Redis verification failed:', verificationError);
        return {
          success: false,
          error: 'Failed to verify Redis storage',
        };
      }

      // Proceed with vault storage only if Redis storage succeeded
      try {
        const secret = {
          path: `wallets/${name}`,
          data: {
            privateKey: `${key}::${iv}`,
            createdAt: timestamp,
          },
        };

        await this.writeSecret(secret);
        console.log(`Stored wallet keys for ${name} in vault and Redis`);
      } catch (vaultError) {
        // If vault storage fails, clean up Redis
        console.error('Vault storage failed:', vaultError);
        try {
          await this.redisService.deleteKey(`wallet:${name}`);
          console.log('Cleaned up Redis after vault failure');
        } catch (cleanupError) {
          console.error(
            'Failed to clean up Redis after vault failure:',
            cleanupError,
          );
        }

        return {
          success: false,
          error: 'Failed to store in vault',
        };
      }

      return {
        success: true,
        data: {
          encryptedPkey: encrypted,
          createdAt: timestamp,
        },
      };
    } catch (error) {
      console.error('Unexpected error storing wallet:', error);
      return {
        success: false,
        error: 'Unexpected error occurred while storing wallet data',
      };
    }
  }

  async getWalletKey(name: string) {
    const result = await this.readSecret(`wallets/${name}`);

    if (result.success) {
      return result.data.privateKey;
    }

    throw new Error('Failed to retrieve wallet key');
  }

  async retrieveWalletPrivateKey(idPubkey: string): Promise<{
    success: boolean;
    privateKey?: Keypair | string;
    error?: string;
  }> {
    try {
      // Get encrypted private key from Redis
      const redisData = await this.redisService.getValue(`${idPubkey}`);
      if (!redisData) {
        this.logger.debug(`Wallet ${idPubkey} not found in Redis`);
        return {
          success: false,
          error: 'Wallet not found in Redis',
        };
      }

      let walletData;
      try {
        walletData = JSON.parse(redisData);
      } catch (parseError) {
        this.logger.error(
          `Invalid Redis data format for wallet ${idPubkey}`,
          parseError,
        );
        return {
          success: false,
          error: 'Invalid wallet data format in Redis',
        };
      }

      if (!walletData.encryptedPkey) {
        return {
          success: false,
          error: 'Missing encrypted key in Redis data',
        };
      }

      // Get decryption key from Vault
      const vaultResponse = await this.readSecret(`wallets/${idPubkey}`);
      if (!vaultResponse.success) {
        const errorMessage =
          vaultResponse.error === 'Secret not found'
            ? 'Decryption key not found in Vault'
            : 'Failed to access Vault';

        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!vaultResponse.data?.privateKey) {
        return {
          success: false,
          error: 'Missing private key data in Vault',
        };
      }

      // Split the key and iv
      const [key, iv] = vaultResponse.data.privateKey.split('::');
      if (!key || !iv) {
        return {
          success: false,
          error: 'Invalid key format in Vault',
        };
      }

      // Decrypt the private key
      let decryptedPrivateKey;
      try {
        decryptedPrivateKey = this.AESDecrypt(
          walletData.encryptedPkey,
          key,
          iv,
        );
      } catch (decryptError) {
        this.logger.error(
          `Decryption failed for wallet ${idPubkey}`,
          decryptError,
        );
        return {
          success: false,
          error: 'Failed to decrypt private key',
        };
      }

      // Verify it's a valid Solana private key
      try {
        const keyBytes = bs58.decode(decryptedPrivateKey);
        const decryptedKeypair = Keypair.fromSecretKey(keyBytes);

        return {
          success: true,
          privateKey: decryptedKeypair,
        };
      } catch (error) {
        this.logger.error(
          `Invalid Solana key format for wallet ${idPubkey}`,
          error,
        );
        return {
          success: false,
          error: 'Decrypted key is not a valid Solana private key',
        };
      }
    } catch (error) {
      this.logger.error(
        'Unexpected error retrieving wallet private key:',
        error,
      );
      return {
        success: false,
        error: 'Unexpected error occurred while retrieving wallet private key',
      };
    }
  }
}
