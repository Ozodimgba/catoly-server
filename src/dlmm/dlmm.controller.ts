import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DlmmService } from './dlmm.service';
import { Cluster, Keypair, PublicKey } from '@solana/web3.js';
import { StrategyType } from '@meteora-ag/dlmm';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { BN } from '@coral-xyz/anchor';

@Controller('dlmm')
export class DlmmController {
  constructor(private readonly dlmmService: DlmmService) {}

  @Get('pools')
  async getAllPools(@Query('cluster') cluster?: Cluster) {
    return this.dlmmService.getAllPools(cluster);
  }

  @Get('pair')
  async getPairPublicKey(
    @Query('tokenX') tokenX: string,
    @Query('tokenY') tokenY: string,
    @Query('binStep') binStep: number,
    @Query('baseFactor') baseFactor: number,
    @Query('cluster') cluster?: Cluster,
  ) {
    return {
      poolAddress: await this.dlmmService.getPairPublicKey({
        tokenX,
        tokenY,
        binStep,
        baseFactor,
        cluster,
      }),
    };
  }

  @Get('active-bin/:poolAddress')
  async getActiveBin(@Param('poolAddress') poolAddress: string) {
    return this.dlmmService.getActiveBin(poolAddress);
  }

  @Get('fee-info/:poolAddress')
  async getFeeInfo(@Param('poolAddress') poolAddress: string) {
    return this.dlmmService.getFeeInfo(poolAddress);
  }

  @Get('dynamic-fee/:poolAddress')
  async getDynamicFee(@Param('poolAddress') poolAddress: string) {
    const fee = await this.dlmmService.getDynamicFee(poolAddress);
    return { fee: fee.toString() };
  }

  @Get('positions/:poolAddress')
  async getPositions(
    @Param('poolAddress') poolAddress: string,
    @Query('userPublicKey') userPublicKey: string,
  ) {
    return this.dlmmService.getPositionsByUserAndPool({
      poolAddress,
      userPublicKey,
    });
  }

  @Get(':poolAddress/position/:positionPubKey')
  async getPosition(
    @Param('poolAddress') poolAddress: string,
    @Param('positionPubKey') positionPubKey: string,
  ) {
    return this.dlmmService.getPosition({
      poolAddress,
      positionPubKey,
    });
  }

  @Get(':poolAddress/bins')
  async getBins(
    @Param('poolAddress') poolAddress: string,
    @Query('leftBins') leftBins: number,
    @Query('rightBins') rightBins: number,
  ) {
    return this.dlmmService.getBinsAroundActiveBin({
      poolAddress,
      numberOfBinsToTheLeft: leftBins || 10,
      numberOfBinsToTheRight: rightBins || 10,
    });
  }

  @Get('user/:userPublicKey/positions')
  async getAllPositions(
    @Param('userPublicKey') userPublicKey: string,
    @Query('cluster') cluster?: Cluster,
  ) {
    return this.dlmmService.getAllLbPairPositionsByUser(userPublicKey, cluster);
  }

  @Get(':poolAddress/lock-info')
  async getLockInfo(
    @Param('poolAddress') poolAddress: string,
    @Query('lockDuration') lockDuration?: number,
  ) {
    return this.dlmmService.getLbPairLockInfo({
      poolAddress,
      lockDuration,
    });
  }

