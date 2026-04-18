import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LoanApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

@Entity({ name: 'loan_applications' })
export class LoanApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 255 })
  customerName!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'product_code', type: 'varchar', length: 64 })
  productCode!: string;

  @Column({ type: 'enum', enum: LoanApplicationStatus })
  status!: LoanApplicationStatus;

  @Column({ name: 'banker_id', type: 'varchar', length: 64 })
  bankerId!: string;

  @Column({ name: 'branch_id', type: 'varchar', length: 64 })
  branchId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
