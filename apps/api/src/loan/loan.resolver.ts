import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  LoanApplicationGraph,
  AuditRecordGraph,
  EventOverviewGraph,
  LoanEventSearchHit,
} from './graphql-types';
import { CreateLoanApplicationInput } from './inputs';
import { LoanApplicationService } from './loan-application.service';
import { AuditQueryService } from './audit-query.service';
import { OpenSearchService } from '../opensearch/opensearch.service';
import { auditToGraph, loanToGraph, mapSearchDocs } from './mappers';

@Resolver()
export class LoanResolver {
  constructor(
    private readonly loans: LoanApplicationService,
    private readonly audit: AuditQueryService,
    private readonly search: OpenSearchService,
  ) {}

  @Query(() => [LoanApplicationGraph])
  loanApplications(): Promise<LoanApplicationGraph[]> {
    return this.loans.findAll().then((rows) => rows.map(loanToGraph));
  }

  @Query(() => LoanApplicationGraph)
  async loanApplication(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<LoanApplicationGraph> {
    const row = await this.loans.findOne(id);
    return loanToGraph(row);
  }

  @Mutation(() => LoanApplicationGraph)
  createLoanApplication(
    @Args('input') input: CreateLoanApplicationInput,
  ): Promise<LoanApplicationGraph> {
    return this.loans
      .create({
        customerName: input.customerName,
        amount: input.amount,
        productCode: input.productCode,
        bankerId: input.bankerId,
        branchId: input.branchId,
      })
      .then(loanToGraph);
  }

  @Mutation(() => LoanApplicationGraph)
  submitLoanApplication(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<LoanApplicationGraph> {
    return this.loans.submit(id).then(loanToGraph);
  }

  @Query(() => [AuditRecordGraph])
  auditTrail(
    @Args('applicationId', { type: () => ID }) applicationId: string,
  ): Promise<AuditRecordGraph[]> {
    return this.audit
      .listByApplication(applicationId)
      .then((rows) => rows.map(auditToGraph));
  }

  @Query(() => [LoanEventSearchHit])
  async searchLoanEvents(
    @Args('applicationId', { type: () => ID }) applicationId: string,
  ): Promise<LoanEventSearchHit[]> {
    const docs = await this.search.searchByApplication(applicationId);
    return mapSearchDocs(docs);
  }

  @Query(() => EventOverviewGraph)
  eventOverview(): Promise<EventOverviewGraph> {
    return this.search.overview();
  }
}
