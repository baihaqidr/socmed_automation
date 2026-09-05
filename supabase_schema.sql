-- ==============================================================================
-- SUPABASE SQL SCHEMA: Socmed Automation Engine
-- ==============================================================================

-- 1. Table: rules (Keyword auto-reply rules)
CREATE TABLE IF NOT EXISTS rules (
    id BIGSERIAL PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    reply_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial default rules
INSERT INTO rules (keyword, reply_message)
VALUES 
    ('harga', 'Halo kak! Info harga & pricelist lengkap bisa DM kami atau klik link WA di bio ya 😊'),
    ('lokasi', 'Lokasinya sangat strategis di Ciracas kak, yuk survey minggu ini! Hubungi WA di bio untuk janji temu.'),
    ('spesifikasi', 'Rumah mewah 2 lantai, LT 65m2 LB 65m2 siap huni kak! Promo DP 0% & Free BPHTB.')
ON CONFLICT (keyword) DO NOTHING;

-- 2. Table: replied_comments (Tracking replied comment IDs)
CREATE TABLE IF NOT EXISTS replied_comments (
    comment_id TEXT PRIMARY KEY,
    post_id TEXT,
    username TEXT,
    comment_text TEXT,
    reply_text TEXT,
    replied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_replied_comments_comment_id ON replied_comments(comment_id);

-- 3. Table: app_settings (Stores Config & Token)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value)
VALUES 
    ('instagram_account_id', '17841466987503898'),
    ('access_token', 'EAGHy3jJfJscBSYs6l3B6Bwly4yEsB3fSHfNPwF22Ftlvpsv3CZBLHqrvcrNU07FZAD1KM1WLvO4HrDAw257snRzMOVIZAMUegfj4h77P1N6HYdoWyZAmIrSxiG7YpoJ3MgljZAl7jA6pHNzTux0b7kQNSPfAdehS3EIhoPbnXqmChB90pH4mmifoWJOySkQ4s'),
    ('auto_pilot_enabled', 'true'),
    ('scan_interval_minutes', '1')
ON CONFLICT (key) DO NOTHING;

-- 4. Table: posts_log (History of published feed posts)
CREATE TABLE IF NOT EXISTS posts_log (
    id BIGSERIAL PRIMARY KEY,
    media_id TEXT,
    caption TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: post_rules (Per-post custom automation, custom link & direct message templates)
CREATE TABLE IF NOT EXISTS post_rules (
    post_id TEXT PRIMARY KEY,
    post_caption_preview TEXT,
    cta_link TEXT,
    custom_reply TEXT,
    send_dm BOOLEAN DEFAULT FALSE,
    dm_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) & Policies
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE replied_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_rules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access to rules') THEN
        CREATE POLICY "Allow public full access to rules" ON rules FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access to replied_comments') THEN
        CREATE POLICY "Allow public full access to replied_comments" ON replied_comments FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access to app_settings') THEN
        CREATE POLICY "Allow public full access to app_settings" ON app_settings FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access to posts_log') THEN
        CREATE POLICY "Allow public full access to posts_log" ON posts_log FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public full access to post_rules') THEN
        CREATE POLICY "Allow public full access to post_rules" ON post_rules FOR ALL USING (true);
    END IF;
END $$;
