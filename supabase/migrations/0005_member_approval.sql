-- Lets a member self-register without already existing in the coordinator's roster.
-- Each paróquia gets a join_code the coordinator shares; a member signs up with that code and
-- lands as approval_status = 'Pendente' until the coordinator approves/rejects them. If the
-- email happens to match a roster row the coordinator already created by hand, we link straight
-- to it instead (already vetted, no approval needed) rather than creating a duplicate.

alter table public.parishes add column join_code text;

alter table public.members
  add column approval_status text not null default 'Aprovado'
    check (approval_status in ('Pendente', 'Aprovado', 'Rejeitado'));

create or replace function public.generate_join_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))
$$;

-- Backfill existing paróquias with a code, then lock the column down.
update public.parishes set join_code = public.generate_join_code() where join_code is null;
alter table public.parishes alter column join_code set not null;
create unique index parishes_join_code_unique_idx on public.parishes (join_code);

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
      );
    end if;
  end if;

  return new;
end;
$$;

-- Only counts a member as belonging to their paróquia (for read access to roles/schedules/other
-- members) once approved — a pending/rejected signup shouldn't see the roster or schedules yet.
create or replace function public.member_parish_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select parish_id from public.members where user_id = auth.uid() and approval_status = 'Aprovado'
$$;

create or replace function public.current_member_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.members where user_id = auth.uid() and approval_status = 'Aprovado'
$$;

-- A member must always be able to see their own row (to know they're pending/rejected) even
-- though member_parish_id() above withholds broader paróquia access until approved.
create policy "Membros veem o próprio cadastro" on public.members
  for select to authenticated using (user_id = auth.uid());

-- Same idea for the paróquia's own name/diocese, so a pending member can be told which paróquia
-- they're waiting on.
create policy "Membros veem o nome da própria paróquia mesmo pendente" on public.parishes
  for select to authenticated using (
    id in (select parish_id from public.members where user_id = auth.uid())
  );
