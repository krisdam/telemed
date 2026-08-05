# TeleCare

A telemedicine portfolio project: patient signup with subscription vs. pay-per-visit
plans, intake, booking with priority scheduling for members, a simulated visit, and a
provider queue with clinical note documentation.

Stack: React (Vite) frontend, Node/Express + SQLite backend, one server serves both in
production so there's a single service to deploy.

## Run it locally

```bash
npm run install:all
npm run dev:server     # terminal 1 — API on :3000
npm run dev:client     # terminal 2 — Vite dev server on :5173, proxies /api to :3000
```

Open http://localhost:5173

Demo provider login: `provider@telecare.demo` / `demo1234`
(Patients: sign up with any email/password — no email verification in this demo.)

## Deploy — split: frontend on Vercel, backend on Railway

This is the recommended path if you already use Vercel. Vercel's serverless model
doesn't fit a persistent SQLite-backed Express server, so the backend goes on Railway
(which runs a normal long-lived Node process) and only the static frontend goes to
Vercel. The frontend already supports this via `VITE_API_URL` — no code changes needed.

**1. Backend on Railway:**
1. Push this folder to a new GitHub repo.
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → select your repo.
3. Settings → set **Root Directory** to `server`.
4. **Build command**: `npm install`
5. **Start command**: `node index.js`
6. Variables tab → add `JWT_SECRET` (e.g. output of `openssl rand -hex 32`).
7. Deploy. Copy the public URL Railway gives you (Settings → Networking → Generate Domain) —
   you'll need it in step 2.

**2. Frontend on Vercel:**
1. [vercel.com](https://vercel.com) → Add New Project → import the same GitHub repo.
2. Set **Root Directory** to `client`.
3. Framework preset: Vite (should auto-detect). Build command `npm run build`, output
   directory `dist` (Vercel defaults are correct here).
4. Environment Variables → add `VITE_API_URL` = your Railway backend URL from step 1
   (no trailing slash, e.g. `https://telecare-backend.up.railway.app`).
5. Deploy.

CORS is already open on the backend (`cors()` with no restrictions), so the two
different domains talking to each other works with no extra config.

## Deploy — single service (alternative: Railway or Render only)

If you'd rather not split it, one Railway or Render service can serve both frontend
and backend together (no `VITE_API_URL` needed — leave it unset):

1. Push to GitHub, connect the repo on Railway or Render.
2. **Build command**: `npm run install:all && npm run build`
3. **Start command**: `npm start`
4. Add environment variable `JWT_SECRET`.
5. Deploy.

## Notes on the data layer

- SQLite file (`server/telecare.db`) is created automatically on first boot and seeded
  with 3 demo providers and open slots for the next 3 days.
- **Railway/Render disks are ephemeral by default** — the SQLite file resets on redeploy
  unless you attach a persistent volume (Railway: Settings → Volumes; Render: Disks).
  Fine for a portfolio demo; for anything longer-lived, mount a volume at
  `/app/server` or swap in Postgres.

## What's simulated vs. real (see PRD for full scope)

- Visit itself is a simulated "join" screen, not real video — deliberate scope cut so
  the build stays focused on the product logic (intake, scheduling, subscription
  state, documentation) rather than WebRTC infrastructure.
- Payment is modeled (plan pricing, included-visit deduction) but no real payment
  processor is wired in.
