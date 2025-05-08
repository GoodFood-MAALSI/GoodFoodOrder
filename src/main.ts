import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Initialiser la config
  const configService = app.get(ConfigService);

  // Pipe de validation global
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription("Documentation de l'API NestJS avec Swagger")
    .setVersion('1.0')
    .addServer(configService.get<string>('BACKEND_DOMAIN', 'http://localhost:3005'), 'Local dev')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  // Démarrage du serveur
  await app.listen(configService.get<number>('APP_PORT', 3005));
}
bootstrap();
