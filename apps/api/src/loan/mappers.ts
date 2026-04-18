import type {
  LoanApplicationGraph,
  AuditRecordGraph,
  LoanEventSearchHit,
} from './graphql-types';
import type { LoanApplication } from './loan-application.entity';
import type { AuditRecord } from './audit-record.entity';
import type { LoanEventDoc } from '../opensearch/opensearch.service';

export function loanToGraph(loan: LoanApplication): LoanApplicationGraph {
  return {
    id: loan.id,
    customerName: loan.customerName,
    amount: loan.amount,
    productCode: loan.productCode,
    status: loan.status,
    bankerId: loan.bankerId,
    branchId: loan.branchId,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
  };
}

export function auditToGraph(row: AuditRecord): AuditRecordGraph {
  return {
    id: row.id,
    eventId: row.eventId,
    applicationId: row.applicationId,
    eventType: row.eventType,
    payloadJson: JSON.stringify(row.payload),
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapSearchDocs(docs: LoanEventDoc[]): LoanEventSearchHit[] {
  return docs.map((d) => ({
    eventId: d.eventId,
    eventType: d.eventType,
    applicationId: d.applicationId,
    bankerId: d.bankerId,
    timestamp: d.timestamp,
    payloadJson: JSON.stringify(d.payload),
  }));
}
