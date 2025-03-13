import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeckoModule } from './gecko/gecko.module';
import { DasModule } from './das/das.module';
import { ActionsModule } from './actions/actions.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { WhitelistModule } from './whitelist/whitelist.module';
import { ChatModule } from './chat/chat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { BackupModule } from './backup/backup.module';
import { RedisModule } from './redis/redis.module';
import { DlmmModule } from './dlmm/dlmm.module';


@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 3,
    }]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        console.log('Attempting to connect to MongoDB at:', uri);
        return { uri };
      },
      inject: [ConfigService],
    }),
    GeckoModule,
    DasModule,
    ActionsModule,
    AuthModule,
    WhitelistModule,
    AdminModule,
    ChatModule,
    UserModule,
    BackupModule,
    DlmmModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('AppModule initialized');
  }
}