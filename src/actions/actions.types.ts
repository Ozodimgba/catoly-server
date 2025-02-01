import { PublicKey } from '@solana/web3.js';

export type ImageSize = '256x256' | '512x512' | '1024x1024';

export interface BaseOptions {
  network?: 'mainnet' | 'devnet';
}

export interface ImageGenerationResponse {
  images: string[];
}

export interface TipLinkOptions extends BaseOptions {
  amount: number;
  splMintAddress?: string;
}

export interface TipLinkResponse {
  url: string;
  signature: string;
}

export interface Creator {
  address: string;
  percentage: number;
}

export interface CollectionOptions extends BaseOptions {
  name: string;
  uri: string;
  royaltyBasisPoints?: number;
  creators?: Creator[];
}

export interface CollectionDeployment {
  collectionAddress: PublicKey;
  signature: string;
}

export interface TokenDeploymentOptions extends BaseOptions {
  name: string;
  uri: string;
  symbol: string;
  decimals?: number;
  initialSupply?: number;
}

export interface TokenDeploymentResponse {
  mint: PublicKey;
}

export interface PumpFunTokenOptions extends BaseOptions {
  twitter?: string;
  telegram?: string;
  website?: string;
  initialLiquiditySOL?: number;
  slippageBps?: number;
  priorityFee?: number;
}

export interface PumpfunLaunchResponse {
  signature: string;
  mint: string;
  metadataUri: string;
}

export interface LendingOptions extends BaseOptions {
  amount: number;
}

export interface LendingResponse {
  signature: string;
}

export interface NFTMetadata {
  name: string;
  uri: string;
  sellerFeeBasisPoints?: number;
  creators?: Array<{
    address: string;
    share: number;
  }>;
}

export interface MintNFTOptions extends BaseOptions {
  collectionAddress: string;
  metadata: NFTMetadata;
  recipientAddress?: string;
}

export interface MintCollectionNFTResponse {
  mint: PublicKey;
  metadata: PublicKey;
}

export interface FaucetOptions extends BaseOptions {
  amount?: number;
}

export interface FaucetResponse {
  signature: string;
}

export interface TokenCheck {
  // Add the specific fields from your TokenCheck type
  [key: string]: any;
}

export interface AirdropRecipient {
  address: string;
}

export interface AirdropOptions extends BaseOptions {
  mintAddress: string;
  amount: number;
  decimals: number;
  recipients: AirdropRecipient[];
  priorityFeeInLamports: number;
  shouldLog?: boolean;
}

export interface AirdropCostEstimate {
  estimatedCost: number;
}

export interface AirdropResponse {
  signatures: string[];
}

export interface StakeOptions extends BaseOptions {
  amount: number;
}

export interface StakeResponse {
  signature: string;
}

export interface NFTListingOptions extends BaseOptions {
  nftMint: string;
  price: number;
}

export interface NFTListingResponse {
  signature: string;
}

export interface TradeOptions extends BaseOptions {
  outputMint: string;
  inputAmount: number;
  inputMint?: string;
  slippageBps?: number;
}

export interface TradeResponse {
  signature: string;
}

export interface TransferOptions extends BaseOptions {
  recipient: string;
  amount: number;
  mintAddress?: string;
}

export interface TransferResponse {
  signature: string;
}

export interface RPSGameOptions extends BaseOptions {
  amount: number;
  choice: 'rock' | 'paper' | 'scissors';
}

export interface RPSGameResponse {
  outcome: string;
}

/// rug check details
interface IMintAccount {
  mintAuthority: string | null;
  supply: number;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: null;
}

interface ITokenMeta {
  name: string;
  symbol: string;
  uri: string;
  mutable: boolean;
  updateAuthority: string;
}

export interface ITokenHolder {
  address: string;
  amount: number;
  decimals: number;
  pct: number;
  uiAmount: number;
  uiAmountString: string;
  owner: string;
  insider: boolean;
}

interface IRisk {
  name: string;
  value: string;
  description: string;
  score: number;
  level: string;
}

interface IFileMeta {
  description: string;
  name: string;
  symbol: string;
  image: string;
}

interface ITransferFee {
  pct: number;
  maxAmount: number;
  authority: string;
}

interface ILiquidityAccount {
  mint: string;
  owner: string;
  amount: number;
  delegate: null;
  state: number;
  delegatedAmount: number;
  closeAuthority: null;
}

interface ILPHolder {
  address: string;
  amount: number;
  decimals: number;
  pct: number;
  uiAmount: number;
  uiAmountString: string;
  owner: string;
  insider: boolean;
}

interface ILP {
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  quotePrice: number;
  basePrice: number;
  base: number;
  quote: number;
  reserveSupply: number;
  currentSupply: number;
  quoteUSD: number;
  baseUSD: number;
  pctReserve: number;
  pctSupply: number;
  holders: ILPHolder[] | null;
  totalTokensUnlocked: number;
  tokenSupply: number;
  lpLocked: number;
  lpUnlocked: number;
  lpLockedPct: number;
  lpLockedUSD: number;
  lpMaxSupply: number;
  lpCurrentSupply: number;
  lpTotalSupply: number;
}

export interface IMarket {
  pubkey: string;
  marketType: string;
  mintA: string;
  mintB: string;
  mintLP: string;
  liquidityA: string;
  liquidityB: string;
  mintAAccount: IMintAccount;
  mintBAccount: IMintAccount;
  mintLPAccount: IMintAccount;
  liquidityAAccount: ILiquidityAccount;
  liquidityBAccount: ILiquidityAccount;
  lp: ILP;
}

export interface IGraphInsiderReport {
  senders: null;
  receivers: null;
  totalSent: number;
  rawGraphData: null;
  blacklisted: boolean;
}

export interface ITokenData {
  mint: string;
  tokenProgram: string;
  creator?: null;
  token: IMintAccount;
  tokenExtensions: null;
  tokenMeta: ITokenMeta;
  image: string;
  holderSummary: {
    percentageOfTopHolders: number;
    holderSummary: ISummary;
  };
  topHolders?: ITokenHolder[];
  freezeAuthority?: null;
  mintAuthority: null;
  risks: IRisk[];
  score: number;
  fileMeta?: IFileMeta;
  lockerOwners?: Record<string, unknown>;
  lockers?: Record<string, unknown>;
  lpLockers?: null;
  markets?: IMarket[];
  totalMarketLiquidity?: number;
  totalLPProviders?: number;
  rugged: boolean;
  tokenType?: string;
  transferFee?: ITransferFee;
  knownAccounts: {
    [key: string]: {
      name: string;
      type: string;
    };
  };
  events?: any[];
  verification?: null;
  graphInsidersDetected?: number;
  graphInsiderReport?: IGraphInsiderReport;
  detectedAt?: string;
}

export interface ITokenResponse {
  data: ITokenData;
  status?: number;
  message?: string;
}

export type TokenDataResponse = {
  data: ITokenData;
  status?: 200 | 400 | 404 | 500;
  message?: string;
};

export interface HolderAnalysis {
  address: string;
  pct: number;
  isMarket: boolean;
  marketType?: string;
  marketPubkey?: string;
}

export interface ISummary {
  marketHoldingPct: number;
  nonMarketHoldingPct: number;
  marketHolders: number;
  nonMarketHolders: number;
}

interface MarketHolder {
  address: string;
  pct: number;
  marketPubkey: string;
}

export interface MarketTypeGroup {
  totalPct: number;
  holders: MarketHolder[];
}