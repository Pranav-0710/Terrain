-- Seed script for Terrain V2 Database

-- 1. Clean existing data
TRUNCATE TABLE stories CASCADE;
TRUNCATE TABLE sources CASCADE;
TRUNCATE TABLE events CASCADE;

-- 2. Insert Events
-- Event 1: Global Climate Accord Signed in Geneva
INSERT INTO events (id, title, lat, lng, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'Global Climate Accord Signed in Geneva', 46.2044, 6.1432, NOW() - INTERVAL '1 day');

-- Event 2: Tech Innovation Expo & AI Safety Forum in Tokyo
INSERT INTO events (id, title, lat, lng, created_at) VALUES
('e2222222-2222-2222-2222-222222222222', 'Tech Innovation Expo & AI Safety Forum in Tokyo', 35.6762, 139.6503, NOW() - INTERVAL '2 days');

-- Event 3: Major Energy Infrastructure Agreement in Buenos Aires
INSERT INTO events (id, title, lat, lng, created_at) VALUES
('e3333333-3333-3333-3333-333333333333', 'Major Energy Infrastructure Agreement', -34.6037, -58.3816, NOW() - INTERVAL '3 hours');


-- 3. Insert Sources (using valid hex character 'b' instead of 's' for sources)
INSERT INTO sources (id, name, country, lat, lng, funding_type) VALUES
('b1111111-1111-1111-1111-111111111111', 'Swissinfo', 'Switzerland', 46.2044, 6.1432, 'Public/State-funded'),
('b2222222-2222-2222-2222-222222222222', 'BBC News', 'United Kingdom', 51.5074, -0.1278, 'Public/State-funded'),
('b3333333-3333-3333-3333-333333333333', 'Al Jazeera', 'Qatar', 25.2854, 51.5310, 'State-owned/Monarchy'),
('b4444444-4444-4444-4444-444444444444', 'NHK World', 'Japan', 35.6762, 139.6503, 'Public/State-funded'),
('b5555555-5555-5555-5555-555555555555', 'The New York Times', 'United States', 40.7128, -74.0060, 'Private/Subscription'),
('b6666666-6666-6666-6666-666666666666', 'La Nación', 'Argentina', -34.6037, -58.3816, 'Private/Commercial');


-- 4. Insert Stories (using valid hex character 'a' for stories)
-- Stories for Event 1 (Geneva Climate Summit)
INSERT INTO stories (id, event_id, source_id, content, url, proximity_score, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', 
 'e1111111-1111-1111-1111-111111111111', 
 'b1111111-1111-1111-1111-111111111111', 
 'Swiss federal representatives today signed a landmark treaty on emission limits. The host nation Swissinfo reports local support is high but activists demand faster implementation.', 
 'https://www.swissinfo.ch/climate-geneva-signing-2026', 
 1.0, 
 NOW() - INTERVAL '23 hours'),

('a1111111-1111-1111-1111-222222222222', 
 'e1111111-1111-1111-1111-111111111111', 
 'b2222222-2222-2222-2222-222222222222', 
 'World leaders have agreed to a major climate deal in Geneva. While Europe welcomes the framework, debate continues in London and Washington over enforcement and financial penalties.', 
 'https://www.bbc.co.uk/news/world-climate-treaty-geneva', 
 0.88, 
 NOW() - INTERVAL '20 hours'),

('a1111111-1111-1111-1111-333333333333', 
 'e1111111-1111-1111-1111-111111111111', 
 'b3333333-3333-3333-3333-333333333333', 
 'Developing nations highlight missing funding guarantees in the newly signed Geneva climate accord, expressing deep concern over structural inequities in execution timelines.', 
 'https://www.aljazeera.com/news/geneva-climate-deal-inequity', 
 0.52, 
 NOW() - INTERVAL '18 hours');

-- Stories for Event 2 (Tokyo Tech Expo)
INSERT INTO stories (id, event_id, source_id, content, url, proximity_score, created_at) VALUES
('a2222222-2222-2222-2222-111111111111', 
 'e2222222-2222-2222-2222-222222222222', 
 'b4444444-4444-4444-4444-444444444444', 
 'Tokyo tech expo showcases next-gen autonomous systems. NHK World reports the government plan to subsidize domestic semiconductor fabrications is drawing massive local investment.', 
 'https://www3.nhk.or.jp/news/tokyo-tech-safety-expo-2026', 
 1.0, 
 NOW() - INTERVAL '1 day'),

('a2222222-2222-2222-2222-222222222222', 
 'e2222222-2222-2222-2222-222222222222', 
 'b5555555-5555-5555-5555-555555555555', 
 'At Tokyo’s tech forum, global tech giants raise concern over Japan’s hardware-first security policy, noting a critical divergence in software alignment compared to Silicon Valley standards.', 
 'https://www.nytimes.com/tech/tokyo-expo-safety-rules', 
 0.35, 
 NOW() - INTERVAL '18 hours');

-- Stories for Event 3 (Buenos Aires Energy Agreement)
INSERT INTO stories (id, event_id, source_id, content, url, proximity_score, created_at) VALUES
('a3333333-3333-3333-3333-111111111111', 
 'e3333333-3333-3333-3333-333333333333', 
 'b6666666-6666-6666-6666-666666666666', 
 'Argentina formaliza el acuerdo de integración energética en Buenos Aires para la construcción del nuevo gasoducto patagónico, asegurando fondos de co-desarrollo regional.', 
 'https://www.lanacion.com.ar/economia/acuerdo-energetico-buenos-aires', 
 1.0, 
 NOW() - INTERVAL '2 hours'),

('a3333333-3333-3333-3333-222222222222', 
 'e3333333-3333-3333-3333-333333333333', 
 'b5555555-5555-5555-5555-555555555555', 
 'Argentina enters a new energy partnership in Buenos Aires amidst severe inflationary pressures. Wall street analysts debate whether capital guarantees will hold over the five-year build.', 
 'https://www.nytimes.com/business/argentina-energy-deal-inflation', 
 0.42, 
 NOW() - INTERVAL '1 hour');

-- RSS Source Config Seed
INSERT INTO rss_sources (name, url, country, lat, lng, funding_type, is_active) VALUES
('BBC News', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'United Kingdom', 51.5074, -0.1278, 'Public/State-funded', TRUE),
('The Guardian', 'https://www.theguardian.com/world/rss', 'United Kingdom', 51.5074, -0.1278, 'Private/Reader-funded', TRUE),
('NPR', 'https://feeds.npr.org/1004/rss.xml', 'United States', 38.9072, -77.0369, 'Nonprofit/Public media', TRUE),
('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'Qatar', 25.2854, 51.5310, 'State-owned', TRUE),
('Deutsche Welle', 'https://rss.dw.com/xml/rss-en-world', 'Germany', 50.7374, 7.0982, 'Public/State-funded', TRUE),
('Times of India', 'https://timesofindia.indiatimes.com/rss/4719148.cms', 'India', 28.6139, 77.2090, 'Private/Commercial', TRUE),
('NHK World', 'https://www3.nhk.or.jp/rss/news/cat0.xml', 'Japan', 35.6762, 139.6503, 'Public/State-funded', TRUE),
('Reuters', 'https://feeds.reuters.com/reuters/worldNews', 'United Kingdom', 51.5074, -0.1278, 'Private/Wire service', TRUE)
ON CONFLICT (url) DO NOTHING;
