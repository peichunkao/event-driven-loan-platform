import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { LOAN_EVENTS_SEARCH_INDEX } from '@loan-platform/shared';

export interface LoanEventDoc {
  eventId: string;
  eventType: string;
  applicationId: string;
  bankerId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface EventOverview {
  total: number;
  byType: { eventType: string; count: number }[];
}

@Injectable()
export class OpenSearchService implements OnModuleInit {
  private readonly log = new Logger(OpenSearchService.name);
  private client: Client;

  constructor() {
    const node = process.env.OPENSEARCH_URL ?? 'http://localhost:9200';
    this.client = new Client({ node });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureIndex();
    } catch (e) {
      this.log.warn(
        `OpenSearch unavailable (${e instanceof Error ? e.message : String(e)}). Search queries may fail until OpenSearch is up.`,
      );
    }
  }

  async ensureIndex(): Promise<void> {
    const exists = await this.client.indices.exists({
      index: LOAN_EVENTS_SEARCH_INDEX,
    });
    if (exists.body) {
      return;
    }
    await this.client.indices.create({
      index: LOAN_EVENTS_SEARCH_INDEX,
      body: {
        mappings: {
          properties: {
            eventId: { type: 'keyword' },
            eventType: { type: 'keyword' },
            applicationId: { type: 'keyword' },
            bankerId: { type: 'keyword' },
            timestamp: { type: 'date' },
            payload: { type: 'object', enabled: true },
          },
        },
      },
    });
    this.log.log(`Created index ${LOAN_EVENTS_SEARCH_INDEX}`);
  }

  async searchByApplication(applicationId: string): Promise<LoanEventDoc[]> {
    const res = await this.client.search({
      index: LOAN_EVENTS_SEARCH_INDEX,
      body: {
        query: { term: { applicationId } },
        sort: [{ timestamp: { order: 'asc' } }],
        size: 100,
      },
    });
    const hits = res.body.hits?.hits ?? [];
    return hits.map((h) => {
      const s = h._source as LoanEventDoc;
      return s;
    });
  }

  async overview(): Promise<EventOverview> {
    const res = await this.client.search({
      index: LOAN_EVENTS_SEARCH_INDEX,
      body: {
        size: 0,
        aggs: {
          types: {
            terms: { field: 'eventType', size: 50 },
          },
        },
      },
    });
    const typesAgg = res.body.aggregations?.types as
      | { buckets?: { key: string; doc_count: number }[] }
      | undefined;
    const buckets = typesAgg?.buckets ?? [];
    const total =
      typeof res.body.hits?.total === 'number'
        ? res.body.hits.total
        : ((res.body.hits?.total as { value: number })?.value ?? 0);
    return {
      total,
      byType: buckets.map((b: { key: string; doc_count: number }) => ({
        eventType: b.key,
        count: b.doc_count,
      })),
    };
  }
}
