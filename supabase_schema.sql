-- Supabase Setup Script for Cadenza

-- ==========================================
-- 1. Enable Extensions
-- ==========================================
create extension if not exists vector;

-- ==========================================
-- 2. User Profiles Table
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  genre_preferences text[] default '{}',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, genre_preferences)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substring(new.id::text from 1 for 8)),
    coalesce(array(select jsonb_array_elements_text(new.raw_user_meta_data->'genre_preferences')), '{}')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. Lyrics Grounding Corpus (pgvector)
-- ==========================================
create table public.lyric_corpus (
  id serial primary key,
  genre text not null,
  mood text,
  content text not null,
  category text not null, -- 'rhyme_pattern', 'structure_template', 'vocabulary_bank'
  embedding vector(384) -- Using 384 dimensions (standard for miniLM models)
);

alter table public.lyric_corpus enable row level security;

create policy "Lyrics corpus is readable by authenticated users" 
  on public.lyric_corpus for select 
  using (auth.role() = 'authenticated');

-- Cosine similarity search helper function
create or replace function match_lyric_corpus (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_genre text
)
returns table (
  id int,
  genre text,
  mood text,
  content text,
  category text,
  similarity float
)
language sql stable
as $$
  select
    lyric_corpus.id,
    lyric_corpus.genre,
    lyric_corpus.mood,
    lyric_corpus.content,
    lyric_corpus.category,
    1 - (lyric_corpus.embedding <=> query_embedding) as similarity
  from lyric_corpus
  where lyric_corpus.genre = filter_genre
    and 1 - (lyric_corpus.embedding <=> query_embedding) > match_threshold
  order by lyric_corpus.embedding <=> query_embedding
  limit match_count;
$$;

-- ==========================================
-- 4. Lyrics Table
-- ==========================================
create table public.lyrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  language text not null,
  seed_phrase text not null,
  genre text not null,
  mood text,
  tempo text,
  structure text,
  rhyme_density text,
  sections jsonb not null, -- [{ label: "Verse 1", lines: [...] }, ...]
  created_at timestamptz default now()
);

alter table public.lyrics enable row level security;

create policy "Users can manage their own lyrics" 
  on public.lyrics for all 
  using (auth.uid() = user_id);

-- ==========================================
-- 5. Instrumentals Table
-- ==========================================
create table public.instrumentals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  lyric_id uuid references public.lyrics on delete set null,
  instruments jsonb not null, -- [{ name, quality, effect }]
  audio_url text not null,
  provider text default 'mock',
  created_at timestamptz default now()
);

alter table public.instrumentals enable row level security;

create policy "Users can manage their own instrumentals" 
  on public.instrumentals for all 
  using (auth.uid() = user_id);

-- ==========================================
-- 6. Tracks (Voice + Instrumental Combined)
-- ==========================================
create table public.tracks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  lyric_id uuid references public.lyrics on delete set null,
  instrumental_id uuid references public.instrumentals on delete set null,
  voice_archetype text not null,
  audio_url text not null,
  provider text default 'mock',
  created_at timestamptz default now()
);

alter table public.tracks enable row level security;

create policy "Users can manage their own tracks" 
  on public.tracks for all 
  using (auth.uid() = user_id);
