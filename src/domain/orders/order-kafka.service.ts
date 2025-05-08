import { Injectable, OnModuleInit } from '@nestjs/common';
import { OrderService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Consumer, Kafka, Producer } from 'kafkajs';

@Injectable()
export class OrderKafkaService implements OnModuleInit {
  private consumer: Consumer;
  private producer: Producer;

  constructor(private readonly orderService: OrderService) {
    const kafka = new Kafka({
      clientId: 'order-service',
      brokers: ['my-kafka-cluster-kafka-brokers.kafka.svc:9092'],
    });
    this.consumer = kafka.consumer({ groupId: 'order-consumer-group' });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    console.log(
      'OrderKafkaService: Initializing Kafka consumer and producer...',
    );

    await this.consumer.connect();
    await this.producer.connect();
    console.log('OrderKafkaService: Connected to Kafka');

    // S'abonner aux topics
    await this.consumer.subscribe({
      topics: ['client-orders', 'order-details-request'],
      fromBeginning: true,
    });
    console.log(
      'OrderKafkaService: Subscribed to topics client-orders and order-details-request',
    );

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(
          `OrderKafkaService: Received message from Kafka: Topic=${topic}, Partition=${partition}, Offset=${message.offset}`,
        );

        if (!message.value) {
          console.error(
            'OrderKafkaService: Message value is null, skipping message',
          );
          return;
        }

        try {
          if (topic === 'client-orders') {
            const orderData: CreateOrderDto = JSON.parse(
              message.value.toString(),
            );
            console.log('OrderKafkaService: Parsed order data:', orderData);
            const newOrder = await this.orderService.create(orderData);
            console.log(
              `OrderKafkaService: Commande créée avec succès via Kafka : ${newOrder.id}`,
            );
            //PAS OPE
          } else if (topic === 'order-details-request') {
            const { id } = JSON.parse(message.value.toString());
            console.log(
              `OrderKafkaService: Received request for order details with id ${id}`,
            );
            const order = await this.orderService.findOne(id);

            // Débogage des headers
            console.log('OrderKafkaService: Raw headers:', message.headers);

            // Extraire et convertir le correlationId des headers
            let correlationId: string | null = null;
            if (message.headers && message.headers['correlationId']) {
              correlationId = message.headers['correlationId'].toString('utf8');
            } else if (
              message.headers &&
              Object.keys(message.headers).length > 0
            ) {
              // Essayer de trouver une clé contenant "correlation"
              for (const key in message.headers) {
                if (key.toLowerCase().includes('correlation')) {
                  const headerValue = message.headers[key];
                  if (
                    headerValue &&
                    typeof headerValue === 'object' &&
                    'toString' in headerValue
                  ) {
                    correlationId = headerValue.toString('utf8');
                    console.log(
                      `OrderKafkaService: Found potential correlationId under key ${key}`,
                    );
                  } else {
                    console.log(
                      `OrderKafkaService: Skipping key ${key}, value is not convertible:`,
                      headerValue,
                    );
                  }
                  break;
                }
              }
            }
            if (!correlationId) {
              console.error(
                'OrderKafkaService: No valid correlationId found in message headers',
              );
              return;
            }

            // Publier la réponse sur le topic de réponse
            await this.producer.send({
              topic: 'order-details-response',
              messages: [
                {
                  value: JSON.stringify(order),
                  headers: {
                    correlationId,
                  },
                },
              ],
            });
            console.log(
              `OrderKafkaService: Sent response for order details with id ${id}`,
            );
          }
        } catch (error) {
          console.error(
            'OrderKafkaService: Erreur lors du traitement du message Kafka :',
            error,
          );
        }
      },
    });
  }
}
