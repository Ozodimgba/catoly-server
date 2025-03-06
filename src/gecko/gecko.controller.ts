import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { GeckoService } from './gecko.service';
import {
  GeckoDexResponse,
  PoolResponse,
  SimplifiedPool,
  TopTrader,
} from './gecko.types';
import { HttpService } from '@nestjs/axios';

@Controller('gecko')
export class GeckoController {
  constructor(
    private readonly geckoService: GeckoService,
    private readonly httpService: HttpService,
  ) {}

  @Get('solana/dexes')
  getDexsOnSolana(@Query('page') page: number = 1): Promise<GeckoDexResponse> {
    return this.geckoService.getDexsOnSolana(page);
  }

  @Get('tokens/:tokenAddress/pools')
  getPoolsForToken(
    @Param('tokenAddress') tokenAddress: string,
    @Query('page') page: number = 1,
    @Query('include') include?: string,
    @Query('sort') sort: string = 'h24_volume_usd_liquidity_desc',
    @Query('detail') detail?: boolean,
  ): Promise<PoolResponse | SimplifiedPool[]> {
    return this.geckoService.getPoolsForToken(
      tokenAddress,
      page,
      include,
      sort,
      detail,
    );
  }

  @Get('pools/:poolAddress/ohlcv/:timeframe')
  async getPoolOhlcvs(
    @Param('poolAddress') poolAddress: string,
    @Param('timeframe') timeframe: 'day' | 'hour' | 'minute',
    @Query('aggregate') aggregate?: string,
    @Query('before_timestamp') beforeTimestamp?: string,
    @Query('limit') limit?: string,
    @Query('currency') currency?: 'usd' | 'token',
    @Query('token') token?: 'base' | 'quote' | string,
  ) {
    return await this.geckoService.getPoolOhlcvs(
      poolAddress,
      timeframe,
      aggregate,
      beforeTimestamp,
      limit,
      currency,
      token,
    );
  }

  @Get('pools/:poolAddress/trades')
  async getTheLastTradesInADay(
    @Param('poolAddress') poolAddress: string,
    @Query('min_volume') minVolume?: number,
  ) {
    return await this.geckoService.getTheLastTradesInADay(
      poolAddress,
      minVolume,
    );
  }

  @Get('top-traders/:token')
  async getTopTraders(
    @Param('token') token: string,
    @Query('time') time: string = '24h',
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<TopTrader[]> {
    return this.geckoService.getTopTraders({
      token,
      time,
      limit,
      offset,
    });
  }

  @Get('wallet-pnl/:wallet')
  getWalletPnl(
    @Param('wallet') wallet: string,
    @Query('time') time: string = '24h',
  ) {
    if (!wallet) {
      throw new BadRequestException('Wallet address is required');
    }

    return this.geckoService.getWalletPnl({
      time,
      wallet,
    });
  }

  @Get('profitable-wallets')
  getProfitableWallets(
    @Query('time') time: string = '10h',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 30,
  ) {
    return this.geckoService.getProfitableWallets({
      time,
      page,
      limit,
    });
  }

  @Get('search')
  async searchPairs(@Query('q') query: string) {
    return await this.geckoService.searchPairs(query);
  }

  @Get('chart/:tokenAddress/:timeframe')
  async getTokenChart(
    @Param('tokenAddress') tokenAddress: string,
    @Param('timeframe') timeframe: 'day' | 'hour' | 'minute',
  ): Promise<any> {
    return this.geckoService.getOhlcvForToken(tokenAddress, timeframe);
  }
}
