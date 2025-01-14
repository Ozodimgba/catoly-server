// actions.module.ts
import { Module } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';

@Module({
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}