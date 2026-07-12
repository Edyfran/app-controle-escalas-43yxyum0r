-- LiturgiaSync backend schema: multi-tenant (per paróquia) with row-level security.

create table public.parishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  parish_id uuid not null references public.parishes(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid not null references public.parishes(id) on delete cascade,
  name text not null,
  description text not null default '',
  icon_name text not null default 'Mic',
  color text not null default 'bg-blue-500',
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid not null references public.parishes(id) on delete cascade,
  name text not null,
  phone text not null default '',
  avatar_url text not null default '',
  availability text not null default 'Semanal' check (availability in ('Semanal', 'Quinzenal', 'Mensal')),
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.member_roles (
  member_id uuid not null references public.members(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (member_id, role_id)
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid not null references public.parishes(id) on delete cascade,
  title text not null,
  date timestamptz not null,
  time text not null,
  theme text,
  status text not null default 'Rascunho' check (status in ('Confirmada', 'Pendente', 'Rascunho')),
  leitor1 uuid references public.members(id) on delete set null,
  leitor2 uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.schedule_assignments (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null
);

create index roles_parish_id_idx on public.roles (parish_id);
create index members_parish_id_idx on public.members (parish_id);
create index schedules_parish_id_idx on public.schedules (parish_id);
create index schedule_assignments_schedule_id_idx on public.schedule_assignments (schedule_id);
create index member_roles_role_id_idx on public.member_roles (role_id);

-- Returns the parish_id of the currently authenticated user; used by every RLS policy below.
create function public.current_parish_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select parish_id from public.profiles where id = auth.uid()
$$;

-- New coordinators arrive from auth.users with parish_name/name in raw_user_meta_data (see Register.tsx);
-- this provisions their paróquia, profile, and a starter set of liturgical roles in one shot.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_parish_id uuid;
begin
  insert into public.parishes (name, created_by)
  values (coalesce(new.raw_user_meta_data ->> 'parish_name', 'Minha Paróquia'), new.id)
  returning id into new_parish_id;

  insert into public.profiles (id, parish_id, name, email)
  values (new.id, new_parish_id, coalesce(new.raw_user_meta_data ->> 'name', new.email), new.email);

  insert into public.roles (parish_id, name, description, icon_name, color) values
    (new_parish_id, 'Comentários', 'Guia a assembleia durante a celebração', 'Mic', 'bg-blue-500'),
    (new_parish_id, 'Leitor', 'Proclama as leituras (1ª e 2ª)', 'BookOpen', 'bg-indigo-500'),
    (new_parish_id, 'Preces', 'Lê as intenções da comunidade', 'HeartHandshake', 'bg-rose-500'),
    (new_parish_id, 'Salmos', 'Canta ou recita o Salmo Responsorial', 'Music', 'bg-emerald-500');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.parishes enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.members enable row level security;
alter table public.member_roles enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_assignments enable row level security;

create policy "Coordenadores veem a própria paróquia" on public.parishes
  for select to authenticated using (id = public.current_parish_id());
create policy "Coordenadores atualizam a própria paróquia" on public.parishes
  for update to authenticated using (id = public.current_parish_id());

create policy "Coordenadores veem perfis da própria paróquia" on public.profiles
  for select to authenticated using (parish_id = public.current_parish_id());
create policy "Usuário atualiza o próprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid());

create policy "CRUD de funções por paróquia" on public.roles
  for all to authenticated
  using (parish_id = public.current_parish_id())
  with check (parish_id = public.current_parish_id());

create policy "CRUD de membros por paróquia" on public.members
  for all to authenticated
  using (parish_id = public.current_parish_id())
  with check (parish_id = public.current_parish_id());

create policy "CRUD de vínculos membro-função por paróquia" on public.member_roles
  for all to authenticated
  using (exists (select 1 from public.members m where m.id = member_roles.member_id and m.parish_id = public.current_parish_id()))
  with check (exists (select 1 from public.members m where m.id = member_roles.member_id and m.parish_id = public.current_parish_id()));

create policy "CRUD de escalas por paróquia" on public.schedules
  for all to authenticated
  using (parish_id = public.current_parish_id())
  with check (parish_id = public.current_parish_id());

create policy "CRUD de designações por paróquia" on public.schedule_assignments
  for all to authenticated
  using (exists (select 1 from public.schedules s where s.id = schedule_assignments.schedule_id and s.parish_id = public.current_parish_id()))
  with check (exists (select 1 from public.schedules s where s.id = schedule_assignments.schedule_id and s.parish_id = public.current_parish_id()));
