<div align="center">
  <img src="https://raw.githubusercontent.com/Pranav-0710/Terrain/main/public/terrain-logo.png" alt="Terrain Logo" width="200" onerror="this.src='https://via.placeholder.com/200?text=TERRAIN'">
  <h1>🌍 Terrain</h1>
  <p><b>Geo-anchored. Source-transparent. Unbiased Intelligence.</b></p>
  
  [![Hackathon](https://img.shields.io/badge/Built%20for-OpenAI%20Hackathon-f43f5e?style=for-the-badge&logo=openai)](https://openai.com)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
</div>

<br/>

**Terrain** is a cutting-edge global news intelligence platform that maps live events onto a cinematic 3D WebGL globe. It empowers users to instantly compare how different media outlets across the globe frame the exact same event—factoring in source geography, funding, political context, and AI-generated consensus analysis.

Stop scrolling through infinite news feeds. Start viewing the world from above.

---

## ✨ Premium Features

- **🌐 3D Immersive Globe:** A WebGL-powered spatial interface mapping live global events in real-time.
- **🤖 AI Consensus & Contradiction Engine:** Our backend ingests articles and uses LLMs to automatically extract editorial framing, omit context notes, and surface direct contradictions between sources.
- **🕹️ "Red Team" Scenario Simulator:** An interactive command-center mode that lets you play policymaker. Choose a response to a live event and watch the AI simulate the 30-day geopolitical fallout directly onto the globe.
- **🎛️ Thematic HUD Controller:** Filter the globe in real-time by dynamic topics (Conflict, Tech, Climate, Social) and Regions, complete with glassmorphic spatial UI.
- **📡 GDELT + RSS Intelligence Sync:** An automated backend pipeline pulling real-time, geocoded news coverage from the open web.

## 🛠️ The Stack

**Frontend (Cinematic UI)**
- `Next.js 16` (Turbopack) & `React 19`
- `Tailwind CSS 4` & `Framer Motion` (Glassmorphism & Spring Animations)
- `react-globe.gl` (Three.js WebGL rendering)

**Backend (Intelligence Engine)**
- `FastAPI` (Python 3.11+)
- OpenAI / Groq / Gemini (LLM integrations for NLP processing)
- `Supabase` (PostgreSQL + PostGIS for spatial queries)

---

## 🚀 Quick Start (Local Development)

Want to run Terrain on your own machine?

### 1. Database Setup
You will need a Supabase PostgreSQL database with PostGIS enabled. 
Run the SQL from `backend/schema.sql` to initialize your tables, followed by `backend/seed.sql` to load demo intelligence.

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
```
Create a `backend/.env` file:
```env
SUPABASE_DB_URL=your_db_connection_string
GROQ_API_KEY=your_api_key
GEMINI_API_KEY=your_api_key
AUTO_SYNC_ENABLED=true
```
Run the server:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Frontend (Next.js)
In a new terminal window:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` to enter the Terrain command center.

---

## 🏗️ Architecture Flow

1. **Ingestion**: The Python backend continuously scrapes GDELT and global RSS feeds.
2. **Analysis**: AI agents analyze incoming articles for bias, framing, and omitted context, resolving contradictions.
3. **Spatialization**: Data is mapped via PostGIS and pushed to the Next.js frontend.
4. **Interaction**: The user navigates the globe, triggers simulations, and views perspective matrices on the fly.

---

<div align="center">
  <i>Built for the OpenAI Hackathon. Pushing the boundaries of spatial UI and autonomous journalism.</i>
</div>
