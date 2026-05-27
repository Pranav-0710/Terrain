-- Setup PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(POINT, 4321),
    ai_contradiction_report JSONB,
    report_story_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sources Table
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(POINT, 4321),
    funding_type TEXT,
    political_lean TEXT DEFAULT 'Unknown',
    press_freedom_score INT DEFAULT 50
);

-- Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    content TEXT,
    url TEXT UNIQUE,
    proximity_score FLOAT,
    ai_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GIST Index for Geo
CREATE INDEX IF NOT EXISTS idx_events_geom ON events USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_sources_geom ON sources USING GIST(geom);

-- Trigger to update geom from lat/lng
CREATE OR REPLACE FUNCTION update_geom() RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4321);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_geom BEFORE INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_geom();
CREATE TRIGGER trg_sources_geom BEFORE INSERT OR UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_geom();

-- RSS Sources Config Table
CREATE TABLE IF NOT EXISTS rss_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    funding_type TEXT NOT NULL DEFAULT 'Unknown',
    political_lean TEXT NOT NULL DEFAULT 'Unknown',
    press_freedom_score INT NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
