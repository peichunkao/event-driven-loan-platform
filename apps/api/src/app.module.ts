import { join } from 'node:path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthResolver } from './health.resolver';
import { LoanModule } from './loan/loan.module';
import { LoanApplication } from './loan/loan-application.entity';
import { AuditRecord } from './loan/audit-record.entity';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://loan:loan@127.0.0.1:5432/loan';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: databaseUrl,
      entities: [LoanApplication, AuditRecord],
      synchronize: process.env.TYPEORM_SYNC !== 'false',
      logging: process.env.TYPEORM_LOGGING === 'true',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      path: '/graphql',
    }),
    LoanModule,
  ],
  providers: [HealthResolver],
})
export class AppModule {}
