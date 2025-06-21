import 'dotenv/config';
import { runSeeders } from 'typeorm-extension';
import AppDataSource from './data-source';
import { OrderStatusSeeder } from './seeders/order-status.seeder';
import { OrdersSeeder } from './seeders/orders.seeder';

async function seed() {
  try {
    await AppDataSource.initialize();
    await runSeeders(AppDataSource, {
      seeds: [
        OrderStatusSeeder,
        OrdersSeeder
      ],
    });
    await AppDataSource.destroy();
  } catch (err) {
    process.exit(1);
  }
}

seed();