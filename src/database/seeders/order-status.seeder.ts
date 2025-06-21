import { OrderStatus } from 'src/domain/order-status/entities/order-status.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class OrderStatusSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repo = dataSource.getRepository(OrderStatus);

    const orderStatus = [
      { id: 1, name: 'En attente de l\'acceptation du restaurant' },
      { id: 2, name: 'En attente de prise en charge par un livreur' },
      { id: 3, name: 'En cours de préparation' },
      { id: 4, name: 'En cours de livraison' },
      { id: 5, name: 'Livré' },
      { id: 6, name: 'Refusé par le restaurant' },
      { id: 7, name: 'Refusé par un administrateur' },
    ];

    for (const typeData of orderStatus) {
      const orderStat = new OrderStatus();
      orderStat.id = typeData.id;
      orderStat.name = typeData.name;

      await repo.save(orderStat, { data: { id: typeData.id } });
    }

    console.log('All order status inserted successfully!');
  }
}
