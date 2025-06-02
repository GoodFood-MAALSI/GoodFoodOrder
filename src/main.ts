import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ResponseInterceptor } from './domain/utils/interceptors/response.interceptor';
import { AllExceptionsFilter } from './domain/utils/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS avec les bonnes options
  app.enableCors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  //Initialiser la config
  const configService = app.get(ConfigService);

  // Pipe de validation global
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Format des réponses/exceptions
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription("Documentation de l'API NestJS avec Swagger")
    .setVersion('1.0')
    .addBearerAuth()
    .build();

const document = SwaggerModule.createDocument(app, swaggerConfig);
  document.servers = [
    {
      url: '{protocol}://{host}/client/api',
      description: 'Dynamic Server URL',
      variables: {
        protocol: {
          default: 'http',
          enum: ['http', 'https'],
          description: 'Protocol used (http or https)',
        },
        host: {
          default: 'localhost:8080',
          description: 'Host of the API (replace with your IP or domain)',
        },
      },
    },
  ];
  SwaggerModule.setup('swagger', app, document);

  // Démarrage du serveur
  await app.listen(configService.get<number>('APP_PORT', 3005));
}
bootstrap();
