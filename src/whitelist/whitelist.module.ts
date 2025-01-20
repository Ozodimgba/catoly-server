// src/whitelist/whitelist.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WhitelistController } from './whitelist.controller';
import { WhitelistService } from './whitelist.service';
import { AuthModule } from '../auth/auth.module'; 
import { 
  WhitelistedUser, 
  WhitelistedUserSchema,
  AccessCode,
  AccessCodeSchema 
} from './schemas/whitelist.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WhitelistedUser.name, schema: WhitelistedUserSchema },
      { name: AccessCode.name, schema: AccessCodeSchema }
    ]),
    AuthModule,
  ],
  controllers: [WhitelistController],
  providers: [WhitelistService],
  exports: [WhitelistService],
})
export class WhitelistModule {}