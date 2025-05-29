import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  deliverer_id: number;

  @Column()
  restaurant_id: number;

  @Column()
  statut_id: number;

  @Column({ nullable: true })
  description: string;

  @Column('numeric', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('numeric', { precision: 10, scale: 2 })
  delivery_costs: number;

  @Column('numeric', { precision: 10, scale: 2 })
  service_charge: number;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  global_discount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}