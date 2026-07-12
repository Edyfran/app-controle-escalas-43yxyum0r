-- Lets the coordinator edit the paróquia's name/diocese from Configurações (previously hardcoded).
alter table public.parishes add column diocese text;
