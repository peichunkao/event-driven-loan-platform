import { LOAN_EVENT_TYPES } from '@loan-platform/shared';

const topic = process.env.KAFKA_TOPIC ?? 'loan.events';

function main(): void {
  console.log(
    JSON.stringify({
      service: 'workers',
      phase: 'skeleton',
      message:
        'Audit/notification/risk/index consumers will subscribe here (Phase 1).',
      topic,
      knownEventTypes: LOAN_EVENT_TYPES,
    }),
  );
}

main();
