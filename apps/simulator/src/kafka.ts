import { Kafka } from 'kafkajs';

export function createKafka(): Kafka {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
  return new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID ?? 'loan-simulator',
    brokers,
  });
}
