import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditRecord } from './audit-record.entity';

@Injectable()
export class AuditQueryService {
  constructor(
    @InjectRepository(AuditRecord)
    private readonly audit: Repository<AuditRecord>,
  ) {}

  listByApplication(applicationId: string): Promise<AuditRecord[]> {
    return this.audit.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
    });
  }
}
