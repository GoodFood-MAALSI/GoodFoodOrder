import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { OrderService } from '../orders/orders.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly orderService: OrderService,
  ) {
    const kafka = new Kafka({
      clientId: 'order-service',
      brokers: [this.configService.get<string>('KAFKA_BROKERS') || 'my-kafka-cluster-kafka-bootstrap.kafka:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 10,
      },
    });
    this.consumer = kafka.consumer({ groupId: 'order-service-group' });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: 'delivery-created', fromBeginning: false });
      this.logger.log('Kafka consumer connected and subscribed to delivery-created topic');

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (topic === 'delivery-created') {
            try {
              const payload = JSON.parse(message.value.toString());
              const { orderId, delivererId } = payload;
              if (!orderId || !delivererId) {
                this.logger.error(`Missing orderId or delivererId in delivery-created message: ${JSON.stringify(payload)}`);
                return;
              }
              await this.orderService.acceptOrder(orderId, delivererId);
              this.logger.log(`Order ${orderId} status updated to 3 and deliverer ${delivererId} assigned`);
            } catch (error) {
              this.logger.error(`Error processing delivery-created message: ${error.message}`);
            }
          }
        },
      });
    } catch (error) {
      this.logger.error('Failed to connect Kafka consumer:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }
}