create extension if not exists pgcrypto;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  review_text text not null
    check (char_length(btrim(review_text)) > 0),
  rating integer
    check (rating between 1 and 5),
  review_date date,
  source text
    check (source is null or char_length(btrim(source)) > 0),
  reviewer_name text
    check (reviewer_name is null or char_length(btrim(reviewer_name)) > 0),
  sentiment text
    check (sentiment is null or sentiment in ('Positive', 'Neutral', 'Negative')),
  theme text
    check (theme is null or char_length(btrim(theme)) > 0),
  created_at timestamptz not null default now()
);

create index reviews_created_at_idx
  on public.reviews (created_at desc);

create index reviews_review_date_idx
  on public.reviews (review_date desc);

create index reviews_source_idx
  on public.reviews (source);

alter table public.reviews enable row level security;

create policy "Public can read reviews"
  on public.reviews for select
  to anon, authenticated
  using (true);

create policy "Public can upload reviews"
  on public.reviews for insert
  to anon, authenticated
  with check (true);
