import type { Client } from '@opensearch-project/opensearch';
import { LOAN_EVENTS_SEARCH_INDEX } from '@loan-platform/shared';
import type { DomainEventEnvelope } from '@loan-platform/shared';

export async function indexDomainEvent(
  client: Client,
  evt: DomainEventEnvelope,
): Promise<void> {
  await client.index({
    index: LOAN_EVENTS_SEARCH_INDEX,
    id: evt.eventId,
    body: {
      eventId: evt.eventId,
      eventType: evt.eventType,
      applicationId: evt.applicationId,
      bankerId: evt.bankerId,
      timestamp: evt.timestamp,
      payload: evt.payload,
    },
    refresh: 'wait_for',
  });
}
