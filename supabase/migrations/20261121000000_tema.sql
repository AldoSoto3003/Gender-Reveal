-- Tema de colores de la invitación, elegido por los papás desde el panel.
--   neutro  = miel (niña) y salvia (niño)
--   clasico = rosa (niña) y azul (niño)
alter table public.eventos
  add column if not exists tema text not null default 'neutro'
  check (tema in ('neutro', 'clasico'));

grant update (tema) on public.eventos to authenticated;
