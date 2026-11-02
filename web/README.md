# Intel Chiplet Market Signals — web app

Next.js 16 app over the shared SQLite database written by the Python pipelines.
Pages: Overview · Emerging Demand · Competitive Radar · Evidence · Ask AI (Gemini, answers only from stored records).

## Run locally
```bash
npm install
npm run dev          # reads ../data/chiplet.db (live pipeline database)
```
`web/.env.local` (git-ignored) needs `GEMINI_API_KEY` for Ask AI. Optional: `GEMINI_MODEL`, `APP_PASSWORD`.

## Deploy (Vercel)
1. From the repo root, refresh the read-only snapshot the deployment ships with:
   `python scripts/export_web_snapshot.py` → `web/data/chiplet.db` (raw provider payloads stripped).
2. `cd web && npx vercel login` (once), then `npx vercel --prod`.
3. In the Vercel project settings add environment variables:
   - `GEMINI_API_KEY` — Ask AI
   - `APP_PASSWORD` — password gate for the sample app (any username)
   - `USE_SNAPSHOT=1`
4. Redeploy after each pipeline run so the snapshot is current.

Data rule: pages show only records that passed verification (verbatim excerpt found in the source, dated,
tied to a company). Everything held back is listed in `data/review/*_review.xlsx`.
