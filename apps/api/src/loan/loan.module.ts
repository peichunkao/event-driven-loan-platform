import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanApplication } from './loan-application.entity';
import { AuditRecord } from './audit-record.entity';
import { LoanApplicationService } from './loan-application.service';
import { AuditQueryService } from './audit-query.service';
import { LoanResolver } from './loan.resolver';
import { KafkaModule } from '../kafka/kafka.module';
import { OpenSearchModule } from '../opensearch/opensearch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplication, AuditRecord]),
    KafkaModule,
    OpenSearchModule,
  ],
  providers: [LoanApplicationService, AuditQueryService, LoanResolver],
  exports: [LoanApplicationService, AuditQueryService],
})
export class LoanModule {}
