import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './domain/utils/interceptors/response.interceptor';
import { AllExceptionsFilter } from './domain/utils/filters/http-exception.filter';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import { OrderStatusSeeder } from './database/seeders/order-status.seeder';
import { OrdersSeeder } from './database/seeders/orders.seeder';
// Ajoute d'autres seeders si nécessaires

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS avec les bonnes options
  app.enableCors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Pipe de validation global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      forbidNonWhitelisted: true,
    }),
  );

  // Format des réponses/exceptions
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription("Documentation de l'API NestJS avec Swagger")
    .setVersion('1.0')
    .addTag('App', "Point d'entrée de l'api")
    .addServer(
      process.env.BACKEND_DOMAIN || 'http://localhost:3005',
      'Local dev',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  if (
    process.env.NODE_ENV === 'development' &&
    process.env.RUN_SEEDERS === 'true'
  ) {
    console.log('Running database seeders for order API...');
    const dataSource = app.get(DataSource);
    try {
      await runSeeders(dataSource, {
        seeds: [OrderStatusSeeder, OrdersSeeder],
      });
      console.log('Seeders executed successfully for order API.');
    } catch (error) {
      console.error('Error running seeders for order API:', error);
      throw error;
    }
  }

  // Démarrage du serveur
  await app.listen(process.env.APP_PORT);
}

bootstrap();
