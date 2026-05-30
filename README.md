# Terrain

Terrain is a geo-anchored, source-transparent news intelligence platform. It maps global events onto a 3D globe, then lets users compare how different outlets frame the same event through source geography, funding, political context, and AI-generated perspective analysis.

This repository contains:

- a `Next.js` frontend for the immersive globe UI and comparison panels
- a `FastAPI` backend for event retrieval, article ingestion, external sync, and perspective extraction
- a `Supabase Postgres` database for events, stories, sources, and RSS source configuration

## What It Does

Terrain is built around one core question:

How does the same event look when covered from different places, by different institutions, with different incentives?

Current implementation includes:

- an interactive 3D globe powered by `react-globe.gl`
- live event markers loaded from Postgres
- perspective comparison cards for each event
- source metadata including funding type, political lean, press freedom score, and geographic proximity
- AI-generated article summaries, editorial framing labels, and omitted-context notes
- contradiction reports across multiple stories on the same event
- a GDELT + RSS ingestion pipeline for pulling in real news
- background auto-sync on a configurable schedule
- database-driven RSS source management through `rss_sources`

## Stack

### Frontend

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `react-globe.gl`
- `three`

### Backend

- `FastAPI`
- `Pydantic v2`
- `psycopg2`
- `requests`
- `defusedxml`
- `python-dotenv`
- `OpenAI-compatible clients` pointed at Groq / Gemini / NVIDIA-hosted models

### Database

- `Supabase PostgreSQL`
- `PostGIS`

## Product Surface

### Frontend

The main application shell lives in [src/app/page.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/app/page.tsx).

Key UI elements:

- full-screen 3D globe background
- event rail for quick switching between active events
- slide-out perspective analysis panel
- contradiction panel for multi-source disagreement summaries
- perspective cards with selectable comparison mode
- source diversity ring and event timeline

Main components:

- [src/components/GlobeView.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/components/GlobeView.tsx)
- [src/components/PerspectiveGrid.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/components/PerspectiveGrid.tsx)
- [src/components/SourceDNACard.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/components/SourceDNACard.tsx)
- [src/components/ComparisonMode.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/components/ComparisonMode.tsx)
- [src/components/ContradictionPanel.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/components/ContradictionPanel.tsx)
- [src/components/EventTimeline.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/components/EventTimeline.tsx)
- [src/components/SourceDiversityRing.tsx](/Z:/PROJECTS/PROJECTS/Terrain/src/components/SourceDiversityRing.tsx)

### Backend

The backend entrypoint is [backend/main.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/main.py).

It handles:

- event marker reads
- perspective assembly for a selected event
- contradiction report generation
- direct article ingestion
- batch ingestion
- external sync from GDELT + RSS
- optional background auto-sync

Supporting modules:

- [backend/agents.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/agents.py) for article analysis, contradiction reports, and distance/proximity math
- [backend/ingestion.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/ingestion.py) for GDELT + RSS collection and payload normalization
- [backend/models.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/models.py) for request and response contracts

## Architecture

### Core Data Model

Terrain currently uses four core tables:

- `events`
  - title
  - coordinates
  - cached contradiction report
- `sources`
  - source identity and editorial metadata
  - origin coordinates
- `stories`
  - article text
  - source relationship
  - event relationship
  - AI analysis cache
- `rss_sources`
  - configurable RSS feed registry
  - editable in Supabase without backend restart

Schema lives in [backend/schema.sql](/Z:/PROJECTS/PROJECTS/Terrain/backend/schema.sql).

### Flow

1. The frontend requests `GET /api/events`.
2. The backend returns the top active event markers from Postgres.
3. The user clicks a globe marker or event rail item.
4. The frontend requests `GET /api/events/{event_id}/perspectives`.
5. The backend joins stories and sources, computes proximity, and fills missing AI analysis on demand.
6. The UI renders perspective cards, source cards, contradiction summaries, and comparison mode.

### External News Sync

Terrain’s current ingestion path is:

1. pull recent geocoded article URLs from `GDELT`
2. pull article titles and snippets from configured `RSS` feeds
3. match RSS items to GDELT URLs where possible
4. use GDELT coordinates for event geolocation
5. fall back to source coordinates when no GDELT match exists
6. upsert `events`, `sources`, and `stories`
7. run article analysis and store alignment data

RSS feeds are no longer controlled only by env. They can now be loaded from the `rss_sources` table first, with env/hardcoded fallback still available as resilience.

## API

### Health

`GET /health`

Returns backend status and DB connectivity state.

### Events

`GET /api/events`

Returns active event markers for the globe, including:

- `id`
- `title`
- `lat`
- `lng`
- `created_at`
- `story_count`
- `source_diversity`

### Perspectives

`GET /api/events/{event_id}/perspectives`

Returns:

- selected event metadata
- event coordinates
- all perspectives for the event
- source metadata
- alignment data
- AI summary / framing / omitted context

### Contradiction Report

`GET /api/events/{event_id}/contradiction-report`

Returns:

- consensus summary
- contradictions list
- bias vector explanation

### Manual Ingestion

`POST /api/ingest/article`

