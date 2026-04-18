import { LOAN_EVENT_TYPES } from '@loan-platform/shared';

function main(): void {
  console.log(
    JSON.stringify({
      service: 'simulator',
      phase: 'skeleton',
      message:
        'Weighted banker activity simulation will run here (per solution design §7).',
      modes: ['off', 'normal', 'busy'],
      sampleEventTypes: LOAN_EVENT_TYPES.slice(0, 3),
    }),
  );
}

main();
