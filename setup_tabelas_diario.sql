-- Tabela do "pensamento do dia" (Ele / Ela)
create table if not exists pensamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  ele text default '',
  ela text default '',
  atualizado_em timestamptz default now()
);

alter table pensamentos enable row level security;

drop policy if exists "authenticated full access pensamentos" on pensamentos;
create policy "authenticated full access pensamentos"
on pensamentos for all
to authenticated
using (true)
with check (true);

-- Colunas de "lido" (botão sol/lua que confirma que a mensagem foi vista)
alter table pensamentos add column if not exists lido_ele boolean default false;
alter table pensamentos add column if not exists lido_ela boolean default false;

-- Colunas de "postado" (botão que trava edição pelo resto do dia)
alter table pensamentos add column if not exists postado_ele boolean default false;
alter table pensamentos add column if not exists postado_ela boolean default false;

-- Tabela da foto do casal (coração na tela Início)
create table if not exists foto_destaque (
  id int primary key default 1 check (id = 1),
  url text,
  midia_id uuid,
  atualizado_em timestamptz default now()
);

-- Posição do enquadramento dentro do coração (0-100%, padrão 50/50 = centro)
alter table foto_destaque add column if not exists pos_x numeric default 50;
alter table foto_destaque add column if not exists pos_y numeric default 50;

alter table foto_destaque enable row level security;

drop policy if exists "authenticated full access foto_destaque" on foto_destaque;
create policy "authenticated full access foto_destaque"
on foto_destaque for all
to authenticated
using (true)
with check (true);

-- Tabela de indicações de filmes/séries (Ele / Ela)
create table if not exists indicacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  quem text not null check (quem in ('ele', 'ela')),
  assistido boolean default false,
  prioridade boolean default false,
  criado_em timestamptz default now()
);

alter table indicacoes add column if not exists prioridade boolean default false;

-- Comentário sobre o filme/série depois de assistido
alter table indicacoes add column if not exists comentario text;

-- Nota de 0 a 10 depois de assistido
alter table indicacoes add column if not exists nota integer check (nota >= 0 and nota <= 10);

alter table indicacoes enable row level security;

drop policy if exists "authenticated full access indicacoes" on indicacoes;
create policy "authenticated full access indicacoes"
on indicacoes for all
to authenticated
using (true)
with check (true);

-- Tabela das músicas favoritas (player na tela Início)
create table if not exists musicas (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  titulo text,
  artista text,
  thumb text,
  criado_em timestamptz default now()
);

alter table musicas enable row level security;

drop policy if exists "authenticated full access musicas" on musicas;
create policy "authenticated full access musicas"
on musicas for all
to authenticated
using (true)
with check (true);

-- Letra, tradução e link de crédito (via Vagalume)
alter table musicas add column if not exists letra text;
alter table musicas add column if not exists traducao text;
alter table musicas add column if not exists vagalume_url text;

-- Música do dia (destaque manual, uma por vez)
alter table musicas add column if not exists do_dia boolean default false;

-- Marca se a letra/tradução foi escrita manualmente (em vez de buscada automaticamente)
alter table musicas add column if not exists letra_manual boolean default false;

-- Legenda e data do momento nas fotos/vídeos da galeria
alter table midias add column if not exists legenda text;
alter table midias add column if not exists data_evento date;

-- Legenda separada por pessoa (J e R)
alter table midias add column if not exists legenda_j text;
alter table midias add column if not exists legenda_r text;

-- Capa gerada automaticamente pra vídeos (thumbnail)
alter table midias add column if not exists thumb_url text;

-- Marca se já tentamos gerar a capa (mesmo se falhou), pra não tentar de novo toda hora
alter table midias add column if not exists thumb_tentado boolean default false;

-- Guarda a "memória do dia" (Relembrando) pra não trocar toda vez que abrir o app
create table if not exists relembranca_dia (
  dia date primary key,
  tipo text not null check (tipo in ('pensamento', 'texto', 'foto')),
  conteudo text,
  foto_url text,
  origem_data date,
  exato boolean default false,
  criado_em timestamptz default now()
);

-- Referência ao texto original (pra abrir o texto certo ao tocar em "Relembrando")
alter table relembranca_dia add column if not exists ref_id uuid;

alter table relembranca_dia enable row level security;

drop policy if exists "authenticated full access relembranca_dia" on relembranca_dia;
create policy "authenticated full access relembranca_dia"
on relembranca_dia for all
to authenticated
using (true)
with check (true);

-- Favorito nos Desejos (arrastar o item pra marcar/desmarcar)
alter table desejos add column if not exists favorito boolean default false;
