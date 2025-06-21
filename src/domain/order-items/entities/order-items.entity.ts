import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from 'src/domain/orders/entities/order.entity';

@Entity()
export class OrderItem {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column()
  order_id: number;

  @ApiProperty({ example: 1 })
  @Column()
  menu_item_id: number;

  @ApiProperty({ example: 2 })
  @Column()
  quantity: number;

  @ApiProperty({ example: 10.50 })
  @Column('numeric', { precision: 10, scale: 2 })
  unit_price: number;

  @ApiProperty({ example: 'Sans oignons', nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ApiProperty({ example: [1, 2], description: 'IDs des options sélectionnées' })
  @Column('simple-array')
  selected_option_value_ids: number[];

  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}