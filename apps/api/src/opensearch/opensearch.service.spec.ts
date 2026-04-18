import { OpenSearchService } from './opensearch.service';
import { LOAN_EVENTS_SEARCH_INDEX } from '@loan-platform/shared';

describe('OpenSearchService', () => {
  it('ensureIndex creates when missing', async () => {
    const exists = jest.fn().mockResolvedValue({ body: false });
    const create = jest.fn().mockResolvedValue({ body: {} });
    const svc = new OpenSearchService();
    (svc as unknown as { client: unknown }).client = {
      indices: { exists, create },
      search: jest.fn(),
    };
    await svc.ensureIndex();
    expect(exists).toHaveBeenCalledWith({ index: LOAN_EVENTS_SEARCH_INDEX });
    expect(create).toHaveBeenCalled();
  });

  it('searchByApplication maps hits', async () => {
    const search = jest.fn().mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _source: {
                eventId: 'e',
                eventType: 'LoanApplicationSubmitted',
                applicationId: 'a',
                bankerId: 'b',
                timestamp: '2026-01-01T00:00:00.000Z',
                payload: { k: 1 },
              },
            },
          ],
        },
      },
    });
    const svc = new OpenSearchService();
    (svc as unknown as { client: unknown }).client = {
      indices: {
        exists: jest.fn().mockResolvedValue({ body: true }),
        create: jest.fn(),
      },
      search,
    };
    await svc.onModuleInit();
    const rows = await svc.searchByApplication('a');
    expect(rows).toHaveLength(1);
    expect(rows[0].eventId).toBe('e');
  });

  it('overview aggregates types', async () => {
    const search = jest.fn().mockResolvedValue({
      body: {
        hits: { total: { value: 3 } },
        aggregations: {
          types: {
            buckets: [{ key: 'LoanApplicationSubmitted', doc_count: 3 }],
          },
        },
      },
    });
    const svc = new OpenSearchService();
    (svc as unknown as { client: unknown }).client = {
      indices: {
        exists: jest.fn().mockResolvedValue({ body: true }),
        create: jest.fn(),
      },
      search,
    };
    await svc.onModuleInit();
    const o = await svc.overview();
    expect(o.total).toBe(3);
    expect(o.byType[0].eventType).toBe('LoanApplicationSubmitted');
    expect(o.byType[0].count).toBe(3);
  });
});

it('overview uses numeric total hits', async () => {
  const search = jest.fn().mockResolvedValue({
    body: {
      hits: { total: 5 },
      aggregations: {
        types: { buckets: [] },
      },
    },
  });
  const svc = new OpenSearchService();
  (svc as unknown as { client: unknown }).client = {
    indices: {
      exists: jest.fn().mockResolvedValue({ body: true }),
      create: jest.fn(),
    },
    search,
  };
  await svc.onModuleInit();
  const o = await svc.overview();
  expect(o.total).toBe(5);
});

it('searchByApplication handles missing hits array', async () => {
  const search = jest.fn().mockResolvedValue({ body: {} });
  const svc = new OpenSearchService();
  (svc as unknown as { client: unknown }).client = {
    indices: {
      exists: jest.fn().mockResolvedValue({ body: true }),
      create: jest.fn(),
    },
    search,
  };
  await svc.onModuleInit();
  const rows = await svc.searchByApplication('a');
  expect(rows).toEqual([]);
});

it('onModuleInit logs when ensureIndex fails', async () => {
  const svc = new OpenSearchService();
  const warn = jest
    .spyOn(svc['log'], 'warn')
    .mockImplementation(() => undefined);
  (svc as unknown as { ensureIndex: () => Promise<void> }).ensureIndex = () =>
    Promise.reject(new Error('boom'));
  await svc.onModuleInit();
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});
