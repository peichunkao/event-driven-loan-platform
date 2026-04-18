import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'node:path';
import { HealthResolver } from '../src/health.resolver';

/** Lightweight GraphQL e2e (no database) so CI can run without Docker. */
describe('GraphQL health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(__dirname, 'health-schema.gql'),
          sortSchema: true,
          path: '/graphql',
        }),
      ],
      providers: [HealthResolver],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('health query', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ health }',
      })
      .expect(200)
      .expect((res) => {
        const body = res.body as { data?: { health?: string } };
        expect(body.data?.health).toBe('ok');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
