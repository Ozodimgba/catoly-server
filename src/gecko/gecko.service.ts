import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  DexScreenerResponse,
  GeckoDexResponse,
  PoolResponse,
  ProfitableWalletsParams,
  SimplifiedPool,
  TopTrader,
  TopTraderParams,
  TradesResponse,
  WalletData,
  WalletPnlData,
  WalletPnlParams,
} from './gecko.types';
import axios from 'axios';
import { DasService } from 'src/das/das.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeckoService {
  private readonly baseUrl = 'https://api.geckoterminal.com/api/v2';
  private readonly dexscreener = 'https://api.dexscreener.com/latest/dex';
  private readonly astralane = 'https://graphql.astralane.io/api/v1';
  private readonly astralaneKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly dasService: DasService,
    private readonly configService: ConfigService,
  ) {
    this.astralaneKey = this.configService.get<string>('ASTRALANE_KEY');
  }

  async getDexsOnSolana(page: number = 1): Promise<GeckoDexResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GeckoDexResponse>(
          `${this.baseUrl}/networks/solana/dexes`,
          {
            params: { page },
            headers: {
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Failed to fetch Solana DEXes: ${error.response.data.message}`,
        );
      }
      throw new Error('Failed to fetch Solana DEXes');
    }
  }

  async getProfitableWallets(
    params: ProfitableWalletsParams = {},
  ): Promise<WalletData[]> {
    const { time = '10h', page = 1, limit = 10 } = params;

    try {
      const queryParams = new URLSearchParams({
        time: time.toString(),
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `${this.astralane}/dataset/profitable-wallets?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': this.astralaneKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as WalletData[];
    } catch (error) {
      console.error('Error fetching profitable wallets:', error);
      throw error;
    }
  }

  async getTopTraders(params: TopTraderParams): Promise<TopTrader[]> {
    const { token, time = '24h', limit = 20, offset = 0 } = params;

    try {
      const queryParams = new URLSearchParams({
        token: token,
        time: time.toString(),
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(
        `${this.astralane}/dataset/top-traders?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': this.astralaneKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as TopTrader[];
    } catch (error) {
      console.error('Error fetching top traders:', error);
      throw new Error(`Failed to fetch top traders: ${error.message}`);
    }
  }

  async getWalletPnl(params: WalletPnlParams): Promise<WalletPnlData> {
    const { time = '24h', wallet } = params;

    // Ensure wallet address is provided
    if (!wallet) {
      throw new Error('Wallet address is required');
    }

    try {
      const queryParams = new URLSearchParams({
        time: time.toString(),
        wallet: wallet.toString(),
      });

      const response = await fetch(
        `${this.astralane}/dataset/wallet-pnl?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': this.astralaneKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as WalletPnlData;
    } catch (error) {
      console.error('Error fetching wallet PNL:', error);
      throw error;
    }
  }

  async getPoolsForToken(
    tokenAddress: string,
    page: number = 1,
    include?: string,
    sort: string = 'h24_volume_usd_liquidity_desc',
    detail: boolean | string = false,
  ): Promise<PoolResponse | SimplifiedPool[]> {
    const showDetail = detail === true || detail === 'true';

    try {
      const response = await firstValueFrom(
        this.httpService.get<PoolResponse>(
          `${this.baseUrl}/networks/solana/tokens/${tokenAddress}/pools`,
          {
            params: {
              page,
              include,
              sort,
            },
            headers: {
              Accept: 'application/json',
            },
          },
        ),
      );

      if (!showDetail) {
        return response.data.data.map((pool) => ({
          dex: pool.relationships.dex.data.id,
          address: pool.attributes.address,
          fdv_usd: pool.attributes.fdv_usd,
        }));
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Token not found for address ${tokenAddress}`);
      }
      throw new Error('Failed to fetch Solana token pools');
    }
  }

  async getPoolOhlcvs(
    poolAddress: string,
    timeframe: 'day' | 'hour' | 'minute' = 'day',
    aggregate?: string,
    beforeTimestamp?: string,
    limit?: string,
    currency: 'usd' | 'token' = 'usd',
    token: 'base' | 'quote' | string = 'base',
  ): Promise<PoolResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<PoolResponse>(
          `${this.baseUrl}/networks/solana/pools/${poolAddress}/ohlcv/${timeframe}`,
          {
            params: {
              aggregate,
              before_timestamp: beforeTimestamp,
              limit,
              currency,
              token,
            },
            headers: {
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        throw new Error('Pool with more than 2 tokens is not supported');
      }
      throw new Error('Failed to fetch OHLCV data');
    }
  }

  async getTheLastTradesInADay(
    poolAddress: string,
    tradeVolumeInUsdGreaterThan?: number,
  ): Promise<TradesResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<TradesResponse>(
          `${this.baseUrl}/networks/solana/pools/${poolAddress}/trades`,
          {
            params: {
              trade_volume_in_usd_greater_than: tradeVolumeInUsdGreaterThan,
            },
            headers: {
              Accept: 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new NotFoundException('Pool not found');
      }
      throw new Error('Failed to fetch trades data');
    }
  }

  async searchPairs(query: string): Promise<DexScreenerResponse> {
    try {
      const response = await axios.get<DexScreenerResponse>(
        `${this.dexscreener}/search`,
        {
          params: { q: query },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch DEX pairs: ${error.message}`);
    }
  }

  async getOhlcvForToken(
    tokenAddress: string,
    timeframe?: 'day' | 'hour' | 'minute',
  ): Promise<any> {
    try {
      // Cast the response to SimplifiedPool[]
      const pools = (await this.getPoolsForToken(
        tokenAddress,
        1,
      )) as SimplifiedPool[];

      if (pools.length === 0) {
        throw new Error('No pools found for token');
      }

      return await this.getPoolOhlcvs(pools[0].address, timeframe);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