Ingests one normalized article payload.

`POST /api/ingest/articles`

Ingests a batch of normalized article payloads.

### External Sync

`POST /api/ingest/sync`

Triggers a GDELT + RSS sync run using:

- `limit`
- `gdelt_timespan_minutes`
- `gdelt_maxrows`

## Local Development

### Prerequisites

- `Node.js` 20+
- `npm`
- `Python` 3.11+
- a `Supabase Postgres` database
- `PostGIS` enabled on that database

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

From the `backend` directory:

```bash
pip install -r requirements.txt
```

If you use a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Backend env template: [backend/.env.example](/Z:/PROJECTS/PROJECTS/Terrain/backend/.env.example)

Create `backend/.env` with at least:

```env
SUPABASE_DB_URL=
GROQ_API_KEY=
GEMINI_API_KEY=
AUTO_SYNC_ENABLED=true
AUTO_SYNC_INTERVAL_MINUTES=20
AUTO_SYNC_LIMIT=25
AUTO_SYNC_GDELT_TIMESPAN_MINUTES=120
AUTO_SYNC_GDELT_MAXROWS=500
```

Recommended frontend env in a root `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Notes:

- `SUPABASE_DB_URL` can be a direct connection string or Supabase pooler string.
- If your database password contains special characters like `@`, URL-encode them.
- `GROQ_API_KEY` and `GEMINI_API_KEY` are optional in principle, but without a working provider the backend falls back to heuristic analysis.

### 4. Create Schema

Run the SQL in [backend/schema.sql](/Z:/PROJECTS/PROJECTS/Terrain/backend/schema.sql) against your Supabase database.

This creates:

- `events`
- `sources`
- `stories`
- `rss_sources`
- PostGIS indexes
- geometry update triggers

### 5. Seed Demo Data

Seed file: [backend/seed.sql](/Z:/PROJECTS/PROJECTS/Terrain/backend/seed.sql)

Helper script:

```bash
cd backend
python run_seed.py
```

This inserts:

- sample events
- sample sources
- sample stories
- RSS source configuration rows

### 6. Run the Backend

From `backend/`:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 7. Run the Frontend

From the repository root:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## RSS Source Management

RSS sources are configurable through the `rss_sources` table.

That means you can:

- add a new feed in Supabase SQL Editor
- disable a feed by setting `is_active = false`
- update source metadata like country, funding type, lean, or coordinates

and the next sync run will use the new values without requiring a backend restart.

Current feed loading priority in [backend/ingestion.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/ingestion.py):

1. `rss_sources` table
2. `RSS_FEEDS_JSON` env override
3. `DEFAULT_RSS_FEEDS` hardcoded fallback

## Auto Sync Scheduler

Terrain includes an in-process background sync loop.

When enabled, the backend starts a task on FastAPI startup and runs external sync on an interval.

Relevant env vars:

- `AUTO_SYNC_ENABLED`
- `AUTO_SYNC_INTERVAL_MINUTES`
- `AUTO_SYNC_LIMIT`
- `AUTO_SYNC_GDELT_TIMESPAN_MINUTES`
- `AUTO_SYNC_GDELT_MAXROWS`

Important behavior:

- if the backend process stops, sync stops
- if multiple backend instances run, each instance can trigger sync
- it is an app-level scheduler, not a system cron job

For a more production-safe deployment, move this to one of:

- a platform scheduler
- a Supabase scheduled function
- a single-worker job runner
- a DB-lock-based leader election flow

## AI Analysis

Terrain currently uses LLM-backed analysis in [backend/agents.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/agents.py) for:

- article summarization
- editorial frame extraction
- omitted-context detection
- contradiction reports

Behavior today:

- the backend prefers DB source metadata as the source of truth for identity fields
- AI fills article-level fields
- failed LLM calls fall back to deterministic heuristics

The system computes:

- `distance_km`
- `proximity_score`
- `relative_position` as `local`, `regional`, or `global`

## Useful Scripts

Frontend:

- `npm run dev`
- `npm run build`
- `npm run start`

Backend helpers:

- [backend/run_seed.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/run_seed.py)
- [backend/run_ingest_sync.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/run_ingest_sync.py)
- [backend/check_db.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/check_db.py)
- [backend/healthcheck.py](/Z:/PROJECTS/PROJECTS/Terrain/backend/healthcheck.py)

## Project Layout

```text
Terrain/
├─ backend/
│  ├─ agents.py
│  ├─ ingestion.py
│  ├─ main.py
│  ├─ models.py
│  ├─ schema.sql
│  ├─ seed.sql
│  ├─ run_seed.py
│  └─ run_ingest_sync.py
├─ src/
│  ├─ app/
│  ├─ components/
│  └─ types/
├─ package.json
├─ tailwind.config.cjs
└─ TERRAIN_PRD.md
```

## Roadmap Direction

Natural next steps for Terrain:

- stronger event clustering and cross-source matching
- richer source profile and ownership/citation data
- admin tooling for source review and feed operations
- production scheduler / queue setup
- better non-English ingestion and translation
- CI, tests, and deployment docs
