import { domainEventEnvelopeSchema, parseDomainEventJson } from './index';

describe('shared domain events', () => {
  it('parses valid json', () => {
    const raw = JSON.stringify({
      eventId: 'e1',
      eventType: 'LoanApplicationSubmitted',
      timestamp: '2026-01-01T00:00:00.000Z',
      applicationId: 'a1',
      bankerId: 'b1',
      payload: { amount: '1' },
    });
    const evt = parseDomainEventJson(raw);
    expect(evt.eventId).toBe('e1');
  });

  it('rejects invalid envelope', () => {
    expect(() => parseDomainEventJson('{}')).toThrow();
  });

  it('schema validates', () => {
    const r = domainEventEnvelopeSchema.safeParse({ foo: 1 });
    expect(r.success).toBe(false);
  });
});
