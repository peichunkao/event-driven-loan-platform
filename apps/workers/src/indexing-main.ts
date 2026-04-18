import { Client } from '@opensearch-project/opensearch';
import { parseDomainEventJson, LOAN_EVENTS_TOPIC } from '@loan-platform/shared';
import { createKafka } from './lib/kafka.js';
import { indexDomainEvent } from './lib/opensearch-index.js';

async function main(): Promise<void> {
  const node = process.env.OPENSEARCH_URL ?? 'http://127.0.0.1:9200';
  const client = new Client({ node });
  const kafka = createKafka();
  const consumer = kafka.consumer({ groupId: 'index-consumer' });
  await consumer.connect();
  await consumer.subscribe({ topic: LOAN_EVENTS_TOPIC, fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) {
        return;
      }
      try {
        const evt = parseDomainEventJson(raw);
        await indexDomainEvent(client, evt);
      } catch (e) {
        console.error(
          JSON.stringify({
            worker: 'index',
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
    },
  });
}

void main();
