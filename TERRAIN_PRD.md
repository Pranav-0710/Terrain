# Terrain — Product Requirements Document
**Version:** 1.0  
**Status:** Draft  
**Owner:** Pranav  
**Last updated:** May 2026

---

## 1. Executive Summary

Terrain is a geo-anchored, source-transparent news intelligence platform. It shows the same global event through multiple editorial lenses, ranked by geographic proximity to where the event happened — with every source's funding, ownership, and track record visible to the user.

The promise is not "unbiased news." The promise is **transparent news.**

---

## 2. Problem Statement

People consume news in a bubble without knowing it. Not because they are stupid — because the system is designed that way. Every major outlet filters events through its own geography, funding, and audience demographics.

A flood in Bangladesh gets 40 words in Western papers and front pages in Dhaka. A protest in Latin America gets framed completely differently by a US outlet versus a local one versus a regional one. The average reader has no visibility into this. They read one source and think they know what happened.

The result: billions of people making opinions — and eventually votes, donations, and moral judgments — on a radically incomplete picture of the world.

**What is broken:**
- Single-source consumption with no transparency into editorial bias
- No visibility into source funding, ownership, or track record
- No geographic context for how close a reporter was to an event
- No side-by-side comparison of how the same story is told differently across the world
- Non-English and local-language coverage systematically excluded from "global" news platforms

---

## 3. Goals

### Product goals
- Show any global news event through a minimum of 5 editorially distinct sources
- Surface the geographic proximity of each source to the event
- Make source funding, ownership, and historical accuracy visible per article
- Allow users to compare perspectives side by side without editorial curation determining the "right" one

### Business goals
- Reach 1,000 waitlist signups by end of Phase 1
- Convert 5% of beta users to paid subscriptions at launch
- Reach $5,000 MRR by month 12

### Non-goals (explicitly out of scope for v1)
- Original reporting or journalism
- Social features, comments, or user-generated content
- Real-time breaking news alerts
- Mobile native app
- Podcast or video content

---

## 4. Target Users

### Primary: The globally curious professional (25–45)
They already read news. They are already skeptical of single-source coverage. They travel, work cross-border, or care about geopolitics. They will pay for depth and transparency, not just aggregation. They feel like they are missing something and know it.

**Specific segments:**
- Journalists and researchers who need source breadth
- Policy analysts and NGO professionals
- Internationally active business professionals
- Politically engaged citizens who distrust their local media ecosystem

### Secondary (v2+)
- University students studying international relations or journalism
- Educators building media literacy curricula

---

## 5. Core Concepts

### 5.1 Event
A discrete news occurrence anchored to a geographic coordinate. One event can have many stories written about it by many sources.

### 5.2 Source
A news outlet with a known profile: country of origin, funding type (state, corporate, independent, NGO-funded), historical accuracy rating, and political context.

### 5.3 Story
A single article or report by a single source about a specific event. A story belongs to one event and one source.

### 5.4 Proximity score
A numeric score (0–100) expressing how geographically close a source's origin country is to the event's coordinate. A Nairobi outlet covering a story in Nairobi scores 100. A London outlet covering the same story scores low. Proximity is one signal — not a quality guarantee.

### 5.5 Source DNA card
A structured card shown for every source containing: country of origin, funding type, ownership structure, known political lean (where classifiable), proximity score, and historical accuracy rating.

### 5.6 Perspective cluster
The grouping of stories about the same event by editorial angle — not by left/right, but by framing: who is centered, whose voice is quoted, what context is treated as given.

---

## 6. Features

### 6.1 3D Globe (core UI)
- Interactive globe rendering current and recent events as geographic pins
- Pin clusters at country and region level that expand on zoom
- Color intensity indicating volume of coverage in a region
- Click pin → open event panel
- Filter by: time range, event category, region

**Acceptance criteria:**
- Globe loads in under 3 seconds on a standard broadband connection
- Minimum 30fps interaction on mid-range laptop hardware
- At least 50 concurrent events visible without performance degradation

### 6.2 Event panel
- Event title and one-line summary (auto-generated, not editorial)
- Map showing exact coordinate of the event
- List of all stories covering this event, sorted by proximity score (default)
- Toggle to sort by: most recent, most sources, furthest source
- Filter by: source funding type, source country