  @Post(':poolAddress/create-position')
  async initializePositionAndAddLiquidity(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      secretKey: string;
      userPublicKey: string;
      totalXAmount: string;
      totalYAmount: string;
      minBinId: number;
      maxBinId: number;
      strategyType: StrategyType;
      slippage?: number;
    },
  ) {
    const positionKeypair = Keypair.fromSecretKey(
      Uint8Array.from(bs58.decode(body.secretKey)),
    );

    const transaction =
      await this.dlmmService.initializePositionAndAddLiquidityByStrategy({
        poolAddress,
        positionKeypair,
        userPublicKey: body.userPublicKey,
        totalXAmount: body.totalXAmount,
        totalYAmount: body.totalYAmount,
        minBinId: body.minBinId,
        maxBinId: body.maxBinId,
        strategyType: body.strategyType,
        slippage: body.slippage,
      });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
      positionPublicKey: positionKeypair.publicKey.toString(),
    };
  }

  @Post(':poolAddress/create-empty-position')
  async createEmptyPosition(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      secretKey: string;
      userPublicKey: string;
      minBinId: number;
      maxBinId: number;
    },
  ) {
    const positionKeypair = Keypair.fromSecretKey(
      Uint8Array.from(bs58.decode(body.secretKey)),
    );

    const transaction = await this.dlmmService.createEmptyPosition({
      poolAddress,
      positionKeypair,
      userPublicKey: body.userPublicKey,
      minBinId: body.minBinId,
      maxBinId: body.maxBinId,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
      positionPublicKey: positionKeypair.publicKey.toString(),
    };
  }

  @Post(':poolAddress/add-liquidity')
  async addLiquidity(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      positionPubKey: string;
      userPublicKey: string;
      totalXAmount: string;
      totalYAmount: string;
      minBinId: number;
      maxBinId: number;
      strategyType: StrategyType;
      slippage?: number;
    },
  ) {
    const transaction = await this.dlmmService.addLiquidityByStrategy({
      poolAddress,
      positionPubKey: body.positionPubKey,
      userPublicKey: body.userPublicKey,
      totalXAmount: body.totalXAmount,
      totalYAmount: body.totalYAmount,
      minBinId: body.minBinId,
      maxBinId: body.maxBinId,
      strategyType: body.strategyType,
      slippage: body.slippage,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/remove-liquidity')
  async removeLiquidity(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      positionPubKey: string;
      userPublicKey: string;
      binIds: number[];
      bps: string;
      shouldClaimAndClose?: boolean;
    },
  ) {
    const transaction = await this.dlmmService.removeLiquidity({
      poolAddress,
      positionPubKey: body.positionPubKey,
      userPublicKey: body.userPublicKey,
      binIds: body.binIds,
      bps: body.bps,
      shouldClaimAndClose: body.shouldClaimAndClose,
    });

    // Handle both single transaction and array of transactions
    if (Array.isArray(transaction)) {
      return {
        transactions: transaction.map((tx) =>
          tx.serialize({ requireAllSignatures: false }).toString('base64'),
        ),
      };
    } else {
      return {
        transaction: transaction
          .serialize({ requireAllSignatures: false })
          .toString('base64'),
      };
    }
  }

  @Post(':poolAddress/close-position')
  async closePosition(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      owner: string;
      position: any; // LbPosition
    },
  ) {
    const transaction = await this.dlmmService.closePosition({
      poolAddress,
      owner: body.owner,
      position: body.position,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/swap-quote')
  async getSwapQuote(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      inAmount: string;
      swapForY: boolean;
      allowedSlippage: string;
      isPartialFill?: boolean;
      maxExtraBinArrays?: number;
    },
  ) {
    return this.dlmmService.getSwapQuote({
      poolAddress,
      inAmount: body.inAmount,
      swapForY: body.swapForY,
      allowedSlippage: body.allowedSlippage,
      isPartialFill: body.isPartialFill,
      maxExtraBinArrays: body.maxExtraBinArrays,
    });
  }

  @Post(':poolAddress/swap')
  async createSwap(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      inToken: string;
      outToken: string;
      inAmount: string;
      minOutAmount: string;
      userPublicKey: string;
      binArraysPubkey: string[];
    },
  ) {
    const transaction = await this.dlmmService.createSwapTransaction({
      inToken: new PublicKey(body.inToken),
      outToken: new PublicKey(body.outToken),
      inAmount: new BN(body.inAmount),
      minOutAmount: new BN(body.minOutAmount),
      lbPair: new PublicKey(poolAddress),
      user: new PublicKey(body.userPublicKey),
      binArraysPubkey: body.binArraysPubkey.map((key) => new PublicKey(key)),
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/swap-exact-out')
  async createExactOutSwap(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      inToken: string;
      outToken: string;
      outAmount: string;
      maxInAmount: string;
      userPublicKey: string;
      binArraysPubkey: string[];
    },
  ) {
    const transaction = await this.dlmmService.createExactOutSwapTransaction({
      inToken: new PublicKey(body.inToken),
      outToken: new PublicKey(body.outToken),
      outAmount: new BN(body.outAmount),
      maxInAmount: new BN(body.maxInAmount),
      lbPair: new PublicKey(poolAddress),
      user: new PublicKey(body.userPublicKey),
      binArraysPubkey: body.binArraysPubkey.map((key) => new PublicKey(key)),
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/swap-with-price-impact')
  async createSwapWithPriceImpact(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      inToken: string;
      outToken: string;
      inAmount: string;
      priceImpact: string;
      userPublicKey: string;
      binArraysPubkey: string[];
    },
  ) {
    const transaction =
      await this.dlmmService.createSwapWithPriceImpactTransaction({
        inToken: new PublicKey(body.inToken),
        outToken: new PublicKey(body.outToken),
        inAmount: new BN(body.inAmount),
        priceImpact: new BN(body.priceImpact),
        lbPair: new PublicKey(poolAddress),
        user: new PublicKey(body.userPublicKey),
        binArraysPubkey: body.binArraysPubkey.map((key) => new PublicKey(key)),
      });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/claim-lm-reward')
  async claimLMReward(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      owner: string;
      position: any; // LbPosition
    },
  ) {
    const transaction = await this.dlmmService.claimLMReward({
      poolAddress,
      owner: body.owner,
      position: body.position,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/claim-all-lm-rewards')
  async claimAllLMRewards(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      owner: string;
      positions: any[]; // LbPosition[]
    },
  ) {
    const transactions = await this.dlmmService.claimAllLMRewards({
      poolAddress,
      owner: body.owner,
      positions: body.positions,
    });

    return {
      transactions: transactions.map((tx) =>
        tx.serialize({ requireAllSignatures: false }).toString('base64'),
      ),
    };
  }

  @Post(':poolAddress/claim-swap-fee')
  async claimSwapFee(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      owner: string;
      position: any; // LbPosition
    },
  ) {
    const transaction = await this.dlmmService.claimSwapFee({
      poolAddress,
      owner: body.owner,
      position: body.position,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/claim-all-swap-fee')
  async claimAllSwapFee(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      owner: string;
      positions: any[]; // LbPosition[]
    },
  ) {
    const transactions = await this.dlmmService.claimAllSwapFee({
      poolAddress,
      owner: body.owner,
      positions: body.positions,
    });

    return {
      transactions: transactions.map((tx) =>
        tx.serialize({ requireAllSignatures: false }).toString('base64'),
      ),
    };
  }

  @Post(':poolAddress/claim-all-rewards')
  async claimAllRewards(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      owner: string;
      positions: any[]; // LbPosition[]
    },
  ) {
    const transactions = await this.dlmmService.claimAllRewards({
      poolAddress,
      owner: body.owner,
      positions: body.positions,
    });

    return {
      transactions: transactions.map((tx) =>
        tx.serialize({ requireAllSignatures: false }).toString('base64'),
      ),
    };
  }

  @Post(':poolAddress/initialize-bin-arrays')
  async initializeBinArrays(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      binArrayIndexes: string[];
      funder: string;
    },
  ) {
    const instructions = await this.dlmmService.initializeBinArrays({
      poolAddress,
      binArrayIndexes: body.binArrayIndexes.map((idx) => new BN(idx)),
      funder: body.funder,
    });

    return {
      instructions,
    };
  }

  @Post(':poolAddress/sync-with-market-price')
  async syncWithMarketPrice(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      marketPrice: number;
      owner: string;
    },
  ) {
    const transaction = await this.dlmmService.syncWithMarketPrice({
      poolAddress,
      marketPrice: body.marketPrice,
      owner: body.owner,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/bin-id-from-price')
  async getBinIdFromPrice(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      price: number;
      min: boolean;
    },
  ) {
    const binId = await this.dlmmService.getBinIdFromPrice({
      poolAddress,
      price: body.price,
      min: body.min,
    });

    return { binId };
  }

  @Post('create-permissionless-pair')
  async createPermissionlessPair(
    @Body()
    body: {
      binStep: number;
      tokenX: string;
      tokenY: string;
      activeId: number;
      feeBps: number;
      activationType: number;
      hasAlphaVault: boolean;
      creatorKey: string;
      activationPoint?: number;
      creatorPoolOnOffControl?: boolean;
      cluster?: Cluster;
    },
  ) {
    const transaction =
      await this.dlmmService.createCustomizablePermissionlessLbPair({
        binStep: body.binStep,
        tokenX: body.tokenX,
        tokenY: body.tokenY,
        activeId: body.activeId,
        feeBps: body.feeBps,
        activationType: body.activationType,
        hasAlphaVault: body.hasAlphaVault,
        creatorKey: body.creatorKey,
        activationPoint: body.activationPoint,
        creatorPoolOnOffControl: body.creatorPoolOnOffControl,
        cluster: body.cluster || 'mainnet-beta',
      });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/set-pair-status')
  async setPairStatus(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      enabled: boolean;
    },
  ) {
    const transaction = await this.dlmmService.setPairStatus({
      poolAddress,
      enabled: body.enabled,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }

  @Post(':poolAddress/seed-liquidity-single-bin')
  async seedLiquiditySingleBin(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      payer: string;
      base: string;
      seedAmount: string;
      price: number;
      roundingUp: boolean;
      positionOwner: string;
      feeOwner: string;
      operator: string;
      lockReleasePoint: number;
      shouldSeedPositionOwner?: boolean;
    },
  ) {
    const instructions = await this.dlmmService.seedLiquiditySingleBin({
      poolAddress,
      payer: body.payer,
      base: body.base,
      seedAmount: body.seedAmount,
      price: body.price,
      roundingUp: body.roundingUp,
      positionOwner: body.positionOwner,
      feeOwner: body.feeOwner,
      operator: body.operator,
      lockReleasePoint: body.lockReleasePoint,
      shouldSeedPositionOwner: body.shouldSeedPositionOwner,
    });

    return {
      instructions,
    };
  }

  @Post(':poolAddress/initialize-position-by-operator')
  async initializePositionByOperator(
    @Param('poolAddress') poolAddress: string,
    @Body()
    body: {
      lowerBinId: number;
      positionWidth: number;
      owner: string;
      feeOwner: string;
      base: string;
      operator: string;
      payer: string;
      lockReleasePoint: number;
    },
  ) {
    const transaction = await this.dlmmService.initializePositionByOperator({
      poolAddress,
      lowerBinId: body.lowerBinId,
      positionWidth: body.positionWidth,
      owner: body.owner,
      feeOwner: body.feeOwner,
      base: body.base,
      operator: body.operator,
      payer: body.payer,
      lockReleasePoint: body.lockReleasePoint,
    });

    return {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString('base64'),
    };
  }
}
