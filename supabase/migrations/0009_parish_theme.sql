-- Expands branding customization from a single primary color into a full color theme (background,
-- card, primary, secondary, muted, accent, border), stored as one jsonb blob instead of loose
-- columns. Foreground/contrast colors are derived client-side, not stored, so this only needs the
-- "base" colors a coordinator actually picks.

alter table public.parishes add column theme jsonb;

-- Carry over whatever primary color was already set into the new shape.
update public.parishes
set theme = jsonb_build_object('primary', primary_color)
where primary_color is not null;

alter table public.parishes drop column primary_color;
