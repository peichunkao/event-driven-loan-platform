import { parseDomainEventJson, LOAN_EVENTS_TOPIC } from '@loan-platform/shared';
import { createKafka } from './lib/kafka.js';
import { createPool } from './lib/pg.js';
import { insertAuditIfNew } from './lib/audit-sql.js';

async function main(): Promise<void> {
  const pool = createPool();
  const kafka = createKafka();
  const consumer = kafka.consumer({ groupId: 'audit-consumer' });
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
        const result = await insertAuditIfNew(pool, {
          eventId: evt.eventId,
          applicationId: evt.applicationId,
          eventType: evt.eventType,
          payload: evt.payload as Record<string, unknown>,
        });
        if (process.env.LOG_LEVEL === 'debug') {
          console.log(
            JSON.stringify({ worker: 'audit', eventId: evt.eventId, result }),
          );
        }
      } catch (e) {
        console.error(
          JSON.stringify({
            worker: 'audit',
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
    },
  });
}

void main();
