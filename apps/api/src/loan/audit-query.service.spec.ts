import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditQueryService } from './audit-query.service';
import { AuditRecord } from './audit-record.entity';

describe('AuditQueryService', () => {
  it('lists by application id', async () => {
    const mock = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'a',
          eventId: 'e1',
          applicationId: 'app1',
          eventType: 'LoanApplicationSubmitted',
          payload: { x: 1 },
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditQueryService,
        { provide: getRepositoryToken(AuditRecord), useValue: mock },
      ],
    }).compile();
    const svc = moduleRef.get(AuditQueryService);
    const rows = await svc.listByApplication('app1');
    expect(rows).toHaveLength(1);
    expect(mock.find).toHaveBeenCalledWith({
      where: { applicationId: 'app1' },
      order: { createdAt: 'ASC' },
    });
  });
});
