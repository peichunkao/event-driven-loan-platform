import { randomUUID } from 'node:crypto';
import {
  LOAN_EVENTS_TOPIC,
  LOAN_EVENT_TYPES,
  type DomainEventEnvelope,
} from '@loan-platform/shared';
import { createKafka } from './kafka.js';

/** Downstream-style events only (API owns create/submit). */
const SIMULATED_TYPES = LOAN_EVENT_TYPES.filter(
  (t) =>
    t !== 'LoanApplicationCreated' && t !== 'LoanApplicationSubmitted',
);

function pickEventType(): string {
  const i = Math.floor(Math.random() * SIMULATED_TYPES.length);
  return SIMULATED_TYPES[i] ?? 'RiskScoreCalculated';
}

function intervalMsForMode(mode: string): number {
  switch (mode) {
    case 'busy':
      return 2000 + Math.floor(Math.random() * 2000);
    case 'normal':
      return 8000 + Math.floor(Math.random() * 7000);
    default:
      return 12000 + Math.floor(Math.random() * 8000);
  }
}

function buildEnvelope(eventType: string): DomainEventEnvelope {
  const eventId = randomUUID();
  const applicationId = randomUUID();
  const n = Math.floor(Math.random() * 40) + 1;
  const bankerId = `B${String(n).padStart(3, '0')}`;
  const timestamp = new Date().toISOString();
  return {
    eventId,
    eventType,
    timestamp,
    applicationId,
    bankerId,
    status: 'SIMULATED',
    traceId: randomUUID(),
    payload: {
      simulated: true,
      mode: process.env.SIMULATOR_MODE ?? 'normal',
    },
    version: 1,
  };
}

async function main(): Promise<void> {
  const mode = (process.env.SIMULATOR_MODE ?? 'normal').toLowerCase();
  if (mode === 'off') {
    console.log(
      JSON.stringify({
        service: 'simulator',
        mode: 'off',
        message: 'Set SIMULATOR_MODE to normal or busy to emit events.',
      }),
    );
    return;
  }

  const kafka = createKafka();
  const producer = kafka.producer();
  await producer.connect();

  const loop = async (): Promise<void> => {
    const env = buildEnvelope(pickEventType());
    await producer.send({
      topic: LOAN_EVENTS_TOPIC,
      messages: [
        { key: env.applicationId, value: JSON.stringify(env) },
      ],
    });
    console.log(
      JSON.stringify({
        service: 'simulator',
        mode,
        emitted: env.eventType,
        applicationId: env.applicationId,
        eventId: env.eventId,
      }),
    );
  };

  await loop();
  const ms = intervalMsForMode(mode);
  setInterval(() => {
    void loop().catch((e) => console.error(e));
  }, ms);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
