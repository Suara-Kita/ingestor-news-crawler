# news-crawler

RSS polling service that scrapes Malaysian political news from 7 outlets and feeds them into the `queue:voter_inputs` pipeline alongside `telegram-bot`, for Project Synchro / Suara Kita.

## What it does

1. Polls 7 RSS feeds (Berita Harian, Utusan, Sinar Harian, NST, FMT, The Malaysian Insight, Harakahdaily) every `POLL_INTERVAL_MINUTES`.
2. Filters articles by political/constituency-relevant keywords.
3. Skips already-seen articles via a Redis dedup key (7-day TTL).
4. Scrapes the full article body with Playwright + Readability.
5. Optionally summarizes the article into one paragraph via OpenRouter (`openai/gpt-oss-120b`) — falls back to the raw scraped body if `OPENROUTER_API_KEY` is unset.
6. Pushes a `VoterInput`-shaped payload onto `queue:voter_inputs` for `main-engine-processor` to triage.

## Setup

```bash
npm install
cp .env.example .env   # fill in REDIS_PASSWORD, OPENROUTER_API_KEY, etc.
npm run dev
```

## Scripts

- `npm run dev` — run with file watching
- `npm run build` — compile to `dist/`
- `npm start` — run the compiled build
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — run the `node:test` suite
