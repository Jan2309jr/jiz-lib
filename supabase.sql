-- Run this once in Supabase Dashboard -> SQL Editor

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  category_id uuid not null references categories(id) on delete cascade,
  epub_path text not null,
  epub_url text not null,
  cover_path text,
  cover_url text,
  created_at timestamptz not null default now()
);

create index if not exists books_category_idx on books(category_id);

-- Backend uses the service-role key (bypasses RLS). Lock the tables for everyone else.
alter table categories enable row level security;
alter table books enable row level security;

-- Public storage bucket for epubs + covers
insert into storage.buckets (id, name, public)
values ('library', 'library', true)
on conflict (id) do nothing;
