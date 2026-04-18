import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, type Producer } from 'kafkajs';
import {
  LOAN_EVENTS_TOPIC,
  type DomainEventEnvelope,
} from '@loan-platform/shared';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);
    this.kafka = new Kafka({ clientId: 'loan-api', brokers });
    this.producer = this.kafka.producer();
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.log.log('Kafka producer connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(envelope: DomainEventEnvelope): Promise<void> {
    await this.producer.send({
      topic: LOAN_EVENTS_TOPIC,
      messages: [
        {
          key: envelope.applicationId,
          value: JSON.stringify(envelope),
        },
      ],
    });
  }
}
