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

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return iso;
  }
  const delta = Math.max(0, Date.now() - t);
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleString();
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function formatAmount(raw: string): string {
  const n = Number(raw);
  if (Number.isNaN(n)) {
    return raw;
  }
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  });
}

type Kpi = {
  total: number;
  drafts: number;
  submitted: number;
  eventsIndexed: number;
};

function Kpis({ kpi }: { kpi: Kpi }) {
  const cards: { label: string; value: number; tone?: string }[] = [
    { label: 'Loan applications', value: kpi.total },
    { label: 'Drafts', value: kpi.drafts, tone: 'draft' },
    { label: 'Submitted', value: kpi.submitted, tone: 'submitted' },
    { label: 'Events indexed', value: kpi.eventsIndexed, tone: 'events' },
  ];
  return (
    <div className="kpis">
      {cards.map((c) => (
        <div key={c.label} className={`kpi kpi-${c.tone ?? 'default'}`}>
          <div className="kpi-value">{c.value.toLocaleString()}</div>
          <div className="kpi-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

type TimelineEntry = {
  key: string;
  eventType: string;
  timestamp: string;
  payloadJson: string;
};

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  if (entries.length === 0) {
    return <p className="muted small">No events yet.</p>;
  }
  return (
    <ol className="timeline">
      {entries.map((e) => {
        const isOpen = openKey === e.key;
        return (
          <li key={e.key} className="timeline-item">
            <span className={`dot dot-${e.eventType}`} aria-hidden />
            <div className="timeline-body">
              <button
                type="button"
                className="timeline-head"
                onClick={() => setOpenKey(isOpen ? null : e.key)}
              >
                <span className="timeline-type">{e.eventType}</span>
                <span className="muted small">
                  {formatRelative(e.timestamp)}
                </span>
              </button>
              {isOpen && <pre className="pre">{prettyJson(e.payloadJson)}</pre>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function App() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selected = useMemo(
    () => loans.find((l) => l.id === selectedId) ?? null,
    [loans, selectedId],
  );

  const kpi = useMemo<Kpi>(() => {
    const drafts = loans.filter((l) => l.status === 'DRAFT').length;
    const submitted = loans.length - drafts;
    return {
      total: loans.length,
      drafts,
      submitted,
      eventsIndexed: overview?.total ?? 0,
    };
  }, [loans, overview]);

  const refreshList = useCallback(async () => {
    const data = await gql<{ loanApplications: LoanApplication[] }>(`
      query { loanApplications { id customerName amount productCode status bankerId branchId createdAt updatedAt } }
    `);
    setLoans(data.loanApplications);
  }, []);

  const refreshOverview = useCallback(async () => {
    const o = await gql<{ eventOverview: Overview }>(
      `query { eventOverview { total byType { eventType count } } }`,
    );
    setOverview(o.eventOverview);
  }, []);

  const refreshDetail = useCallback(async (id: string) => {
    const [a, s] = await Promise.all([
      gql<{ auditTrail: AuditRecord[] }>(
        `query ($applicationId: ID!) { auditTrail(applicationId: $applicationId) { id eventId eventType payloadJson createdAt } }`,
        { applicationId: id },
      ),
      gql<{ searchLoanEvents: SearchHit[] }>(
        `query ($applicationId: ID!) { searchLoanEvents(applicationId: $applicationId) { eventId eventType timestamp payloadJson } }`,
        { applicationId: id },
      ),
    ]);
    setAudit(a.auditTrail);
    setSearchHits(s.searchLoanEvents);
  }, []);

  useEffect(() => {
    if (paused) {
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        setError(null);
        await Promise.all([
          refreshList(),
          refreshOverview(),
          selectedId ? refreshDetail(selectedId) : Promise.resolve(),
        ]);
        if (!cancelled) {
          setLastUpdated(new Date());
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
  }, [refreshList, refreshOverview, refreshDetail, selectedId, paused]);

  const onCreate = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const fd = new FormData(form);
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
      form.reset();
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

  const auditTimeline = useMemo<TimelineEntry[]>(
    () =>
      audit.map((a) => ({
        key: a.id,
        eventType: a.eventType,
        timestamp: a.createdAt,
        payloadJson: a.payloadJson,
      })),
    [audit],
  );

  const searchTimeline = useMemo<TimelineEntry[]>(
    () =>
      searchHits.map((h) => ({
        key: h.eventId,
        eventType: h.eventType,
        timestamp: h.timestamp,
        payloadJson: h.payloadJson,
      })),
    [searchHits],
  );

  const streamTimeline = useMemo<TimelineEntry[]>(
    () => searchTimeline.slice(0, 12),
    [searchTimeline],
  );

  return (
    <main className="shell">
      <header className="page-header">
        <div>
          <h1>Digital Loan Origination (Unloan-style)</h1>
          <p className="muted">
            Event-driven mortgage origination demo · GraphQL BFF · Kafka · Postgres · OpenSearch
          </p>
        </div>
        <div className="header-meta">
          <span className={`pill ${paused ? 'pill-paused' : 'pill-live'}`}>
            <span className="pill-dot" />
            {paused ? 'Paused' : 'Live · 3s'}
          </span>
          <span className="muted small">
            {lastUpdated
              ? `Updated ${formatRelative(lastUpdated.toISOString())}`
              : 'Waiting for first poll…'}
          </span>
          <button
            type="button"
            className="secondary"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </header>

      {error !== null && <p className="err">{error}</p>}

      <Kpis kpi={kpi} />

      <div className="layout">
        <div className="col">
          <section className="card">
            <h2>New loan application</h2>
            <form className="grid" onSubmit={(e) => void onCreate(e)}>
              <label>
                Customer
                <input name="customerName" required placeholder="Jane Doe" />
              </label>
              <label>
                Amount (AUD)
                <input name="amount" type="number" step="0.01" required placeholder="450000" />
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
            <div className="card-head">
              <h2>Loan applications</h2>
              <span className="muted small">{loans.length} total</span>
            </div>
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
                    <td>{formatAmount(l.amount)}</td>
                    <td>
                      <span
                        className={`status status-${l.status.toLowerCase()}`}
                      >
                        {l.status}
                      </span>
                    </td>
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
                {loans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted small">
                      No applications yet. Create a draft above to kick things off.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        <div className="col">
          <section className="card">
            <div className="card-head">
              <h2>Live event stream</h2>
              <span className="muted small">
                OpenSearch · {overview?.total ?? 0} indexed
              </span>
            </div>
            {selected ? (
              <Timeline entries={streamTimeline} />
            ) : (
              <p className="muted small">
                Select a loan on the left to view its live event stream.
              </p>
            )}
          </section>

          {overview !== null && overview.byType.length > 0 && (
            <section className="card">
              <h2>Event mix</h2>
              <ul className="mix">
                {overview.byType.map((b) => (
                  <li key={b.eventType} className="mix-row">
                    <span className={`dot dot-${b.eventType}`} aria-hidden />
                    <span className="mix-label">{b.eventType}</span>
                    <span className="mix-count">{b.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {selected !== null && (
        <section className="card">
          <div className="card-head">
            <h2>Loan detail</h2>
            <span className="muted small mono">{selected.id}</span>
          </div>
          <dl className="dl">
            <dt>Customer</dt>
            <dd>{selected.customerName}</dd>
            <dt>Amount</dt>
            <dd>{formatAmount(selected.amount)}</dd>
            <dt>Product</dt>
            <dd>{selected.productCode}</dd>
            <dt>Banker / branch</dt>
            <dd>
              {selected.bankerId} / {selected.branchId}
            </dd>
            <dt>Status</dt>
            <dd>
              <span className={`status status-${selected.status.toLowerCase()}`}>
                {selected.status}
              </span>
            </dd>
          </dl>

          <div className="detail-grid">
            <div>
              <h3>Status timeline · Postgres audit</h3>
              <Timeline entries={auditTimeline} />
            </div>
            <div>
              <h3>Search timeline · OpenSearch</h3>
              <Timeline entries={searchTimeline} />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
