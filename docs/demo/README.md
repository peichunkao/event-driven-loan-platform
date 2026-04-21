# Demo assets

Drop a short screen recording of the banker dashboard here so the root README renders it inline.

Preferred:

- `demo.gif` — 30–60 s loop, ≤ 10 MB, ~1200 px wide.
- `demo.mp4` — same length, H.264 8 Mbps if you prefer a crisper video.

Suggested recording script:

1. `pnpm docker:up` and `pnpm dev:api`, `pnpm dev:web` in split terminals.
2. Open `http://localhost:5173`.
3. Create a **draft** loan application (use an AUD amount like `450000`, product `HOME_90`).
4. Click **Submit** — watch the KPI row tick over and the status pill flip to `SUBMITTED`.
5. Start `pnpm dev:simulator` (mode `normal`) and let the **Event mix** and **Live event stream** light up.
6. Click the submitted loan to show the **Postgres audit** and **OpenSearch search** timelines side-by-side.

Then reference the asset from the root README (already linked as a commented-out image):

```md
![Demo](docs/demo/demo.gif)
```
