import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/domain/order-status/entities/order-status.entity';
import { OrderItem } from 'src/domain/order-items/entities/order-items.entity';

@Entity()
export class Order {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1 })
  @Column()
  client_id: number;

  @ApiProperty({ example: 1 })
  @Column()
  restaurant_id: number;

  @ApiProperty({ example: 1 })
  @Column()
  status_id: number;

  @ApiProperty({ example: 'Livraison rapide souhaitée', nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 49.99 })
  @Column('numeric', { precision: 10, scale: 2 })
  subtotal: number;

  @ApiProperty({ example: 4.5 })
  @Column('numeric', { precision: 10, scale: 2 })
  delivery_costs: number;

  @ApiProperty({ example: 2.0 })
  @Column('numeric', { precision: 10, scale: 2 })
  service_charge: number;

  @ApiProperty({ example: 5.0, nullable: true })
  @Column('numeric', { precision: 10, scale: 2, nullable: true, default: 0 })
  global_discount?: number | null;

  @ApiProperty({ example: '12' })
  @Column()
  street_number: string;

  @ApiProperty({ example: 'Rue des Gourmands' })
  @Column()
  street: string;

  @ApiProperty({ example: 'Wavrin' })
  @Column()
  city: string;

  @ApiProperty({ example: '59136' })
  @Column()
  postal_code: string;

  @ApiProperty({ example: 'France' })
  @Column()
  country: string;

  @ApiProperty({ example: 16.0 })
  @Column({ type: 'decimal', precision: 15, scale: 8, default: 0 })
  long: number;

  @ApiProperty({ example: 16.0 })
  @Column({ type: 'decimal', precision: 15, scale: 8, default: 0 })
  lat: number;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => OrderStatus)
  @JoinColumn({ name: 'status_id' })
  status: OrderStatus;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];
}
