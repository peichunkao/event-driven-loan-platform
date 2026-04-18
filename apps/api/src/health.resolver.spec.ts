import { HealthResolver } from './health.resolver';

describe('HealthResolver', () => {
  it('returns ok', () => {
    const r = new HealthResolver();
    expect(r.health()).toBe('ok');
  });
});
