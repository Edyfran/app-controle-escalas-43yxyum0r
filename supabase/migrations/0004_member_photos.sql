-- Storage bucket for member profile photos, uploaded by the coordinator via Membros.
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

-- Objects are stored as `{parish_id}/{random}.{ext}`; only the coordinator of that paróquia may
-- upload/replace/delete their own folder. The bucket is public, so reads are served directly by
-- the storage CDN without going through RLS — no read policy needed.
create policy "Coordenadores gerenciam fotos de membros da própria paróquia"
on storage.objects for all
to authenticated
using (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] = public.current_parish_id()::text
)
with check (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] = public.current_parish_id()::text
);
