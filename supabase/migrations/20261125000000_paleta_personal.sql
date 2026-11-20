-- Paleta armada a mano desde el panel: tema 'personal' + 4 colores base en hexadecimal.
-- El resto de los tonos (claros, textos, líneas, sobre) se derivan de estos en el navegador.
alter table public.eventos drop constraint if exists eventos_tema_check;
alter table public.eventos add constraint eventos_tema_check check (tema in ('neutro', 'clasico', 'personal'));

alter table public.eventos add column if not exists colores jsonb
  check (
    colores is null or (
      jsonb_typeof(colores) = 'object'
      and coalesce(colores->>'nina', '') ~* '^#[0-9a-f]{6}$'
      and coalesce(colores->>'nino', '') ~* '^#[0-9a-f]{6}$'
      and coalesce(colores->>'tinta', '') ~* '^#[0-9a-f]{6}$'
      and coalesce(colores->>'papel', '') ~* '^#[0-9a-f]{6}$'
    )
  );

grant update (colores) on public.eventos to authenticated;
