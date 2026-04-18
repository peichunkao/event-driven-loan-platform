import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CreateLoanApplicationInput {
  @Field()
  customerName!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  productCode!: string;

  @Field()
  bankerId!: string;

  @Field()
  branchId!: string;
}
