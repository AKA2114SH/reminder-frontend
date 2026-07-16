
# Notification Service Admin Dashboard

Build a production-grade admin dashboard for BAAP Company's notification microservice, fully wired to your backend at `http://43.204.218.209:3000`.

## ⚠️ Important upfront notes

1. **HTTPS/CORS caveat:** Your backend is served over plain HTTP. The Lovable preview and published site run on HTTPS. Browsers block HTTPS→HTTP requests as "mixed content." Two options:
   - **(Recommended)** Proxy all backend calls through a TanStack server route (`/api/proxy/*`) so the browser only talks to same-origin HTTPS, and the server forwards to `http://43.204.218.209:3000` with the `x-client-id` header injected server-side (also keeps the client id out of the browser).
   - Or you enable HTTPS + CORS on the backend and we call it directly.
   I'll go with the **proxy approach** by default.

2. **Dark mode:** You asked for it explicitly; I'll include a theme toggle (default dark) even though it's normally discouraged for first versions.

3. **Auth:** No login screen — the `x-client-id` is injected server-side. JWT wiring can be added later.

## Design system

- **Palette (dark default):** bg `#0F172A`, surface `#1E293B`, border `#334155`, primary `#2563EB` (with `#3B82F6` / `#1D4ED8` variants), success/warning/error tokens as specified. Light mode mirrors with `#F8FAFC` / `#FFFFFF` / `#E2E8F0`.
- **Typography:** Inter loaded via `<link>` in `__root.tsx`.
- All colors as semantic tokens in `src/styles.css` (`oklch`), consumed via shadcn variants — no hardcoded hex in components.
- Layout: collapsible sidebar (shadcn Sidebar) + top bar with theme toggle, health status pill, and page title.

## Routes (TanStack Router, file-based)

```
src/routes/
  __root.tsx                    # shell: sidebar + topbar + Outlet
  index.tsx                     # Dashboard
  send.tsx                      # Send Notification
  bulk.tsx                      # CSV Bulk Upload
  scheduler.tsx                 # CRON jobs
  analytics.tsx                 # Analytics
  logs.tsx                      # Logs & Tracking
  settings.tsx                  # Settings
  api/proxy/$.ts                # Catch-all proxy → backend
```

## Screens

1. **Dashboard** — 4 metric cards, 7/30-day line chart (Recharts), channel donut, recent activity feed. Metrics derived from `/api/v1/email/logs` + status polling; where the backend doesn't expose aggregates I compute client-side from recent logs.
2. **Send Notification** — RHF + Zod form: channel, provider (context-aware list), recipients (chips input w/ email/phone validation), subject (Email only), template selector with variable inputs auto-generated from templateId, free-text body, priority slider, schedule toggle + datetime, auto-generated idempotency key, submit → `POST /api/v1/send`, toast + link to task in Logs.
3. **CSV Bulk Upload** — Drag-drop (10MB cap), CSV parsed client-side for preview (recipient/name), validation summary (valid/invalid/duplicate), template CSV download, channel + template config, submit multipart to `/api/v1/send/bulk/csv`, progress + poll `/api/v1/bulk/status/:taskId`.
4. **Scheduler** — Table of CRON jobs from `GET /api/v1/cron`; create/edit dialog with cron-expression builder (presets: every 5m, hourly, daily, weekly + raw expression), pause/resume/delete actions, expandable row for execution history.
5. **Analytics** — Date range (7/30/90d), metric cards, line + bar + donut, channel breakdown table, provider comparison, "Export CSV" (client-side) and "Export PDF" (print-friendly).
6. **Logs & Tracking** — TanStack Table with search (taskId/recipient), filters (status/channel/date), row click → drawer with delivery attempts from `/api/v1/status/:taskId` and webhook status; bulk tasks show parent + children; auto-refresh toggle (10s polling).
7. **Settings** — Read-only providers list from `/api/v1/providers` (via `Get All Providers`), default provider selector (stored in localStorage), retry/rate-limit info, cache clear button (`POST /api/admin/cache/clear`).

## Tech

- TanStack Router + TanStack Query (already in template)
- shadcn/ui + Tailwind v4 tokens
- Recharts for charts
- react-hook-form + zod
- @tanstack/react-table for tables
- papaparse for CSV preview
- date-fns for date handling
- sonner for toasts (already available)

## API layer

- `src/lib/api/client.ts` — thin fetch wrapper calling `/api/proxy/...` (same-origin), typed helpers per endpoint group (`send`, `bulk`, `status`, `cron`, `logs`, `providers`, `admin`).
- `src/routes/api/proxy/$.ts` — server route that forwards method/body/query to `http://43.204.218.209:3000`, injects `x-client-id` from env (with the provided id as fallback), returns response verbatim. Handles GET/POST/PATCH/DELETE + multipart passthrough.
- React Query hooks per resource in `src/lib/api/hooks.ts`.

## Scope for v1

Everything above is buildable in one pass. Real-time WebSocket updates → polling (10s) for v1; can upgrade later. JWT auth screen deferred.

Ready to build?
