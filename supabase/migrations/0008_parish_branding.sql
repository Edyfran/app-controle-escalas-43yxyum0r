-- Lets the coordinator customize the paróquia's branding: a logo image and a primary accent color
-- (stored as an "H S% L%" triplet, matching the CSS custom property format used by the theme).

alter table public.parishes add column logo_url text;
alter table public.parishes add column primary_color text;

insert into storage.buckets (id, name, public)
values ('parish-logos', 'parish-logos', true)
on conflict (id) do nothing;

-- Objects are stored as `{parish_id}/{random}.{ext}`; only the coordinator of that paróquia may
-- upload/replace/delete their own folder. The bucket is public, so reads are served directly by
-- the storage CDN without going through RLS — no read policy needed.
create policy "Coordenadores gerenciam o logo da própria paróquia"
on storage.objects for all
to authenticated
using (
  bucket_id = 'parish-logos'
  and (storage.foldername(name))[1] = public.current_parish_id()::text
)
with check (
  bucket_id = 'parish-logos'
  and (storage.foldername(name))[1] = public.current_parish_id()::text
);
