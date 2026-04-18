import type pg from 'pg';

export async function insertAuditIfNew(
  pool: pg.Pool,
  row: {
    eventId: string;
    applicationId: string;
    eventType: string;
    payload: Record<string, unknown>;
  },
): Promise<'inserted' | 'skipped'> {
  const res = await pool.query(
    `INSERT INTO audit_records (id, event_id, application_id, event_type, payload, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4::jsonb, NOW())
     ON CONFLICT (event_id) DO NOTHING`,
    [
      row.eventId,
      row.applicationId,
      row.eventType,
      JSON.stringify(row.payload),
    ],
  );
  return res.rowCount === 1 ? 'inserted' : 'skipped';
}
