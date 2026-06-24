-- NeonDB Schema for Cadenza
-- Run this in the Neon SQL Editor (https://console.neon.tech)

-- ==========================================
-- 1. Enable Extensions
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- for pgvector embeddings

-- ==========================================
-- 2. Users Table (replaces Supabase auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  genre_preferences TEXT[] DEFAULT '{}',
  voice_footprint JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. Lyrics Grounding Corpus (pgvector)
-- ==========================================
CREATE TABLE IF NOT EXISTS lyric_corpus (
  id SERIAL PRIMARY KEY,
  genre TEXT NOT NULL,
  mood TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'rhyme_pattern', 'structure_template', 'vocabulary_bank'
  embedding vector(384)    -- 384 dimensions (standard for miniLM models)
);

-- ==========================================
-- 4. Lyrics Table
-- ==========================================
CREATE TABLE IF NOT EXISTS lyrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Untitled Creation',
  language TEXT NOT NULL,
  seed_phrase TEXT NOT NULL,
  genre TEXT NOT NULL,
  mood TEXT,
  tempo TEXT,
  structure TEXT,
  rhyme_density TEXT,
  sections JSONB NOT NULL,  -- [{ label: "Verse 1", lines: [...] }, ...]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. Instrumentals Table
-- ==========================================
CREATE TABLE IF NOT EXISTS instrumentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lyric_id UUID REFERENCES lyrics(id) ON DELETE SET NULL,
  instruments JSONB NOT NULL,  -- [{ name, quality, effect }]
  audio_url TEXT NOT NULL,
  provider TEXT DEFAULT 'mock',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 6. Tracks (Voice + Instrumental Combined)
-- ==========================================
CREATE TABLE IF NOT EXISTS tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lyric_id UUID REFERENCES lyrics(id) ON DELETE SET NULL,
  instrumental_id UUID REFERENCES instrumentals(id) ON DELETE SET NULL,
  voice_archetype TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  provider TEXT DEFAULT 'mock',
  effects_applied JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 7. Cosine Similarity Search Helper
-- ==========================================
CREATE OR REPLACE FUNCTION match_lyric_corpus (
  query_embedding vector(384),
  match_threshold FLOAT,
  match_count INT,
  filter_genre TEXT
)
RETURNS TABLE (
  id INT,
  genre TEXT,
  mood TEXT,
  content TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    lyric_corpus.id,
    lyric_corpus.genre,
    lyric_corpus.mood,
    lyric_corpus.content,
    lyric_corpus.category,
    1 - (lyric_corpus.embedding <=> query_embedding) AS similarity
  FROM lyric_corpus
  WHERE lyric_corpus.genre = filter_genre
    AND 1 - (lyric_corpus.embedding <=> query_embedding) > match_threshold
  ORDER BY lyric_corpus.embedding <=> query_embedding
  LIMIT match_count;
$$;
