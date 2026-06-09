create extension if not exists pgcrypto;

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null,
  pergunta text not null,
  resposta text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null,
  tipo text not null check (tipo in ('link', 'pdf', 'video', 'anotacao')),
  titulo text not null,
  valor text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resumos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null,
  titulo text not null,
  conteudo text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.glossario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  termo text not null,
  definicao text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme_preference text null check (theme_preference in ('light', 'dark')),
  legacy_migration_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.revisoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null,
  titulo text not null,
  criado_em bigint not null default (extract(epoch from timezone('utc', now())) * 1000)::bigint,
  revisar_em bigint not null,
  feito boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.portfolio_real (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null,
  tipo text not null check (tipo in ('figma', 'pdf', 'site')),
  titulo text not null,
  url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.portfolio_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null default 'portfolio',
  share_slug text not null unique,
  title text null,
  description text null,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, subject_slug)
);

create table if not exists public.disciplinas_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null,
  status_override text null check (status_override in ('em-andamento', 'concluida')),
  unlock_override boolean not null default false,
  avaliacao_status text null check (avaliacao_status in ('pendente', 'concluida')),
  avaliacao_nota text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, subject_slug)
);

create index if not exists flashcards_user_subject_idx on public.flashcards (user_id, subject_slug, created_at desc);
create index if not exists materiais_user_subject_idx on public.materiais (user_id, subject_slug, created_at desc);
create index if not exists resumos_user_subject_idx on public.resumos (user_id, subject_slug, created_at desc);
create index if not exists glossario_user_created_idx on public.glossario (user_id, created_at desc);
create index if not exists user_settings_updated_idx on public.user_settings (updated_at desc);
create index if not exists revisoes_user_subject_idx on public.revisoes (user_id, subject_slug, revisar_em asc);
create index if not exists portfolio_real_user_subject_idx on public.portfolio_real (user_id, subject_slug, created_at desc);
create index if not exists portfolio_shares_user_subject_idx on public.portfolio_shares (user_id, subject_slug);
create index if not exists portfolio_shares_share_slug_idx on public.portfolio_shares (share_slug);
create index if not exists disciplinas_status_user_subject_idx on public.disciplinas_status (user_id, subject_slug);

