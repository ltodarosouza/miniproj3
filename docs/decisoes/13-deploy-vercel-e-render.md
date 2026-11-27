# 13. Deploy: front na Vercel, back no Render com SQLite

- **Contexto:** o bônus de deploy pede uma URL pública que a banca usa. O
  backend é FastAPI com SQLite e guarda o índice de matches em memória.
- **Opções:** tudo na Vercel com o backend em funções serverless e um
  Postgres externo (Supabase); front na Vercel e back no Render.
- **Escolha:** front na Vercel e back no Render (guia 08). Na Vercel rodariam
  várias cópias do backend, cada uma com seu índice de matches em memória, e
  elas se desencontrariam; trocar SQLite por Postgres também sairia da stack
  do projeto.
- **O que aceitamos:** no Render free o disco zera a cada deploy ou
  reinício, e o serviço dorme sem tráfego. O banco volta populado pelo seed
  no boot, e um pinger externo chama `GET /saude` a cada 10 minutos para o
  serviço não dormir na semana da banca. Contas criadas na URL somem no
  próximo deploy. (Resolvido na decisão 15: banco no Neon.)
- **Como ficou:**
  - Render: `SEED_ON_BOOT=true` roda o seed fake no boot quando o banco está
    vazio, antes de montar o índice de matches; `CORS_ORIGINS` recebe a URL
    da Vercel (várias separadas por vírgula). Nunca `DEBUG`.
  - Vercel: Root Directory `frontend` e `NEXT_PUBLIC_API_URL` com a URL do
    Render.
  - `GET /saude` responde `{"ok": true}` sem login e sem tocar no banco.
