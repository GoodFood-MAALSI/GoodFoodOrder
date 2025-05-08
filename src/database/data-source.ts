import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', '127.0.0.1'),
  port: configService.get<number>('DATABASE_PORT', 5437),
  username: configService.get<string>('DATABASE_USERNAME', 'user'),
  password: configService.get<string>('DATABASE_PASSWORD', 'k?:u-Nu4&FM68Q!1Ez'),
  database: configService.get<string>('DATABASE_NAME', 'goodfood_client'),
  entities: ['dist/domain/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: configService.get<string>('DATABASE_SYNCHRONIZE', 'true') === 'true',
  logging: true,
});

export default AppDataSource;