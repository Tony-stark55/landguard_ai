-- ==============================================================================
-- LANDGUARD AI — Supabase PostgreSQL Production Schema
-- North Eastern Region (NER) Landslide Early Warning & Risk Intelligence System
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. LOCATIONS TABLE
-- Monitored hill sectors, towns, and strategic transit corridors across NER
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(64) NOT NULL,
    district VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= 20.0 AND latitude <= 32.0),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= 87.0 AND longitude <= 98.0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for geographical searches
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_lat_lng ON locations(latitude, longitude);

-- 2. TERRAIN FEATURES TABLE
-- Static geomorphometric data derived from 30m Digital Elevation Models & GSI
CREATE TABLE IF NOT EXISTS terrain_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    elevation DOUBLE PRECISION NOT NULL CHECK (elevation >= 0),
    slope DOUBLE PRECISION NOT NULL CHECK (slope >= 0 AND slope <= 90),
    aspect VARCHAR(8) NOT NULL, -- N, NE, E, SE, S, SW, W, NW
    terrain_ruggedness DOUBLE PRECISION NOT NULL CHECK (terrain_ruggedness >= 0 AND terrain_ruggedness <= 100),
    lithology TEXT,
    vegetation_cover VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_location_terrain UNIQUE (location_id)
);

CREATE INDEX IF NOT EXISTS idx_terrain_slope ON terrain_features(slope);

-- 3. WEATHER OBSERVATIONS TABLE
-- Live meteorological telemetry fetched every 15 mins via Open-Meteo
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    rainfall DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (rainfall >= 0),
    precipitation DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (precipitation >= 0),
    accumulated_72h DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (accumulated_72h >= 0),
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION CHECK (humidity >= 0 AND humidity <= 100),
    wind_speed DOUBLE PRECISION CHECK (wind_speed >= 0),
    forecast_rainfall DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    source VARCHAR(128) DEFAULT 'Open-Meteo',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_loc_timestamp ON weather_observations(location_id, timestamp DESC);

-- 4. LANDSLIDE EVENTS TABLE
-- Historical failure catalogue (GSI NLSM, BRO records, NDMA archives)
CREATE TABLE IF NOT EXISTS landslide_events (
    id VARCHAR(64) PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    event_date DATE NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('Minor', 'Moderate', 'Severe', 'Catastrophic')),
    trigger_type VARCHAR(64) DEFAULT 'Rainfall / Monsoon',
    casualties INTEGER DEFAULT 0,
    source VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_landslides_date ON landslide_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_landslides_severity ON landslide_events(severity);
CREATE INDEX IF NOT EXISTS idx_landslides_lat_lng ON landslide_events(latitude, longitude);

-- 5. INFRASTRUCTURE TABLE
-- Lifeline infrastructure within 5km radius of monitored locations
CREATE TABLE IF NOT EXISTS infrastructure (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL CHECK (type IN ('school', 'hospital', 'road', 'settlement', 'bridge', 'railway', 'critical_infrastructure')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    distance_km DOUBLE PRECISION CHECK (distance_km >= 0),
    capacity_or_population INTEGER,
    source VARCHAR(255) DEFAULT 'OpenStreetMap / State GIS',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_infra_type ON infrastructure(type);
CREATE INDEX IF NOT EXISTS idx_infra_location ON infrastructure(location_id);

-- 6. RISK ASSESSMENTS TABLE
-- Periodic multi-factor risk scores computed by the Risk Engine
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    rainfall_score DOUBLE PRECISION NOT NULL CHECK (rainfall_score >= 0 AND rainfall_score <= 100),
    slope_score DOUBLE PRECISION NOT NULL CHECK (slope_score >= 0 AND slope_score <= 100),
    terrain_score DOUBLE PRECISION NOT NULL CHECK (terrain_score >= 0 AND terrain_score <= 100),
    historical_score DOUBLE PRECISION NOT NULL CHECK (historical_score >= 0 AND historical_score <= 100),
    risk_score DOUBLE PRECISION NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    is_hotspot BOOLEAN DEFAULT FALSE,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_loc_timestamp ON risk_assessments(location_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_level ON risk_assessments(risk_level);

-- 7. ALERTS TABLE
-- Early warning notifications emitted when thresholds are breached
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    risk_score DOUBLE PRECISION NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(16) NOT NULL CHECK (risk_level IN ('HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts(location_id);

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
-- Add publication for Supabase Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE risk_assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE weather_observations;
