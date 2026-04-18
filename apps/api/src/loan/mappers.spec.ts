import { LoanApplicationStatus } from './loan-application.entity';
import { auditToGraph, loanToGraph, mapSearchDocs } from './mappers';

describe('mappers', () => {
  it('loanToGraph maps fields', () => {
    const g = loanToGraph({
      id: 'i',
      customerName: 'c',
      amount: '1',
      productCode: 'p',
      status: LoanApplicationStatus.DRAFT,
      bankerId: 'b',
      branchId: 'br',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(g.id).toBe('i');
    expect(g.createdAt).toContain('2026');
  });

  it('auditToGraph stringifies payload', () => {
    const g = auditToGraph({
      id: '1',
      eventId: 'e',
      applicationId: 'a',
      eventType: 'T',
      payload: { x: 1 },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(g.payloadJson).toContain('x');
  });

  it('mapSearchDocs maps docs', () => {
    const out = mapSearchDocs([
      {
        eventId: 'e',
        eventType: 'T',
        applicationId: 'a',
        bankerId: 'b',
        timestamp: '2026-01-01T00:00:00.000Z',
        payload: { z: 2 },
      },
    ]);
    expect(out[0].payloadJson).toContain('z');
  });
});

it('mapSearchDocs empty', () => {
  expect(mapSearchDocs([])).toEqual([]);
});
