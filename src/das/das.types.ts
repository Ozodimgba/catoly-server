// Base interface for network options
export interface BaseOptions {
  network?: 'mainnet' | 'devnet';
}

export interface HeliusResponse {
  jsonrpc: string;
  result: {
    id: string;
    content: any;
    authorities: string[];
    compression: any;
    ownership: any;
    supply: any;
    creators: any[];
    grouping: any[];
    royalty: any;
    mutable: boolean;
    burnt: boolean;
    [key: string]: any;
  };
  id: string;
}

export interface PriceInfo {
  price_per_token: number;
  total_price: number;
  currency: string;
}

export interface TokenInfo {
  symbol: string;
  balance: number;
  supply: number;
  decimals: number;
  token_program: string;
  associated_token_address: string;
  price_info?: PriceInfo;
}

interface Content {
  $schema: string;
  json_uri: string;
  files: Array<{
    uri: string;
    cdn_uri: string;
    mime: string;
  }>;
  metadata: {
    description: string;
    name: string;
    symbol: string;
    token_standard: string;
  };
  links: {
    image: string;
  };
}

interface Compression {
  eligible: boolean;
  compressed: boolean;
  data_hash: string;
  creator_hash: string;
  asset_hash: string;
  tree: string;
  seq: number;
  leaf_id: number;
}

interface Ownership {
  frozen: boolean;
  delegated: boolean;
  delegate: string | null;
  ownership_model: string;
  owner: string;
}

interface Authority {
  address: string;
  scopes: string[];
}

export interface Asset {
  interface: 'V1_NFT' | 'FungibleToken' | string;
  id: string;
  content: Content;
  authorities: Authority[];
  compression: Compression;
  ownership: Ownership;
  supply: any;
  creators: any[];
  grouping: any[];
  royalty: any;
  mutable: boolean;
  burnt: boolean;
  token_info?: TokenInfo;
  [key: string]: any;
}

export interface FilteredAsset {
  interface: 'V1_NFT' | 'FungibleToken' | string;
  id: string;
  metadata: Content['metadata'];
  links?: {
    image: string;
  };
  address: string;
  compressed: boolean;
  token_info?: TokenInfo;
}

export interface GetAssetsByOwnerResponseWithFiltered {
  items: Asset[] | FilteredAsset[];
  total: number;
  limit: number;
  page: number;
  before: string | null;
  after: string | null;
}

export interface GetAssetsByOwnerResponse {
  jsonrpc: string;
  result: {
    total: number;
    limit: number;
    page: number;
    before: string | null;
    after: string | null;
    items: Array<Asset>;
  };
  id: string;
}

export interface AssetsByOwnerOptions {
  showUnverifiedCollections?: boolean;
  showCollectionMetadata?: boolean;
  showGrandTotal?: boolean;
  showFungible?: boolean;
  showNativeBalance?: boolean;
  showInscription?: boolean;
  showZeroBalance?: boolean;
}

export interface GetAssetParams extends BaseOptions {
  id: string;
}

export interface GetAssetsByOwnerParams extends BaseOptions {
  ownerAddress: string;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
  options?: AssetsByOwnerOptions;
}

export interface PortfolioValue {
  totalValue: number;
  tokens: Array<{
    symbol: string;
    balance: number;
    decimals: number;
    pricePerToken: number;
    value: number;
    currency: string;
  }>;
}

export interface TokenValue {
  symbol: string;
  balance: number;
  decimals: number;
  pricePerToken: number;
  value: number;
  currency: string;
}

export interface PortfolioSummary {
  summary: {
    totalValue: number;
    tokenCount: number;
    primaryCurrency: string;
  };
  detail: {
    tokens: Array<TokenValue & { percentOfPortfolio: string }>;
  };
}

export interface NativeBalanceResponse {
  jsonrpc: string;
  result: {
    items: any[];
    nativeBalance: {
      lamports: number;
      price_per_sol?: number;
      total_price?: number;
    };
  };
  id: string;
}

export interface FormattedNativeBalance {
  balance: number;
  balanceFormatted: string;
  valueInUsd: number | null;
  pricePerSol: number | null;
}

