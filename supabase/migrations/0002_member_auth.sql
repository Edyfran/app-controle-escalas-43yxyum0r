-- Real authentication for members (liturgical volunteers), separate from coordinator accounts.
-- Members self-register with email/password; a trigger links them to the roster row the
-- coordinator already created (matched by email). Members get read-only access to their
-- paróquia's roles/members/schedules, plus two RPCs to confirm/decline their own assignments.

alter table public.members
  add column email text,
  add column user_id uuid unique references auth.users(id) on delete set null;

create unique index members_email_unique_idx on public.members (lower(email)) where email is not null;

alter table public.schedule_assignments
  add column confirmation_status text not null default 'Pendente'
    check (confirmation_status in ('Pendente', 'Confirmado', 'Recusado'));

alter table public.schedules
  add column leitor1_status text not null default 'Pendente'
    check (leitor1_status in ('Pendente', 'Confirmado', 'Recusado')),
  add column leitor2_status text not null default 'Pendente'
    check (leitor2_status in ('Pendente', 'Confirmado', 'Recusado'));

-- Coordinator signups carry `parish_name` in raw_user_meta_data (see Register.tsx) and provision a
-- brand new paróquia. Member signups carry no `parish_name` — they only link to an existing roster
-- row whose email (set by the coordinator) matches the new auth user's email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_parish_id uuid;
begin
  if new.raw_user_meta_data ? 'parish_name' then
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
  else
    update public.members
    set user_id = new.id
    where lower(email) = lower(new.email) and user_id is null;
  end if;

  return new;
end;
$$;

-- Resolves the paróquia and roster row of the currently authenticated member (null for coordinators).
create function public.member_parish_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select parish_id from public.members where user_id = auth.uid()
$$;

create function public.current_member_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.members where user_id = auth.uid()
$$;

-- Lets a member confirm/decline their own row in schedule_assignments, nothing else.
create function public.confirm_assignment(p_assignment_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('Pendente', 'Confirmado', 'Recusado') then
    raise exception 'invalid status';
  end if;

  update public.schedule_assignments
  set confirmation_status = p_status
  where id = p_assignment_id
    and member_id = public.current_member_id();

  if not found then
    raise exception 'assignment not found or not yours';
  end if;
end;
$$;

-- Lets a member confirm/decline their own leitor1/leitor2 slot on a schedule.
create function public.confirm_leitor(p_schedule_id uuid, p_slot text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('Pendente', 'Confirmado', 'Recusado') then
    raise exception 'invalid status';
  end if;

  if p_slot = 'leitor1' then
    update public.schedules
    set leitor1_status = p_status
    where id = p_schedule_id and leitor1 = public.current_member_id();
  elsif p_slot = 'leitor2' then
    update public.schedules
    set leitor2_status = p_status
    where id = p_schedule_id and leitor2 = public.current_member_id();
  else
    raise exception 'invalid slot';
  end if;

  if not found then
    raise exception 'schedule not found or not yours';
  end if;
end;
$$;

grant execute on function public.confirm_assignment(uuid, text) to authenticated;
grant execute on function public.confirm_leitor(uuid, text, text) to authenticated;

create policy "Membros veem a própria paróquia" on public.parishes
  for select to authenticated using (id = public.member_parish_id());

create policy "Membros veem funções da própria paróquia" on public.roles
  for select to authenticated using (parish_id = public.member_parish_id());

create policy "Membros veem outros membros da própria paróquia" on public.members
  for select to authenticated using (parish_id = public.member_parish_id());

create policy "Membros veem escalas da própria paróquia" on public.schedules
  for select to authenticated using (parish_id = public.member_parish_id());

create policy "Membros veem designações da própria paróquia" on public.schedule_assignments
  for select to authenticated using (
    exists (
      select 1 from public.schedules s
      where s.id = schedule_assignments.schedule_id and s.parish_id = public.member_parish_id()
    )
  );