**Acceptance criteria:**
- Every event has a minimum of 3 stories
- Stories are deduplicated — no two entries from the same article
- Each story links directly to the original publication

### 6.3 Story card
- Headline (original, not rewritten)
- Source name and country flag
- Proximity score badge
- Publication date and time
- 2–3 sentence summary (auto-generated by open-source LLM)
- Source DNA card (expandable)
- External link to full article

**Acceptance criteria:**
- Story card never reproduces more than 2 sentences of original article text
- Summary is clearly labeled as AI-generated
- Source DNA card loads within 500ms

### 6.4 Source DNA card (detail)
- Source name and logo
- Country of origin
- Funding type: State / Corporate / Independent / NGO-funded / Mixed
- Parent company or owner (if known)
- Political context (only shown for domestic political coverage where classifiable)
- Proximity score to this event
- Accuracy rating (sourced from AllSides, Ad Fontes Media, or internal vetting)
- Link to full source profile page

### 6.5 Side-by-side perspective view
- Select 2–4 stories from the same event
- View their summaries, source cards, and key claims side by side
- Highlighted divergences: claims present in one story but absent in another
- Available on free tier for up to 2 stories; paid tier for up to 4

### 6.6 Source profile page
- Full history of source's coverage on Terrain
- Funding disclosure with citations
- Track record: accuracy ratings over time
- Geographic coverage pattern (what regions does this source tend to cover?)
- Stories indexed on Terrain

### 6.7 Weekly digest (paid tier)
- Curated email of the 5 most under-covered events of the week
- Selected by coverage gap algorithm: events with high local coverage but low international reach
- No editorial opinion — only coverage data

---

## 7. Technical Architecture

### 7.1 Tech stack

**Frontend**
- React (TypeScript)
- globe.gl for 3D globe rendering
- Tailwind CSS for UI components

**Backend**
- Python FastAPI
- PostgreSQL with PostGIS extension for geographic queries
- pgvector for semantic similarity and story deduplication
- Redis for caching (event clusters, source cards)

**Data pipeline**
- feedparser for RSS ingestion (200+ feeds)
- spaCy for NLP entity extraction and geo-tagging
- sentence-transformers for story deduplication and clustering
- LibreTranslate (self-hosted) for non-English source translation
- Mistral 7B (self-hosted via Ollama) for article summarisation

**Infrastructure**
- Render or Railway for backend hosting (~$7/month to start)
- Vercel for frontend hosting (free tier)
- Cloudflare for CDN and DDoS protection (free tier)
- GitHub Actions for CI/CD

### 7.2 Data model (simplified)

**events**
- id, title, summary, coordinate (lat/lng), category, created_at, updated_at

**sources**
- id, name, country_code, funding_type, owner, accuracy_rating, political_lean, created_at

**stories**
- id, event_id, source_id, headline, url, published_at, proximity_score, summary_ai, raw_text_hash

**source_dna**
- id, source_id, field_name, field_value, citation_url, verified_at

### 7.3 Ingestion pipeline flow

1. RSS fetcher pulls new items from 200+ feeds every 15 minutes
2. Each item is deduplicated against existing stories using semantic hash
3. NLP extracts named entities — locations, persons, organisations
4. Geo-tagger resolves location entities to lat/lng coordinates
5. Story is matched to an existing event or a new event is created
6. Proximity score is computed: source country centroid vs event coordinate
7. Summariser generates 2–3 sentence summary using Mistral 7B
8. Story is written to database and globe cache is invalidated

---

## 8. Source Acquisition Strategy

This is the hardest and most important part of the product. Without quality, diverse sources, the globe is a map of Anglophone wire services.

### Phase 1 (manual, 0–3 months)
- Hand-curate 50 sources across 20 countries
- Prioritise: India (regional diversity), Africa (underrepresented), Latin America, Southeast Asia
- Each source manually vetted for: active publishing, accessible RSS feed, known funding

### Phase 2 (semi-automated, 3–9 months)
- Build source submission form for journalists and newsrooms to register
- Partner with journalism schools (IIT Media Studies, Columbia Journalism Review)
- Index sources from GDELT and MediaCloud databases
- Target: 300 sources across 50 countries

