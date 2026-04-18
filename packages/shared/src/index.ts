import { z } from 'zod';

/** Kafka / Redpanda topic for loan domain events. */
export const LOAN_EVENTS_TOPIC = 'loan.events';

/** OpenSearch index for searchable event documents (Phase 2). */
export const LOAN_EVENTS_SEARCH_INDEX = 'loan-events';

/** Domain event envelope (solution design §5). */
export const domainEventEnvelopeSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  timestamp: z.string().datetime(),
  applicationId: z.string().min(1),
  bankerId: z.string().min(1),
  status: z.string().optional(),
  traceId: z.string().optional(),
  payload: z.record(z.unknown()),
  version: z.number().int().positive().optional(),
});

export type DomainEventEnvelope = z.infer<typeof domainEventEnvelopeSchema>;

export function parseDomainEventJson(raw: string): DomainEventEnvelope {
  const parsed: unknown = JSON.parse(raw);
  return domainEventEnvelopeSchema.parse(parsed);
}

export const LOAN_EVENT_TYPES = [
  'LoanApplicationCreated',
  'LoanApplicationSubmitted',
  'LoanApplicationAssigned',
  'RiskScoreCalculated',
  'DocumentRequested',
  'AISummaryGenerated',
  'NotificationSent',
  'ApplicationApproved',
  'ApplicationRejected',
] as const;

export type LoanEventType = (typeof LOAN_EVENT_TYPES)[number];
