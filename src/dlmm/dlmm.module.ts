import { Module } from '@nestjs/common';
import { DlmmService } from './dlmm.service';
import { DlmmController } from './dlmm.controller';

@Module({
  providers: [DlmmService],
  controllers: [DlmmController]
})
export class DlmmModule {}