### Phase 3 (network, 9–18 months)
- Paid partnerships with vetted local outlets in underrepresented regions
- Affiliate model: outlets earn a share of subscription revenue proportional to their story views
- Target: 1,000+ sources across 80+ countries, minimum 30% non-English

---

## 9. Editorial Policy (public document)

Terrain's editorial policy must be published and version-controlled. It governs:

1. **Source inclusion criteria:** Any outlet with a verifiable publishing history of 6+ months, accessible RSS, and no documented history of fabricated reporting is eligible. Terrain does not editorially exclude outlets based on political lean.
2. **Source DNA accuracy:** All funding and ownership data must be cited with a primary source. Uncited fields are displayed as "unknown" — never assumed.
3. **Summarisation policy:** AI-generated summaries must be clearly labeled. Summaries are extractive, not interpretive — they do not add context not present in the original article.
4. **No curation of perspectives:** Terrain does not choose which perspective is "correct." Stories are sorted by proximity score by default. Users control sorting.
5. **Dispute process:** Any source can submit a correction to their Source DNA card. Corrections are reviewed within 7 days and published with a changelog.

---

## 10. Monetisation

### Free tier
- Globe access (all events)
- Up to 3 perspectives per event
- Basic source card (funding type + proximity score)
- 7-day story history

### Terrain Pro ($9/month or $89/year)
- All perspectives per event (no limit)
- Full Source DNA card with citations
- Side-by-side comparison (up to 4 stories)
- Claim-level divergence highlighting
- Unlimited story history
- Weekly digest email
- Region and category filters

### Future (v2+)
- Terrain for Teams (newsrooms, universities) — volume licensing
- API access for researchers and developers
- White-label for journalism education programmes

---

## 11. Success Metrics

### Phase 1 metrics (weeks 1–6)
- Number of unique visitors to the single-story proof page
- % who view more than 2 source cards
- % who say "I would pay for this" (qualitative interview)
- Specific unmet needs identified per user interview

### Phase 2 metrics (months 2–6)
- Waitlist size (target: 1,000)
- Weekly active users on open beta
- Average number of source cards viewed per session
- Return rate (users who come back within 7 days)

### Phase 3 metrics (months 6–18)
- Monthly recurring revenue
- Free-to-paid conversion rate (target: 5%)
- Churn rate (target: <7%/month)
- Number of indexed sources
- % of events with at least one non-English source

---

## 12. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Copyright claims from publishers | High | High | Headline + summary + link only. Never full text. Legal review before launch. |
| AI summary inaccuracy | Medium | High | Label all summaries clearly. User can always click to original. |
| Source DNA data becoming stale | High | Medium | Quarterly review cycle. Community correction submissions. |
| LLM inference cost at scale | Medium | High | Self-hosted Mistral via Ollama. Summarise on demand, not on ingestion. |
| "Unbiased" claim misread by press | High | Medium | Never use the word unbiased. Brand language is "transparent." |
| Local source gap in key regions | High | Medium | Prioritise partnerships early. Manual curation for underrepresented regions. |
| Team burnout on zero budget | Medium | High | Phase 1 is 6 weeks max. Ship, test, decide. Do not extend indefinitely. |

---

## 13. Out of Scope for v1

- Original reporting
- Video or audio content
- Social features or comments
- User-submitted story tips
- Native mobile app
- Real-time push notifications
- Support for paywalled source articles

---

## 14. Open Questions (require decisions before Phase 2)

1. Who owns the editorial policy review process? One person or a committee?
2. How do we handle sources that are partially state-funded but editorially independent?
3. What is the threshold for removing a source from the index for accuracy violations?
4. Do we disclose the specific model used for summarisation? (Recommended: yes)
5. What legal jurisdiction governs the platform? Relevant for copyright exposure.

---

## 15. Appendix — Phase 1 Story Selection Criteria

The first story used for the proof-of-concept must satisfy all of the following:

- Currently active (not concluded)
- Has verifiable coverage in at least 8 countries
- Has at least 3 countries where local-language coverage differs substantially from international wire coverage
- Not a purely domestic political story (US elections, UK party politics) — must have clear geographic anchor
- Not so sensitive that early-stage handling could cause reputational harm

**Strong candidates as of mid-2026:** Climate displacement events, regional conflict in underreported zones, cross-border economic policy impacts.
