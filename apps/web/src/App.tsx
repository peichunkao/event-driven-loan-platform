import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const graphqlUrl =
  import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:3000/graphql';

type LoanApplication = {
  id: string;
  customerName: string;
  amount: string;
  productCode: string;
  status: string;
  bankerId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
};

type AuditRecord = {
  id: string;
  eventId: string;
  eventType: string;
  payloadJson: string;
  createdAt: string;
};

type SearchHit = {
  eventId: string;
  eventType: string;
  timestamp: string;
  payloadJson: string;
};

type Overview = {
  total: number;
  byType: { eventType: string; count: number }[];
};

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const body = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join('; '));
  }
  if (!body.data) {
    throw new Error('No data');
  }
  return body.data;
}

export default function App() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => loans.find((l) => l.id === selectedId) ?? null,
    [loans, selectedId],
  );

  const refreshList = useCallback(async () => {
    const data = await gql<{ loanApplications: LoanApplication[] }>(`
      query { loanApplications { id customerName amount productCode status bankerId branchId createdAt updatedAt } }
    `);
    setLoans(data.loanApplications);
  }, []);

  const refreshDetail = useCallback(async (id: string) => {
    const [a, s, o] = await Promise.all([
      gql<{ auditTrail: AuditRecord[] }>(
        `query ($applicationId: ID!) { auditTrail(applicationId: $applicationId) { id eventId eventType payloadJson createdAt } }`,
        { applicationId: id },
      ),
      gql<{ searchLoanEvents: SearchHit[] }>(
        `query ($applicationId: ID!) { searchLoanEvents(applicationId: $applicationId) { eventId eventType timestamp payloadJson } }`,
        { applicationId: id },
      ),
      gql<{ eventOverview: Overview }>(`query { eventOverview { total byType { eventType count } } }`),
    ]);
    setAudit(a.auditTrail);
    setSearchHits(s.searchLoanEvents);
    setOverview(o.eventOverview);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        setError(null);
        await refreshList();
        if (selectedId) {
          await refreshDetail(selectedId);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [refreshList, refreshDetail, selectedId]);

  const onCreate = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const input = {
      customerName: String(fd.get('customerName') ?? ''),
      amount: Number(fd.get('amount') ?? 0),
      productCode: String(fd.get('productCode') ?? ''),
      bankerId: String(fd.get('bankerId') ?? ''),
      branchId: String(fd.get('branchId') ?? ''),
    };
    setBusy(true);
    setError(null);
    try {
      await gql(
        `mutation ($input: CreateLoanApplicationInput!) { createLoanApplication(input: $input) { id } }`,
        { input },
      );
      ev.currentTarget.reset();
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await gql(
        `mutation ($id: ID!) { submitLoanApplication(id: $id) { id status } }`,
        { id },
      );
      await refreshList();
      if (selectedId === id) {
        await refreshDetail(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="shell">
      <header>
        <h1>Loan platform</h1>
        <p className="muted">
          Phase 1–2: Postgres + Kafka (Redpanda) + audit + OpenSearch indexing
        </p>
      </header>

      {error !== null && <p className="err">{error}</p>}

      <section className="card">
        <h2>New application</h2>
        <form className="grid" onSubmit={(e) => void onCreate(e)}>
          <label>
            Customer
            <input name="customerName" required placeholder="Jane Doe" />
          </label>
          <label>
            Amount
            <input name="amount" type="number" step="0.01" required />
          </label>
          <label>
            Product
            <input name="productCode" required placeholder="HOME_90" />
          </label>
          <label>
            Banker ID
            <input name="bankerId" required placeholder="B003" />
          </label>
          <label>
            Branch ID
            <input name="branchId" required placeholder="BR01" />
          </label>
          <button type="submit" disabled={busy}>
            Create draft
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Applications</h2>
        <p className="muted">Refreshes every 3s (polling)</p>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr
                key={l.id}
                className={l.id === selectedId ? 'selected' : ''}
                onClick={() => setSelectedId(l.id)}
              >
                <td className="mono">{l.id.slice(0, 8)}…</td>
                <td>{l.customerName}</td>
                <td>{l.amount}</td>
                <td>{l.status}</td>
                <td>
                  {l.status === 'DRAFT' && (
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        void onSubmit(l.id);
                      }}
                    >
                      Submit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected !== null && (
        <section className="card">
          <h2>Detail</h2>
          <dl className="dl">
            <dt>ID</dt>
            <dd className="mono">{selected.id}</dd>
            <dt>Product</dt>
            <dd>{selected.productCode}</dd>
            <dt>Banker / branch</dt>
            <dd>
              {selected.bankerId} / {selected.branchId}
            </dd>
          </dl>

          <h3>Audit trail (Postgres)</h3>
          <ul className="list">
            {audit.map((a) => (
              <li key={a.id}>
                <strong>{a.eventType}</strong>{' '}
                <span className="muted">{a.createdAt}</span>
                <pre className="pre">{a.payloadJson}</pre>
              </li>
            ))}
          </ul>

          <h3>Search timeline (OpenSearch)</h3>
          <ul className="list">
            {searchHits.map((h) => (
              <li key={h.eventId}>
                <strong>{h.eventType}</strong>{' '}
                <span className="muted">{h.timestamp}</span>
                <pre className="pre">{h.payloadJson}</pre>
              </li>
            ))}
          </ul>
        </section>
      )}

      {overview !== null && (
        <section className="card">
          <h2>Event overview (OpenSearch)</h2>
          <p>
            Total indexed events: <strong>{overview.total}</strong>
          </p>
          <ul className="list">
            {overview.byType.map((b) => (
              <li key={b.eventType}>
                {b.eventType}: <strong>{b.count}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
