import { Test } from '@nestjs/testing';
import { LoanResolver } from './loan.resolver';
import { LoanApplicationService } from './loan-application.service';
import { AuditQueryService } from './audit-query.service';
import { OpenSearchService } from '../opensearch/opensearch.service';
import { LoanApplicationStatus } from './loan-application.entity';

describe('LoanResolver', () => {
  const loans = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    submit: jest.fn(),
  };
  const audit = { listByApplication: jest.fn() };
  const search = { searchByApplication: jest.fn(), overview: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function resolver() {
    const m = await Test.createTestingModule({
      providers: [
        LoanResolver,
        { provide: LoanApplicationService, useValue: loans },
        { provide: AuditQueryService, useValue: audit },
        { provide: OpenSearchService, useValue: search },
      ],
    }).compile();
    return m.get(LoanResolver);
  }

  it('loanApplications maps rows', async () => {
    loans.findAll.mockResolvedValue([
      {
        id: '1',
        customerName: 'c',
        amount: '10',
        productCode: 'p',
        status: LoanApplicationStatus.DRAFT,
        bankerId: 'b',
        branchId: 'br',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    const r = await resolver();
    const out = await r.loanApplications();
    expect(out[0].id).toBe('1');
    expect(out[0].createdAt).toContain('2026');
  });

  it('auditTrail maps audit rows', async () => {
    audit.listByApplication.mockResolvedValue([
      {
        id: 'x',
        eventId: 'e',
        applicationId: 'a',
        eventType: 'LoanApplicationSubmitted',
        payload: { z: 1 },
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    const r = await resolver();
    const out = await r.auditTrail('a');
    expect(out[0].payloadJson).toContain('z');
  });

  it('searchLoanEvents maps docs', async () => {
    search.searchByApplication.mockResolvedValue([
      {
        eventId: 'e',
        eventType: 'LoanApplicationSubmitted',
        applicationId: 'a',
        bankerId: 'b',
        timestamp: '2026-01-01T00:00:00.000Z',
        payload: { k: 1 },
      },
    ]);
    const r = await resolver();
    const out = await r.searchLoanEvents('a');
    expect(out[0].payloadJson).toContain('k');
  });

  it('loanApplication returns one', async () => {
    loans.findOne.mockResolvedValue({
      id: '1',
      customerName: 'c',
      amount: '10',
      productCode: 'p',
      status: LoanApplicationStatus.DRAFT,
      bankerId: 'b',
      branchId: 'br',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const r = await resolver();
    const out = await r.loanApplication('1');
    expect(out.id).toBe('1');
  });

  it('createLoanApplication delegates', async () => {
    loans.create.mockResolvedValue({
      id: 'n',
      customerName: 'c',
      amount: '10',
      productCode: 'p',
      status: LoanApplicationStatus.DRAFT,
      bankerId: 'b',
      branchId: 'br',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const r = await resolver();
    const out = await r.createLoanApplication({
      customerName: 'c',
      amount: 10,
      productCode: 'p',
      bankerId: 'b',
      branchId: 'br',
    });
    expect(out.id).toBe('n');
  });

  it('submitLoanApplication delegates', async () => {
    loans.submit.mockResolvedValue({
      id: '1',
      customerName: 'c',
      amount: '10',
      productCode: 'p',
      status: LoanApplicationStatus.SUBMITTED,
      bankerId: 'b',
      branchId: 'br',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const r = await resolver();
    const out = await r.submitLoanApplication('1');
    expect(out.status).toBe(LoanApplicationStatus.SUBMITTED);
  });

  it('eventOverview delegates', async () => {
    search.overview.mockResolvedValue({
      total: 1,
      byType: [{ eventType: 'LoanApplicationSubmitted', count: 1 }],
    });
    const r = await resolver();
    const out = await r.eventOverview();
    expect(out.total).toBe(1);
  });
});
