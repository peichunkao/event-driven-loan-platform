import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import {
  LoanApplication,
  LoanApplicationStatus,
} from './loan-application.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

export interface CreateLoanInput {
  customerName: string;
  amount: number;
  productCode: string;
  bankerId: string;
  branchId: string;
}

@Injectable()
export class LoanApplicationService {
  constructor(
    @InjectRepository(LoanApplication)
    private readonly loans: Repository<LoanApplication>,
    private readonly kafka: KafkaProducerService,
  ) {}

  async create(input: CreateLoanInput): Promise<LoanApplication> {
    const row = this.loans.create({
      customerName: input.customerName.trim(),
      amount: input.amount.toFixed(2),
      productCode: input.productCode.trim(),
      bankerId: input.bankerId.trim(),
      branchId: input.branchId.trim(),
      status: LoanApplicationStatus.DRAFT,
    });
    return this.loans.save(row);
  }

  async submit(id: string): Promise<LoanApplication> {
    const app = await this.loans.findOne({ where: { id } });
    if (!app) {
      throw new NotFoundException(`Loan application ${id} not found`);
    }
    if (app.status !== LoanApplicationStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT applications can be submitted');
    }
    app.status = LoanApplicationStatus.SUBMITTED;
    const saved = await this.loans.save(app);
    const traceId = randomUUID();
    const timestamp = new Date().toISOString();
    await this.kafka.publish({
      eventId: randomUUID(),
      eventType: 'LoanApplicationSubmitted',
      timestamp,
      applicationId: saved.id,
      bankerId: saved.bankerId,
      status: 'SUCCESS',
      traceId,
      payload: {
        amount: saved.amount,
        productCode: saved.productCode,
        customerName: saved.customerName,
        branchId: saved.branchId,
      },
      version: 1,
    });
    return saved;
  }

  findAll(): Promise<LoanApplication[]> {
    return this.loans.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<LoanApplication> {
    const row = await this.loans.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Loan application ${id} not found`);
    }
    return row;
  }
}
