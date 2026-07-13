-- Lets a self-registering member declare, right at signup, which liturgical roles they can serve
-- in and which weekly Mass slots they're available for — mirroring what a coordinator could
-- already set by hand via "Cadastrar Membro", but for the self-service join-code flow.
-- Mass schedule convention: Mon-Fri only has a night Mass; Sat/Sun have both morning and night.

create table public.member_availability (
  member_id uuid not null references public.members(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Domingo ... 6 = Sábado
  period text not null check (period in ('Manha', 'Noite')),
  primary key (member_id, day_of_week, period),
  constraint member_availability_mass_exists check (
    day_of_week in (0, 6) or period = 'Noite'
  )
);

create index member_availability_member_id_idx on public.member_availability (member_id);

alter table public.member_availability enable row level security;

create policy "CRUD de disponibilidade por paróquia" on public.member_availability
  for all to authenticated
  using (exists (
    select 1 from public.members m
    where m.id = member_availability.member_id and m.parish_id = public.current_parish_id()
  ))
  with check (exists (
    select 1 from public.members m
    where m.id = member_availability.member_id and m.parish_id = public.current_parish_id()
  ));

-- Public lookup so the (unauthenticated) self-registration form can list the paróquia's roles
-- for a given join code, without exposing anything else about the paróquia.
create or replace function public.roles_for_join_code(p_join_code text)
returns table (id uuid, name text, description text, icon_name text, color text)
language sql
security definer
stable
set search_path = public
as $$
  select r.id, r.name, r.description, r.icon_name, r.color
  from public.roles r
  join public.parishes p on p.id = r.parish_id
  where p.join_code = upper(p_join_code)
  order by r.name;
$$;

grant execute on function public.roles_for_join_code(text) to anon, authenticated;

-- Extend the join-code signup branch to also record the roles/availability the member picked
-- during registration. Only applies to a brand-new pending row — an auto-linked row that matched
-- a coordinator-created member keeps whatever the coordinator already configured for it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_parish_id uuid;
  target_parish_id uuid;
  linked_member_id uuid;
  new_member_id uuid;
begin
  if new.raw_user_meta_data ? 'parish_name' then
    insert into public.parishes (name, created_by, join_code)
    values (
      coalesce(new.raw_user_meta_data ->> 'parish_name', 'Minha Paróquia'),
      new.id,
      public.generate_join_code()
    )
    returning id into new_parish_id;

    insert into public.profiles (id, parish_id, name, email)
    values (new.id, new_parish_id, coalesce(new.raw_user_meta_data ->> 'name', new.email), new.email);

    insert into public.roles (parish_id, name, description, icon_name, color) values
      (new_parish_id, 'Comentários', 'Guia a assembleia durante a celebração', 'Mic', 'bg-blue-500'),
      (new_parish_id, 'Leitor', 'Proclama as leituras (1ª e 2ª)', 'BookOpen', 'bg-indigo-500'),
      (new_parish_id, 'Preces', 'Lê as intenções da comunidade', 'HeartHandshake', 'bg-rose-500'),
      (new_parish_id, 'Salmos', 'Canta ou recita o Salmo Responsorial', 'Music', 'bg-emerald-500');
  elsif new.raw_user_meta_data ? 'join_code' then
    select id into target_parish_id
    from public.parishes
    where join_code = upper(new.raw_user_meta_data ->> 'join_code');

    if target_parish_id is null then
      raise exception 'invalid_join_code';
    end if;

    update public.members
    set user_id = new.id
    where parish_id = target_parish_id
      and lower(email) = lower(new.email)
      and user_id is null
    returning id into linked_member_id;

    if linked_member_id is null then
      insert into public.members (parish_id, user_id, name, phone, email, approval_status)
      values (
        target_parish_id,
        new.id,
        coalesce(new.raw_user_meta_data ->> 'name', new.email),
        coalesce(new.raw_user_meta_data ->> 'phone', ''),
        new.email,
        'Pendente'
      )
      returning id into new_member_id;

      insert into public.member_roles (member_id, role_id)
      select new_member_id, role_id_text::uuid
      from jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'role_ids', '[]'::jsonb)) as role_id_text
      where role_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and exists (
          select 1 from public.roles r where r.id = role_id_text::uuid and r.parish_id = target_parish_id
        )
      on conflict do nothing;

      insert into public.member_availability (member_id, day_of_week, period)
      select new_member_id, (elem ->> 'day')::smallint, elem ->> 'period'
      from jsonb_array_elements(coalesce(new.raw_user_meta_data -> 'availability', '[]'::jsonb)) as elem
      where (elem ->> 'day') ~ '^[0-6]$'
        and elem ->> 'period' in ('Manha', 'Noite')
        and ((elem ->> 'day')::smallint in (0, 6) or elem ->> 'period' = 'Noite')
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;
