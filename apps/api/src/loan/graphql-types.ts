import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { LoanApplicationStatus } from './loan-application.entity';

registerEnumType(LoanApplicationStatus, {
  name: 'LoanApplicationStatus',
});

@ObjectType()
export class LoanApplicationGraph {
  @Field(() => ID)
  id!: string;

  @Field()
  customerName!: string;

  @Field()
  amount!: string;

  @Field()
  productCode!: string;

  @Field(() => LoanApplicationStatus)
  status!: LoanApplicationStatus;

  @Field()
  bankerId!: string;

  @Field()
  branchId!: string;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}

@ObjectType()
export class AuditRecordGraph {
  @Field(() => ID)
  id!: string;

  @Field()
  eventId!: string;

  @Field()
  applicationId!: string;

  @Field()
  eventType!: string;

  @Field(() => String)
  payloadJson!: string;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class EventTypeCount {
  @Field()
  eventType!: string;

  @Field()
  count!: number;
}

@ObjectType()
export class EventOverviewGraph {
  @Field()
  total!: number;

  @Field(() => [EventTypeCount])
  byType!: EventTypeCount[];
}

@ObjectType()
export class LoanEventSearchHit {
  @Field()
  eventId!: string;

  @Field()
  eventType!: string;

  @Field()
  applicationId!: string;

  @Field()
  bankerId!: string;

  @Field()
  timestamp!: string;

  @Field(() => String)
  payloadJson!: string;
}
