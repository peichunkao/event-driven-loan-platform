/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
jest.mock('kafkajs', () => {
  const send = jest.fn().mockResolvedValue(undefined);
  const connect = jest.fn().mockResolvedValue(undefined);
  const disconnect = jest.fn().mockResolvedValue(undefined);
  const producer = jest.fn(() => ({ connect, disconnect, send }));
  const Kafka = jest.fn(() => ({ producer }));
  return { Kafka, __mocks: { send, connect, disconnect } };
});

import { KafkaProducerService } from './kafka-producer.service';
import { LOAN_EVENTS_TOPIC } from '@loan-platform/shared';

describe('KafkaProducerService', () => {
  it('publish sends json envelope', async () => {
    const k = jest.requireMock('kafkajs');
    const svc = new KafkaProducerService();
    await svc.onModuleInit();
    await svc.publish({
      eventId: 'e1',
      eventType: 'LoanApplicationSubmitted',
      timestamp: new Date().toISOString(),
      applicationId: 'a1',
      bankerId: 'b1',
      payload: { x: 1 },
    });
    expect(k.__mocks.send).toHaveBeenCalled();
    const arg = k.__mocks.send.mock.calls[0][0];
    expect(arg.topic).toBe(LOAN_EVENTS_TOPIC);
    expect(arg.messages[0].key).toBe('a1');
    await svc.onModuleDestroy();
  });
});
