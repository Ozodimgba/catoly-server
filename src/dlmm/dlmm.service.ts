import { Injectable } from '@nestjs/common';
import {
  Cluster,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import DLMM from '@meteora-ag/dlmm';
import { BN } from '@coral-xyz/anchor';
import {
  LbPosition,
  StrategyType,
  SwapParams,
  SwapExactOutParams,
  SwapWithPriceImpactParams,
} from '@meteora-ag/dlmm';
import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DlmmService {
  private connection: Connection;
  private readonly heliusMainnetUrl: string;

  constructor(private configService: ConfigService) {
    const heliusKey = this.configService.get<string>('HELIUS_API_KEY');

    if (!heliusKey) {
      throw new Error('HELIUS_API_KEY is not defined in environment variables');
    }

    this.heliusMainnetUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
    this.connection = new Connection(
      this.heliusMainnetUrl || 'https://api.mainnet-beta.solana.com',
      'confirmed',
    );
  }

  /**
   * Gets a pool address for a given token pair and parameters
   * @param params Parameters for finding the pool
   * @returns The pool public key if exists, or null if it doesn't
   */
  async getPairPublicKey(params: {
    tokenX: string;
    tokenY: string;
    binStep: number;
    baseFactor: number;
    cluster?: Cluster;
  }): Promise<string | null> {
    const poolAddress = await DLMM.getPairPubkeyIfExists(
      this.connection,
      new PublicKey(params.tokenX),
      new PublicKey(params.tokenY),
      new BN(params.binStep),
      new BN(params.baseFactor),
      { cluster: params.cluster || 'mainnet-beta' },
    );

    return poolAddress ? poolAddress.toString() : null;
  }

  /**
   * Get all LB pools
   * @param cluster The Solana cluster
   * @returns Array of LB pool accounts
   */
  async getAllPools(cluster: Cluster = 'mainnet-beta'): Promise<any[]> {
    const pairs = await DLMM.getLbPairs(this.connection, { cluster });

    return pairs.map((pair) => ({
      address: pair.publicKey.toString(),
      tokenX: pair.account.tokenXMint.toString(),
      tokenY: pair.account.tokenYMint.toString(),
      binStep: pair.account.binStep,
      activeId: pair.account.activeId,
      status: pair.account.status,
    }));
  }

  /**
   * Creates a DLMM instance for a specific pool
   * @param poolAddress The pool address
   * @param cluster The Solana cluster (optional)
   * @returns A DLMM instance
   */
  async createDlmmInstance(
    poolAddress: string,
    cluster: Cluster = 'mainnet-beta',
  ): Promise<DLMM> {
    const poolPublicKey = new PublicKey(poolAddress);
    return DLMM.create(this.connection, poolPublicKey, { cluster });
  }

  /**
   * Get active bin information
   * @param poolAddress The pool address
   * @returns The active bin information
   */
  async getActiveBin(poolAddress: string): Promise<any> {
    const dlmm = await this.createDlmmInstance(poolAddress);
    return dlmm.getActiveBin();
  }

  /**
   * Initializes a position and adds liquidity using a strategy
   * @param params Position and liquidity parameters
   * @returns Transaction to be signed and sent
   */
  async initializePositionAndAddLiquidityByStrategy(params: {
    poolAddress: string;
    positionKeypair: Keypair;
    userPublicKey: string;
    totalXAmount: string | number;
    totalYAmount: string | number;
    minBinId: number;
    maxBinId: number;
    strategyType: StrategyType;
    slippage?: number;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: params.positionKeypair.publicKey,
      user: new PublicKey(params.userPublicKey),
      totalXAmount: new BN(params.totalXAmount.toString()),
      totalYAmount: new BN(params.totalYAmount.toString()),
      strategy: {
        minBinId: params.minBinId,
        maxBinId: params.maxBinId,
        strategyType: params.strategyType,
      },
      slippage: params.slippage,
    });
  }

  /**
   * Create an empty position
   * @param params Parameters for creating an empty position
   * @returns Transaction to be signed and sent
   */
  async createEmptyPosition(params: {
    poolAddress: string;
    positionKeypair: Keypair;
    userPublicKey: string;
    minBinId: number;
    maxBinId: number;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.createEmptyPosition({
      positionPubKey: params.positionKeypair.publicKey,
      minBinId: params.minBinId,
      maxBinId: params.maxBinId,
      user: new PublicKey(params.userPublicKey),
    });
  }

  /**
   * Add more liquidity to an existing position using a strategy
   * @param params Parameters for adding liquidity
   * @returns Transaction to be signed and sent
   */
  async addLiquidityByStrategy(params: {
    poolAddress: string;
    positionPubKey: string;
    userPublicKey: string;
    totalXAmount: string | number;
    totalYAmount: string | number;
    minBinId: number;
    maxBinId: number;
    strategyType: StrategyType;
    slippage?: number;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.addLiquidityByStrategy({
      positionPubKey: new PublicKey(params.positionPubKey),
      user: new PublicKey(params.userPublicKey),
      totalXAmount: new BN(params.totalXAmount.toString()),
      totalYAmount: new BN(params.totalYAmount.toString()),
      strategy: {
        minBinId: params.minBinId,
        maxBinId: params.maxBinId,
        strategyType: params.strategyType,
      },
      slippage: params.slippage,
    });
  }

  /**
   * Remove liquidity from a position
   * @param params Parameters for removing liquidity
   * @returns Transaction(s) to be signed and sent
   */
  async removeLiquidity(params: {
    poolAddress: string;
    positionPubKey: string;
    userPublicKey: string;
    binIds: number[];
    bps: string | number;
    shouldClaimAndClose?: boolean;
  }): Promise<Transaction | Transaction[]> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.removeLiquidity({
      position: new PublicKey(params.positionPubKey),
      user: new PublicKey(params.userPublicKey),
      binIds: params.binIds,
      bps: new BN(params.bps.toString()),
      shouldClaimAndClose: params.shouldClaimAndClose || false,
    });
  }

  /**
   * Close a position
   * @param params Parameters for closing the position
   * @returns Transaction to be signed and sent
   */
  async closePosition(params: {
    poolAddress: string;
    owner: string;
    position: LbPosition;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.closePosition({
      owner: new PublicKey(params.owner),
      position: params.position,
    });
  }

  /**
   * Get all positions for a specific user in a specific pool
   * @param params Parameters for fetching positions
   * @returns User positions
   */
  async getPositionsByUserAndPool(params: {
    poolAddress: string;
    userPublicKey: string;
  }): Promise<{ activeBin: any; userPositions: LbPosition[] }> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.getPositionsByUserAndLbPair(
      new PublicKey(params.userPublicKey),
    );
  }

  /**
   * Get details about a specific position
   * @param params Parameters for fetching a position
   * @returns Position details
   */
  async getPosition(params: {
    poolAddress: string;
    positionPubKey: string;
  }): Promise<LbPosition> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.getPosition(new PublicKey(params.positionPubKey));
  }

  /**
   * Get swap quote for a specific amount
   * @param params Parameters for getting a swap quote
   * @returns Swap quote
   */
  async getSwapQuote(params: {
    poolAddress: string;
    inAmount: string | number;
    swapForY: boolean;
    allowedSlippage: string | number;
    isPartialFill?: boolean;
    maxExtraBinArrays?: number;
  }): Promise<any> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);
    const binArrays = await dlmm.getBinArrayForSwap(params.swapForY);

    return dlmm.swapQuote(
      new BN(params.inAmount.toString()),
      params.swapForY,
      new BN(params.allowedSlippage.toString()),
      binArrays,
      params.isPartialFill || false,
      params.maxExtraBinArrays || 0,
    );
  }

  /**
   * Create a swap transaction
   * @param params Parameters for creating a swap transaction
   * @returns Transaction to be signed and sent
   */
  async createSwapTransaction(params: SwapParams): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.lbPair.toString());

    return dlmm.swap(params);
  }

  /**
   * Create an exact-out swap transaction
   * @param params Parameters for creating an exact-out swap transaction
   * @returns Transaction to be signed and sent
   */
  async createExactOutSwapTransaction(
    params: SwapExactOutParams,
  ): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.lbPair.toString());

    return dlmm.swapExactOut(params);
  }

  /**
   * Create a swap with price impact transaction
   * @param params Parameters for creating a swap with price impact transaction
   * @returns Transaction to be signed and sent
   */
  async createSwapWithPriceImpactTransaction(
    params: SwapWithPriceImpactParams,
  ): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.lbPair.toString());

    return dlmm.swapWithPriceImpact(params);
  }

  /**
   * Claim LM rewards for a position
   * @param params Parameters for claiming LM rewards
   * @returns Transaction to be signed and sent
   */
  async claimLMReward(params: {
    poolAddress: string;
    owner: string;
    position: LbPosition;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.claimLMReward({
      owner: new PublicKey(params.owner),
      position: params.position,
    });
  }

  /**
   * Claim all LM rewards for multiple positions
   * @param params Parameters for claiming all LM rewards
   * @returns Transactions to be signed and sent
   */
  async claimAllLMRewards(params: {
    poolAddress: string;
    owner: string;
    positions: LbPosition[];
  }): Promise<Transaction[]> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.claimAllLMRewards({
      owner: new PublicKey(params.owner),
      positions: params.positions,
    });
  }

  /**
   * Claim swap fees for a position
   * @param params Parameters for claiming swap fees
   * @returns Transaction to be signed and sent
   */
  async claimSwapFee(params: {
    poolAddress: string;
    owner: string;
    position: LbPosition;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.claimSwapFee({
      owner: new PublicKey(params.owner),
      position: params.position,
    });
  }

  /**
   * Claim all swap fees for multiple positions
   * @param params Parameters for claiming all swap fees
   * @returns Transactions to be signed and sent
   */
  async claimAllSwapFee(params: {
    poolAddress: string;
    owner: string;
    positions: LbPosition[];
  }): Promise<Transaction[]> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.claimAllSwapFee({
      owner: new PublicKey(params.owner),
      positions: params.positions,
    });
  }

  /**
   * Claim all rewards (swap fees and LM rewards) for multiple positions
   * @param params Parameters for claiming all rewards
   * @returns Transactions to be signed and sent
   */
  async claimAllRewards(params: {
    poolAddress: string;
    owner: string;
    positions: LbPosition[];
  }): Promise<Transaction[]> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.claimAllRewards({
      owner: new PublicKey(params.owner),
      positions: params.positions,
    });
  }

  /**
   * Get bins around the active bin
   * @param params Parameters for getting bins around the active bin
   * @returns Bins around the active bin
   */
  async getBinsAroundActiveBin(params: {
    poolAddress: string;
    numberOfBinsToTheLeft: number;
    numberOfBinsToTheRight: number;
  }): Promise<{ activeBin: number; bins: any[] }> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.getBinsAroundActiveBin(
      params.numberOfBinsToTheLeft,
      params.numberOfBinsToTheRight,
    );
  }

  /**
   * Initialize bin arrays for the given bin array indexes
   * @param params Parameters for initializing bin arrays
   * @returns Transaction instructions
   */
  async initializeBinArrays(params: {
    poolAddress: string;
    binArrayIndexes: BN[];
    funder: string;
  }): Promise<any[]> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.initializeBinArrays(
      params.binArrayIndexes,
      new PublicKey(params.funder),
    );
  }

  /**
   * Create a permissionless LP pair
   * @param params Parameters for creating a permissionless LP pair
   * @returns Transaction to be signed and sent
   */
  async createCustomizablePermissionlessLbPair(params: {
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
    cluster: Cluster;
  }): Promise<Transaction> {
    return DLMM.createCustomizablePermissionlessLbPair(
      this.connection,
      new BN(params.binStep),
      new PublicKey(params.tokenX),
      new PublicKey(params.tokenY),
      new BN(params.activeId),
      new BN(params.feeBps),
      params.activationType,
      params.hasAlphaVault,
      new PublicKey(params.creatorKey),
      params.activationPoint ? new BN(params.activationPoint) : undefined,
      params.creatorPoolOnOffControl,
      { cluster: params.cluster },
    );
  }

  /**
   * Set pair status (enabled/disabled)
   * @param params Parameters for setting pair status
   * @returns Transaction to be signed and sent
   */
  async setPairStatus(params: {
    poolAddress: string;
    enabled: boolean;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.setPairStatus(params.enabled);
  }

  /**
   * Get fee information for a pool
   * @param poolAddress The pool address
   * @returns Fee information
   */
  async getFeeInfo(poolAddress: string): Promise<any> {
    const dlmm = await this.createDlmmInstance(poolAddress);

    return dlmm.getFeeInfo();
  }

  /**
   * Get dynamic fee for a pool
   * @param poolAddress The pool address
   * @returns Dynamic fee
   */
  async getDynamicFee(poolAddress: string): Promise<Decimal> {
    const dlmm = await this.createDlmmInstance(poolAddress);

    return dlmm.getDynamicFee();
  }

  /**
   * Converts a price to a bin ID
   * @param params Parameters for converting price to bin ID
   * @returns Bin ID
   */
  async getBinIdFromPrice(params: {
    poolAddress: string;
    price: number;
    min: boolean;
  }): Promise<number> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.getBinIdFromPrice(params.price, params.min);
  }

  /**
   * Sync pool with market price
   * @param params Parameters for syncing with market price
   * @returns Transaction to be signed and sent
   */
  async syncWithMarketPrice(params: {
    poolAddress: string;
    marketPrice: number;
    owner: string;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.syncWithMarketPrice(
      params.marketPrice,
      new PublicKey(params.owner),
    );
  }

  /**
   * Get all LB pair positions for a user
   * @param userPubKey The user's public key
   * @returns Map of positions
   */
  async getAllLbPairPositionsByUser(
    userPubKey: string,
    cluster: Cluster = 'mainnet-beta',
  ): Promise<Map<string, any>> {
    return DLMM.getAllLbPairPositionsByUser(
      this.connection,
      new PublicKey(userPubKey),
      { cluster },
    );
  }

  /**
   * Initialize a position by operator
   * @param params Parameters for initializing a position by operator
   * @returns Transaction to be signed and sent
   */
  async initializePositionByOperator(params: {
    poolAddress: string;
    lowerBinId: number;
    positionWidth: number;
    owner: string;
    feeOwner: string;
    base: string;
    operator: string;
    payer: string;
    lockReleasePoint: number;
  }): Promise<Transaction> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.initializePositionByOperator({
      lowerBinId: new BN(params.lowerBinId),
      positionWidth: new BN(params.positionWidth),
      owner: new PublicKey(params.owner),
      feeOwner: new PublicKey(params.feeOwner),
      base: new PublicKey(params.base),
      operator: new PublicKey(params.operator),
      payer: new PublicKey(params.payer),
      lockReleasePoint: new BN(params.lockReleasePoint),
    });
  }

  /**
   * Get locked position information for a pool
   * @param params Parameters for getting locked position information
   * @returns Locked position information
   */
  async getLbPairLockInfo(params: {
    poolAddress: string;
    lockDuration?: number;
  }): Promise<any> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.getLbPairLockInfo(params.lockDuration);
  }

  /**
   * Seed liquidity in a single bin
   * @param params Parameters for seeding liquidity in a single bin
   * @returns Transaction instructions
   */
  async seedLiquiditySingleBin(params: {
    poolAddress: string;
    payer: string;
    base: string;
    seedAmount: string | number;
    price: number;
    roundingUp: boolean;
    positionOwner: string;
    feeOwner: string;
    operator: string;
    lockReleasePoint: number;
    shouldSeedPositionOwner?: boolean;
  }): Promise<any[]> {
    const dlmm = await this.createDlmmInstance(params.poolAddress);

    return dlmm.seedLiquiditySingleBin(
      new PublicKey(params.payer),
      new PublicKey(params.base),
      new BN(params.seedAmount.toString()),
      params.price,
      params.roundingUp,
      new PublicKey(params.positionOwner),
      new PublicKey(params.feeOwner),
      new PublicKey(params.operator),
      new BN(params.lockReleasePoint),
      params.shouldSeedPositionOwner,
    );
  }
}
