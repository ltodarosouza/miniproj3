# Colmatch

Colmatch é uma rede para iniciantes em tecnologia — universitários, pessoas em bootcamps e quem está migrando de área — compartilharem o que sabem e aprenderem em conjunto. A plataforma aproxima quem pode ensinar e destaca matches para trocas recíprocas de habilidades. As pessoas conversam, combinam uma troca e podem avaliá-la depois.

## Deploy

- **Frontend:** [miniproj3.vercel.app](https://miniproj3.vercel.app), hospedado na Vercel.
- **Backend:** hospedado no Render, com banco PostgreSQL no Neon.

## O que dá para fazer

- Criar conta, entrar e montar um perfil com habilidades que sabe e quer aprender.
- Registrar rotina de estudos em posts com foto, curtir e comentar.
- Seguir pessoas e acompanhar o feed/Diário.
- Explorar matches em dois níveis: pessoas que podem ensinar e matches de troca recíproca em [`/matches`](frontend/app/matches/page.tsx).
- Conversar, propor e agendar uma troca, e avaliar depois que ela acontecer.
- Receber notificações e acompanhar streak de estudos.
- Buscar habilidades no catálogo com autocomplete e mapeamento opcional por IA.

As páginas principais incluem [`/cadastro`](frontend/app/cadastro/page.tsx), [`/login`](frontend/app/login/page.tsx), [`/feed`](frontend/app/feed/page.tsx), [`/mensagens`](frontend/app/mensagens/page.tsx), [`/notificacoes`](frontend/app/notificacoes/page.tsx) e perfis em [`/perfil/[username]`](frontend/app/perfil/[username]/page.tsx).

## Como rodar localmente

### Requisitos

- Python 3.12 (versão indicada em [`backend/.python-version`](backend/.python-version)).
- Node.js 22 (versão indicada em [`frontend/.nvmrc`](frontend/.nvmrc)).
- [uv](https://docs.astral.sh/uv/) e npm.

### Instalar dependências

```bash
(cd backend && uv sync)
(cd frontend && npm install && cp .env.local.example .env.local)
```

Configure as variáveis conforme [`backend/.env.example`](backend/.env.example) e [`frontend/.env.local.example`](frontend/.env.local.example). Para desenvolvimento, `NEXT_PUBLIC_API_URL` aponta para `http://localhost:8000`. `DATABASE_URL` pode ficar sem valor para usar SQLite local. `IA_PROVIDER`, `IA_API_KEY` e `IA_MODEL` configuram o mapeamento opcional de habilidades; sem chave, o sistema usa o fallback local com `difflib`.

### Preparar e iniciar

Na raiz do repositório:

```bash
make check
make seed
```

Inicie backend e frontend em terminais separados:

```bash
make dev-back
```

A API fica em `http://localhost:8000` e a documentação interativa em `http://localhost:8000/docs`.

```bash
make dev-front
```

O site fica em `http://localhost:3000`.

### Conta de demonstração

`make seed` cria 32 usuários e 56 posts (metade com foto: na ordem cronológica de todos os posts do seed, um sem foto e um com foto se alternam; o feed de cada pessoa mostra só os próprios posts e os de quem ela segue, de quem pode ensinar e de quem estuda as mesmas habilidades, então ali a proporção fica perto de metade, sem alternância garantida), além de conexões e trocas. As contas `ada` e `linus` formam o primeiro par de troca recíproca garantido pelo seed. A senha de todas as contas de demonstração é `senha-forte-123` (constante `SENHA_SEED` em [`backend/scripts/seed.py`](backend/scripts/seed.py)). O seed não insere dados se o banco já tiver usuários.

### Refazer os posts no deploy

Sem `--aplicar`, o script só mostra o plano e não cria arquivo. Com `--aplicar`, ele grava o backup JSON (`backup-posts-AAAAMMDD-HHMMSS.json` na pasta atual, ou o caminho de `--backup`) antes de apagar qualquer coisa e se recusa a sobrescrever um backup que já existe; depois de aplicar, copie esse arquivo para um lugar seguro, junto com o `.novos.json` que nasce ao lado dele, porque os dois são o único jeito de usar `--restaurar`. No diretório `backend`:

```bash
DATABASE_URL='<url do Neon>' uv run python scripts/refazer_posts.py
DATABASE_URL='<url do Neon>' uv run python scripts/refazer_posts.py --aplicar
DATABASE_URL='<url do Neon>' uv run python scripts/refazer_posts.py --restaurar backup-posts-AAAAMMDD-HHMMSS.json --aplicar
```

Da raiz, também é possível aplicar com `make refazer-posts args="--aplicar"`. `--listar-reais` mostra os posts de usuários reais e `--posts-reais 12,15` apaga também os posts reais escolhidos (entram no backup). Detalhes na [decisão 41](docs/decisoes/41-feed-com-mais-imagem.md).

## Verificação

Na raiz do projeto, execute:

```bash
make test
```

A suíte inteira deve passar, sem testes ignorados. Para verificar o TypeScript e gerar o build do frontend:

```bash
(cd frontend && npx tsc --noEmit -p tsconfig.json)
(cd frontend && npm run build)
```

O comando `make bench` mede o índice de matches usando o script de benchmark do backend.

## Organização do código

### Backend

- `backend/app/routers/`: endpoints HTTP; as rotas delegam regras aos serviços.
- `backend/app/services/`: regras de negócio, como follows, matches, posts e trocas.
- `backend/app/core/`: estruturas e lógica em Python puro: `catalogo.py` (trie do catálogo), `matches.py` (índice de matches), `contadores.py`, `limite.py`, `streak.py` e `tempo.py`.
- `backend/app/models/`: modelos persistidos no banco.
- `backend/app/schemas/`: contratos de entrada e saída da API.
- `backend/migrations/`: migrações Alembic.
- `backend/tests/`: testes do backend.

### Frontend

- `frontend/app/`: páginas e rotas do Next.js.
- `frontend/components/`: componentes de funcionalidades, organizados por área.
- `frontend/components/ui/`: componentes reutilizáveis de interface e navegação.
- `frontend/lib/`: cliente da API, sessão e contratos usados pelas telas.

Por exemplo, o fluxo de follow passa por [`model`](backend/app/models/follow.py) → [`schema`](backend/app/schemas/follow.py) → [`service`](backend/app/services/follows.py) → [`router`](backend/app/routers/follows.py) → botão usado no perfil em [`BotaoSeguir`](frontend/components/ui/BotaoSeguir.tsx).

## Documentação

| Documento | Conteúdo |
|---|---|
| [DECISIONS.md](DECISIONS.md) | Produto, decisões, escolhas técnicas e uso de IA. |
| [`docs/decisoes/`](docs/decisoes/) | Registros de decisões complementares. |
| [docs/AVALIACAO.md](docs/AVALIACAO.md) | Roteiro de avaliação para a banca. |
| [DESIGN.md](DESIGN.md) | Diretrizes visuais e componentes de interface. |
| [RUBRICA.md](RUBRICA.md) | Critérios de avaliação do projeto. |
| [CATALOGO.md](CATALOGO.md) | Catálogo de ideias e funcionalidades. |
| [CONTRATO.md](CONTRATO.md) | Rotas, campos e estados combinados. |
| [`docs/guias/`](docs/guias/) | Guias de setup, autenticação, equipe e deploy. |

## Time

| Frente | Responsável | Escopo |
|---|---|---|
| A | @italoosilva | Autenticação, perfil, habilidades, catálogo, autocomplete e IA. |
| B | @NicoleAlverga | Posts de rotina, fotos, curtidas, comentários, feed e streak. |
| C | @gecbeltrao | Follow, matches em dois níveis e seed de demonstração. |
| D | @ltodarosouza | Chat, agendamento e avaliação das trocas, notificações e deploy. |

Mais detalhes sobre a divisão estão em [`docs/FRENTES.md`](docs/FRENTES.md).

## Prazos

| Marco | Data |
|---|---|
| Início | segunda, 16/11/2026 |
| Entrega final | sexta, 27/11/2026 |
