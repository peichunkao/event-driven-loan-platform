import pg from 'pg';

export function createPool(): pg.Pool {
  const connectionString =
    process.env.DATABASE_URL ??
    'postgres://loan:loan@127.0.0.1:5432/loan';
  return new pg.Pool({ connectionString });
}
