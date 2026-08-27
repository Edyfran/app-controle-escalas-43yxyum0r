-- The app is now exclusive to a single paróquia — no more "create a new paróquia" signup flow.
-- Renames the existing (only) paróquia to its full official name, enforces at the DB level that
-- there can never be more than one row in `parishes`, and changes the coordinator signup branch of
-- handle_new_user() to attach the new coordinator to the existing paróquia instead of creating one.
-- (A fresh install with zero parishes still bootstraps one, so this keeps working in dev/test too.)

update public.parishes set name = 'Santuário Bom Jesus Eucarístico Aparecido de Sousa';

-- Unique index on a constant expression: since every row has the same expression value, Postgres
-- can never allow a second row to be inserted.
create unique index parishes_singleton_idx on public.parishes ((true));

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
    select id into new_parish_id from public.parishes order by created_at limit 1;

    if new_parish_id is null then
      insert into public.parishes (name, created_by, join_code)
      values (
        coalesce(new.raw_user_meta_data ->> 'parish_name', 'Minha Paróquia'),
        new.id,
        public.generate_join_code()
      )
      returning id into new_parish_id;

      insert into public.roles (parish_id, name, description, icon_name, color) values
        (new_parish_id, 'Comentários', 'Guia a assembleia durante a celebração', 'Mic', 'bg-blue-500'),
        (new_parish_id, 'Leitor', 'Proclama as leituras (1ª e 2ª)', 'BookOpen', 'bg-indigo-500'),
        (new_parish_id, 'Preces', 'Lê as intenções da comunidade', 'HeartHandshake', 'bg-rose-500'),
        (new_parish_id, 'Salmos', 'Canta ou recita o Salmo Responsorial', 'Music', 'bg-emerald-500');
    end if;

    insert into public.profiles (id, parish_id, name, email)
    values (new.id, new_parish_id, coalesce(new.raw_user_meta_data ->> 'name', new.email), new.email);
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