export interface TokenBalance {
  amount: number;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

export interface TokenData {
  timestamp: string;
  token: string;
  price_in_sol: number;
  price_in_usd: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI: string;
  marketCap: number;
  supply: number;
}

export interface ParsedTokenAccountData {
  program: string;
  parsed: {
    info: {
      mint: string;
      owner: string;
      state: string;
      tokenAmount: TokenBalance;
    };
    type: string;
  };
}

export interface JupiterPriceResponse {
  data: {
    [key: string]: {
      id: string;
      mintSymbol: string;
      vsToken: string;
      vsTokenSymbol: string;
      price: string;
    };
  };
}

//tech debt +> used any because didnt have time to check types
export interface TokenPriceResponse {
  tokenAddress: string;
  name: string;
  price: any;
  symbol?: string;
  supply: string;
  marketCap: any;
}

export interface TLDResponse {
  tlds: string[];
}

export interface BlockTransaction {
  index: number;
  signature?: string;
  meta: any;
  invocations: Map<string, number>;
}

export interface BlockTransactionResponse {
  status: 'success' | 'error';
  oldest?: string;
  result?: any[];
  message?: string;
}

export interface SignaturesResponse {
  jsonrpc: string;
  result: {
    total: number;
    limit: number;
    page: number;
    items: string[][];
  };
  id: string;
}

export interface CNFTTransactionResponse {
  status: 'success' | 'error';
  oldest?: string;
  result?: any[];
  message?: string;
}

export interface SlotResponse {
  status: 'success' | 'error';
  slot?: number;
  message?: string;
}

export interface RawTransactionResponse {
  status: 'success' | 'error';
  transaction?: any;
  message?: string;
}

export interface EnrichedTransactionResponse {
  status: 'success' | 'error';
  transaction?: any;
  message?: string;
}

export interface TransactionsResponse {
  status: 'success' | 'error';
  message?: string;
  oldest?: string;
  result?: any[];
}

export interface TPSResponse {
  status: 'success' | 'error';
  tps?: number;
  message?: string;
}

export interface Username {
  type: string;
  username: string;
}

export interface NiftyAssetResponse {
  status: 'success' | 'error';
  assetData?: any;
  message?: string;
}

export interface DomainResponse {
  status: 'success' | 'error';
  usernames?: Username[];
  message?: string;
}

export interface DomainResolveResponse {
  address?: string;
  message?: string;
}

// New parameter interfaces for functions
export interface GetPortfolioParams extends BaseOptions {
  ownerAddress: string;
}

export interface GetBalanceParams extends BaseOptions {
  ownerAddress: string;
}

export interface GetWalletPortfolioParams extends BaseOptions {
  ownerAddress: string;
}

export interface GetCompleteBalanceParams extends BaseOptions {
  ownerAddress: string;
}

export interface GetTokenBalanceParams extends BaseOptions {
  walletAddress: string;
  tokenAddress?: string;
}

export interface GetPriceParams extends BaseOptions {
  tokenAddress: string;
}

export interface GetBlockTransactionsParams extends BaseOptions {
  slot: number;
  cursor?: string;
  limit?: number;
}

export interface GetCNFTTransactionsParams extends BaseOptions {
  assetId: string;
  page?: number;
  limit?: number;
}

export interface GetTLDParams extends BaseOptions {}

export interface GetSlotParams extends BaseOptions {}
export interface GetTransactionParams extends BaseOptions {
  signature: string;
  account?: string;
}
export interface GetAccountTransactionsParams extends BaseOptions {
  account: string;
  options?: {
    cursor?: string;
    filter?: string;
    user?: string;
  };
}

export interface GetNiftyAssetParams extends BaseOptions {
  assetAddress: string;
}

export interface GetDomainParams extends BaseOptions {
  address?: string;
}

export interface ResolveDomainParams extends BaseOptions {
  domain: string;
}

interface TokenExtensions {
  coingeckoId: string;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
  created_at: string;
  freeze_authority: string | null;
  mint_authority: string | null;
  permanent_delegate: string | null;
  minted_at: string | null;
  extensions: TokenExtensions;
}

export interface SearchResponse {
  success: boolean;
  token: Token | null;
  length: number;
  error?: string;
}

export interface GetAssetsParams {
  ids: string[];
  network?: 'mainnet' | 'devnet';
}

export interface TokenMetadata {
  mintAddress: string;
  metadataAddress: string;
  name: string;
  symbol: string;
  uri: string;
  image?: string;
  sellerFeeBasisPoints: number;
  primarySaleHappened: boolean;
  isMutable: boolean;
  decimals: number;
  supply: string;
}

// Define types for the response
// export interface HeliusResponse {
//   jsonrpc: string;
//   result: {
//     id: string;
//     content: any;
//     authorities: string[];
//     compression: any;
//     ownership: any;
//     supply: any;
//     creators: any[];
//     grouping: any[];
//     royalty: any;
//     mutable: boolean;
//     burnt: boolean;
//     [key: string]: any;
//   };
//   id: string;
// }

// export interface PriceInfo {
//   price_per_token: number;
//   total_price: number;
//   currency: string;
// }

// export interface TokenInfo {
//   symbol: string;
//   balance: number;
//   supply: number;
//   decimals: number;
//   token_program: string;
//   associated_token_address: string;
//   price_info?: PriceInfo;
// }

// export interface Asset {
//   interface: 'V1_NFT' | 'FungibleToken' | string;
//   id: string;
//   content: any;
//   authorities: string[];
//   compression: any;
//   ownership: any;
//   supply: any;
//   creators: any[];
//   grouping: any[];
//   royalty: any;
//   mutable: boolean;
//   burnt: boolean;
//   token_info?: TokenInfo;
//   [key: string]: any;
// }

// export interface GetAssetsByOwnerResponse {
//   jsonrpc: string;
//   result: {
//     total: number;
//     limit: number;
//     page: number;
//     before: string | null;
//     after: string | null;
//     items: Array<Asset>;
//   };
//   id: string;
// }

// export interface AssetsByOwnerOptions {
//   showUnverifiedCollections?: boolean;
//   showCollectionMetadata?: boolean;
//   showGrandTotal?: boolean;
//   showFungible?: boolean;
//   showNativeBalance?: boolean;
//   showInscription?: boolean;
//   showZeroBalance?: boolean;
// }

// export interface GetAssetParams {
//   id: string;
// }

// export interface GetAssetsByOwnerParams {
//   ownerAddress: string;
//   page?: number;
//   limit?: number;
//   before?: string;
//   after?: string;
//   options?: AssetsByOwnerOptions;
// }

// export interface PortfolioValue {
//   totalValue: number;
//   tokens: Array<{
//     symbol: string;
//     balance: number;
//     decimals: number;
//     pricePerToken: number;
//     value: number;
//     currency: string;
//   }>;
// }

// export interface TokenValue {
//   symbol: string;
//   balance: number;
//   decimals: number;
//   pricePerToken: number;
//   value: number;
//   currency: string;
// }

// export interface PortfolioSummary {
//   summary: {
//     totalValue: number;
//     tokenCount: number;
//     primaryCurrency: string;
//   };
//   detail: {
//     tokens: Array<TokenValue & { percentOfPortfolio: string }>;
//   };
// }

// export interface NativeBalanceResponse {
//   jsonrpc: string;
//   result: {
//     items: any[];
//     nativeBalance: {
//       lamports: number;
//       price_per_sol?: number;
//       total_price?: number;
//     };
//   };
//   id: string;
// }

// export interface FormattedNativeBalance {
//   balance: number;
//   balanceFormatted: string;
//   valueInUsd: number | null;
//   pricePerSol: number | null;
// }

// export interface TokenBalance {
//   amount: number;
//   decimals: number;
//   uiAmount: number;
//   uiAmountString: string;
// }

// export interface ParsedTokenAccountData {
//   program: string;
//   parsed: {
//     info: {
//       mint: string;
//       owner: string;
//       state: string;
//       tokenAmount: TokenBalance;
//     };
//     type: string;
//   };
// }

// export interface JupiterPriceResponse {
//   data: {
//     [key: string]: {
//       id: string;
//       mintSymbol: string;
//       vsToken: string;
//       vsTokenSymbol: string;
//       price: string;
//     };
//   };
// }

// export interface TokenPriceResponse {
//   price: string;
//   symbol?: string;
//   vsToken: string;
//   vsTokenSymbol: string;
// }

// export interface TLDResponse {
//   tlds: string[];
// }

// export interface BlockTransaction {
//   index: number;
//   signature?: string;
//   meta: any;
//   invocations: Map<string, number>;
// }

// export interface BlockTransactionResponse {
//   status: 'success' | 'error';
//   oldest?: string;
//   result?: any[];
//   message?: string;
// }

// export interface SignaturesResponse {
//   jsonrpc: string;
//   result: {
//     total: number;
//     limit: number;
//     page: number;
//     items: string[][];
//   };
//   id: string;
// }

// export interface CNFTTransactionResponse {
//   status: 'success' | 'error';
//   oldest?: string;
//   result?: any[];
//   message?: string;
// }

// // export interface MerkleTreeResult {
// //   authority: string;
// //   canopyDepth: number;
// //   creationSlot: number;
// //   maxBufferSize: number;
// //   rightMostIndex: number;
// //   root: string;
// //   seq: string;
// //   treeHeight: number;
// // }

// // export interface MerkleTreeResponse {
// //   status: 'success' | 'error';
// //   result?: MerkleTreeResult;
// //   message?: string;
// // }

// export interface SlotResponse {
//   status: 'success' | 'error';
//   slot?: number;
//   message?: string;
// }

// export interface RawTransactionResponse {
//   status: 'success' | 'error';
//   transaction?: any;
//   message?: string;
// }

// export interface EnrichedTransactionResponse {
//   status: 'success' | 'error';
//   transaction?: any;
//   message?: string;
// }

// export interface TransactionsResponse {
//   status: 'success' | 'error';
//   oldest?: string;
//   result?: any[];
//   message?: string;
// }

// export interface TPSResponse {
//   status: 'success' | 'error';
//   tps?: number;
//   message?: string;
// }

// export interface Username {
//   type: string;
//   username: string;
// }

// export interface NiftyAssetResponse {
//   status: 'success' | 'error';
//   assetData?: any;
//   message?: string;
// }

// export interface DomainResponse {
//   status: 'success' | 'error';
//   usernames?: Username[];
//   message?: string;
// }

// export interface DomainResolveResponse {
//   address?: string;
//   message?: string;
// }
