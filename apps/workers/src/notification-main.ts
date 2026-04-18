import { parseDomainEventJson, LOAN_EVENTS_TOPIC } from '@loan-platform/shared';
import { createKafka } from './lib/kafka.js';

/**
 * Phase 4 stub: would dispatch emails/push for NotificationSent.
 * Logs structured JSON so you can wire a real provider later.
 */
async function main(): Promise<void> {
  const kafka = createKafka();
  const consumer = kafka.consumer({ groupId: 'notification-consumer' });
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
        if (evt.eventType !== 'NotificationSent') {
          return;
        }
        console.log(
          JSON.stringify({
            worker: 'notifications',
            eventId: evt.eventId,
            applicationId: evt.applicationId,
            payload: evt.payload,
          }),
        );
      } catch (e) {
        console.error(
          JSON.stringify({
            worker: 'notifications',
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
    },
  });
}

void main();
