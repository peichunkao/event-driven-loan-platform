/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanApplicationService } from './loan-application.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import {
  LoanApplication,
  LoanApplicationStatus,
} from './loan-application.entity';

describe('LoanApplicationService', () => {
  const kafka = { publish: jest.fn().mockResolvedValue(undefined) };

  function makeService(repo: Record<string, jest.Mock>) {
    return new LoanApplicationService(
      repo as unknown as import('typeorm').Repository<LoanApplication>,
      kafka as unknown as KafkaProducerService,
    );
  }

  beforeEach(() => {
    kafka.publish.mockClear();
  });

  it('creates draft application', async () => {
    const create = jest.fn((x) => ({ ...x, id: 'id-1' }));
    const save = jest.fn().mockImplementation((x) => Promise.resolve(x));
    const repo = { create, save };
    const svc = makeService(repo);
    const row = await svc.create({
      customerName: ' Ada ',
      amount: 1000.5,
      productCode: ' P1 ',
      bankerId: ' b1 ',
      branchId: ' br1 ',
    });
    expect(row.id).toBe('id-1');
    expect(create).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(kafka.publish).not.toHaveBeenCalled();
  });

  it('submits draft and publishes kafka event', async () => {
    const draft = {
      id: 'loan-1',
      customerName: 'c',
      amount: '1000.00',
      productCode: 'P',
      status: LoanApplicationStatus.DRAFT,
      bankerId: 'b',
      branchId: 'br',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const findOne = jest.fn().mockResolvedValue({ ...draft });
    const save = jest.fn().mockImplementation((x) => Promise.resolve(x));
    const repo = { findOne, save, create: jest.fn(), find: jest.fn() };
    const svc = makeService(repo);
    const out = await svc.submit('loan-1');
    expect(out.status).toBe(LoanApplicationStatus.SUBMITTED);
    expect(kafka.publish).toHaveBeenCalledTimes(1);
    const arg = kafka.publish.mock.calls[0][0];
    expect(arg.eventType).toBe('LoanApplicationSubmitted');
    expect(arg.applicationId).toBe('loan-1');
  });

  it('throws when submit missing', async () => {
    const repo = { findOne: jest.fn().mockResolvedValue(null) };
    const svc = makeService(repo);
    await expect(svc.submit('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when submit not draft', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({
        id: '1',
        status: LoanApplicationStatus.SUBMITTED,
      }),
    };
    const svc = makeService(repo);
    await expect(svc.submit('1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findOne throws when missing', async () => {
    const repo = { findOne: jest.fn().mockResolvedValue(null) };
    const svc = makeService(repo);
    await expect(svc.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne returns row', async () => {
    const row = {
      id: '1',
      customerName: 'c',
      amount: '1',
      productCode: 'p',
      status: LoanApplicationStatus.DRAFT,
      bankerId: 'b',
      branchId: 'br',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const repo = { findOne: jest.fn().mockResolvedValue(row) };
    const svc = makeService(repo);
    const out = await svc.findOne('1');
    expect(out.id).toBe('1');
  });

  it('findAll delegates to repository', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([]),
    };
    const svc = makeService(repo);
    await svc.findAll();
    expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });
});
