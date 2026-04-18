import { useCallback, useState } from 'react';
import './App.css';

const graphqlUrl =
  import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:3000/graphql';

export default function App() {
  const [health, setHealth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ping = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHealth(null);
    try {
      const res = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ health }' }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        data?: { health?: string };
        errors?: { message: string }[];
      };
      if (body.errors?.length) {
        throw new Error(body.errors.map((e) => e.message).join('; '));
      }
      setHealth(body.data?.health ?? 'unknown');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="shell">
      <header>
        <h1>Loan platform</h1>
        <p className="muted">
          React + TypeScript · GraphQL BFF (Phase 1 adds loan flows)
        </p>
      </header>
      <section className="card">
        <h2>API health</h2>
        <p className="muted">POST {graphqlUrl}</p>
        <button type="button" onClick={() => void ping()} disabled={loading}>
          {loading ? 'Checking…' : 'Run { health } query'}
        </button>
        {health !== null && <p className="ok">health: {health}</p>}
        {error !== null && <p className="err">{error}</p>}
      </section>
    </main>
  );
}
