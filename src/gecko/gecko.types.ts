export interface DexData {
  id: string;
  type: string;
  attributes: {
    name: string;
  };
}

export interface GeckoDexResponse {
  data: DexData[];
}

interface TransactionMetrics {
  buys: number;
  sells: number;
  buyers: number;
  sellers: number;
}

interface PriceChangePercentage {
  m5?: string;
  h1?: string;
  h6?: string;
  h24?: string;
}

interface VolumeUSD {
  m5?: string;
  h1?: string;
  h6?: string;
  h24?: string;
}

interface Transactions {
  m5?: TransactionMetrics;
  m15?: TransactionMetrics;
  m30?: TransactionMetrics;
  h1?: TransactionMetrics;
  h24?: TransactionMetrics;
}

interface TokenRelationship {
  data: {
    id: string;
    type: string;
  };
}

interface DexRelationship {
  data: {
    id: string;
    type: string;
  };
}

interface PoolRelationships {
  base_token: TokenRelationship;
  quote_token: TokenRelationship;
  dex: DexRelationship;
}

export interface PoolResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      name: string;
      address: string;
      base_token_price_usd: string;
      quote_token_price_usd: string;
      base_token_price_native_currency: string;
      quote_token_price_native_currency: string;
      base_token_price_quote_token: string;
      quote_token_price_base_token: string;
      pool_created_at: string;
      token_price_usd: string;
      reserve_in_usd: string;
      fdv_usd: string;
      market_cap_usd: string | null;
      price_change_percentage: PriceChangePercentage;
      transactions: Transactions;
      volume_usd: VolumeUSD;
    };
    relationships: PoolRelationships;
  }>;
}

export interface SimplifiedPool {
  dex: string;
  address: string;
  fdv_usd: string | null;
}

export interface OhlcvResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      ohlcv_list: [number, number, number, number, number, number][]; // [timestamp, open, high, low, close, volume]
    };
  };
  meta: {
    base: {
      address: string;
      name: string;
      symbol: string;
      coingecko_coin_id: string;
    };
    quote: {
      address: string;
      name: string;
      symbol: string;
      coingecko_coin_id: string;
    };
  };
}

export interface Trade {
  id: string;
  type: string;
  attributes: {
    block_number: number;
    block_timestamp: string;
    tx_hash: string;
    tx_from_address: string;
    from_token_amount: string;
    to_token_amount: string;
    price_from_in_currency_token: string;
    price_to_in_currency_token: string;
    price_from_in_usd: string;
    price_to_in_usd: string;
    kind: string;
    volume_in_usd: string;
    from_token_address: string;
    to_token_address: string;
  };
}

export interface TradesResponse {
  data: Trade[];
}
interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
}

interface Transactions {
  buys: number;
  sells: number;
}

interface TimeMetrics {
  m5: number;
  h1: number;
  h6: number;
  h24: number;
}

interface Social {
  type: string;
  url: string;
}

interface Website {
  label: string;
  url: string;
}

interface PairInfo {
  imageUrl?: string;
  header?: string;
  openGraph?: string;
  websites?: Website[];
  socials?: Social[];
}

interface PairData {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: string[];
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  priceNative: string;
  priceUsd: string;
  txns: Record<keyof TimeMetrics, Transactions>;
  volume: TimeMetrics;
  priceChange: TimeMetrics;
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt: number;
  info: PairInfo;
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: PairData[];
}

export interface TrendingPool {
  tokenName: string;
  address: string;
  marketCap: number;
  price_change_in_m5: number;
  image?: string;
}

export interface WalletData {
  wallet: string;
  pnl_overview: number;
  trade_volume: number;
  trade_count: number;
}

export interface ProfitableWalletsParams {
  time?: string; // e.g., "10h"
  page?: number;
  limit?: number;
}

export interface TopTraderParams {
  token: string;
  time?: string;
  limit?: number;
  offset?: number;
}

export interface TopTrader {
  wallet: string;
  trade_volume: number;
  trade_count: number;
  volume_buy: number;
  volume_sell: number;
}

export interface TopTradersParams {
  token?: string;
  time?: string;
  limit?: number;
  offset?: number;
}

export interface TraderData {
  address: string;
  profit: number;
  trades: number;
}

export interface WalletPnlParams {
  time?: string;
  wallet: string;
}

export interface WalletPnlData {
  wallet: string;
  totalPnl: number;
  dailyPnl: number[];
  timestamps: string[];
}
