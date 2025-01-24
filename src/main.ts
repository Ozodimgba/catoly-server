import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Global exception filter
    app.useGlobalFilters();

    app.use(cookieParser());
    
    // Enable CORS
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: '*',
      credentials: false,
    });

    // Start the application
    const port = process.env.PORT || 4600;
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