alter table public.flashcards enable row level security;
alter table public.materiais enable row level security;
alter table public.resumos enable row level security;
alter table public.glossario enable row level security;
alter table public.user_settings enable row level security;
alter table public.revisoes enable row level security;
alter table public.portfolio_real enable row level security;
alter table public.portfolio_shares enable row level security;
alter table public.disciplinas_status enable row level security;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'revisoes'
      and column_name = 'criado_em'
      and data_type = 'timestamp with time zone'
  ) then
    alter table public.revisoes
      alter column criado_em drop default,
      alter column criado_em type bigint using (extract(epoch from criado_em) * 1000)::bigint,
      alter column criado_em set default (extract(epoch from timezone('utc', now())) * 1000)::bigint;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'revisoes'
      and column_name = 'revisar_em'
      and data_type = 'timestamp with time zone'
  ) then
    alter table public.revisoes
      alter column revisar_em type bigint using (extract(epoch from revisar_em) * 1000)::bigint;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_settings'
      and column_name = 'legacy_migration_flags'
      and udt_name <> 'jsonb'
  ) then
    alter table public.user_settings
      alter column legacy_migration_flags type jsonb using legacy_migration_flags::jsonb;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'flashcards' and policyname = 'flashcards_select_own'
  ) then
    create policy flashcards_select_own on public.flashcards for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'flashcards' and policyname = 'flashcards_insert_own'
  ) then
    create policy flashcards_insert_own on public.flashcards for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'flashcards' and policyname = 'flashcards_update_own'
  ) then
    create policy flashcards_update_own on public.flashcards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'flashcards' and policyname = 'flashcards_delete_own'
  ) then
    create policy flashcards_delete_own on public.flashcards for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'materiais' and policyname = 'materiais_select_own'
  ) then
    create policy materiais_select_own on public.materiais for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'materiais' and policyname = 'materiais_insert_own'
  ) then
    create policy materiais_insert_own on public.materiais for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'materiais' and policyname = 'materiais_update_own'
  ) then
    create policy materiais_update_own on public.materiais for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'materiais' and policyname = 'materiais_delete_own'
  ) then
    create policy materiais_delete_own on public.materiais for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'resumos' and policyname = 'resumos_select_own'
  ) then
    create policy resumos_select_own on public.resumos for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'resumos' and policyname = 'resumos_insert_own'
  ) then
    create policy resumos_insert_own on public.resumos for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'resumos' and policyname = 'resumos_update_own'
  ) then
    create policy resumos_update_own on public.resumos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'resumos' and policyname = 'resumos_delete_own'
  ) then
    create policy resumos_delete_own on public.resumos for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'glossario' and policyname = 'glossario_select_own'
  ) then
    create policy glossario_select_own on public.glossario for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'glossario' and policyname = 'glossario_insert_own'
  ) then
    create policy glossario_insert_own on public.glossario for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'glossario' and policyname = 'glossario_update_own'
  ) then
    create policy glossario_update_own on public.glossario for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'glossario' and policyname = 'glossario_delete_own'
  ) then
    create policy glossario_delete_own on public.glossario for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_select_own'
  ) then
    create policy user_settings_select_own on public.user_settings for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_insert_own'
  ) then
    create policy user_settings_insert_own on public.user_settings for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_update_own'
  ) then
    create policy user_settings_update_own on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_settings' and policyname = 'user_settings_delete_own'
  ) then
    create policy user_settings_delete_own on public.user_settings for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revisoes' and policyname = 'revisoes_select_own'
  ) then
    create policy revisoes_select_own on public.revisoes for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revisoes' and policyname = 'revisoes_insert_own'
  ) then
    create policy revisoes_insert_own on public.revisoes for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revisoes' and policyname = 'revisoes_update_own'
  ) then
    create policy revisoes_update_own on public.revisoes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revisoes' and policyname = 'revisoes_delete_own'
  ) then
    create policy revisoes_delete_own on public.revisoes for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_real' and policyname = 'portfolio_real_select_own'
  ) then
    create policy portfolio_real_select_own on public.portfolio_real for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_real' and policyname = 'portfolio_real_insert_own'
  ) then
    create policy portfolio_real_insert_own on public.portfolio_real for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_real' and policyname = 'portfolio_real_update_own'
  ) then
    create policy portfolio_real_update_own on public.portfolio_real for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_real' and policyname = 'portfolio_real_delete_own'
  ) then
    create policy portfolio_real_delete_own on public.portfolio_real for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_shares' and policyname = 'portfolio_shares_select_own'
  ) then
    create policy portfolio_shares_select_own on public.portfolio_shares for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_shares' and policyname = 'portfolio_shares_insert_own'
  ) then
    create policy portfolio_shares_insert_own on public.portfolio_shares for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_shares' and policyname = 'portfolio_shares_update_own'
  ) then
    create policy portfolio_shares_update_own on public.portfolio_shares for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portfolio_shares' and policyname = 'portfolio_shares_delete_own'
  ) then
    create policy portfolio_shares_delete_own on public.portfolio_shares for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'disciplinas_status' and policyname = 'disciplinas_status_select_own'
  ) then
    create policy disciplinas_status_select_own on public.disciplinas_status for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'disciplinas_status' and policyname = 'disciplinas_status_insert_own'
  ) then
    create policy disciplinas_status_insert_own on public.disciplinas_status for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'disciplinas_status' and policyname = 'disciplinas_status_update_own'
  ) then
    create policy disciplinas_status_update_own on public.disciplinas_status for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'disciplinas_status' and policyname = 'disciplinas_status_delete_own'
  ) then
    create policy disciplinas_status_delete_own on public.disciplinas_status for delete using (auth.uid() = user_id);
  end if;
end
$$;

create or replace function public.get_public_portfolio_share(p_share_slug text)
returns table (
  share_slug text,
  share_title text,
  share_description text,
  item_id uuid,
  item_tipo text,
  item_titulo text,
  item_url text,
  item_created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ps.share_slug,
    ps.title as share_title,
    ps.description as share_description,
    pr.id as item_id,
    pr.tipo as item_tipo,
    pr.titulo as item_titulo,
    pr.url as item_url,
    pr.created_at as item_created_at
  from public.portfolio_shares ps
  left join public.portfolio_real pr
    on pr.user_id = ps.user_id
   and pr.subject_slug = ps.subject_slug
  where ps.share_slug = p_share_slug
    and ps.is_public = true
  order by pr.created_at desc nulls last
$$;

grant execute on function public.get_public_portfolio_share(text) to anon, authenticated;
