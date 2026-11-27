# Guia 08: deploy público (bônus +10)

A receita é uma só: backend no Render (free) e front na Vercel (free). A banca
confere o bônus abrindo a URL de vocês e fazendo cadastro → login →
post → follow → feed. Gravar o vídeo na URL pública é recomendado, mas não
obrigatório.

## Limites do free tier

1. O filesystem é efêmero. A cada deploy ou restart, o `app.db` (SQLite) e a
   pasta `uploads/` somem. Para uma demo isso basta, desde que o banco volte
   populado (passo 2).
2. Sem tráfego, o Render hiberna o serviço e a primeira request demora ~1
   minuto. Abram a URL uns minutos antes da conferência.
3. **Nunca liguem `DEBUG=true` em produção.** O bypass de auth vira porta
   aberta.

## Passo 1: backend no Render

1. [render.com](https://render.com) → New → Web Service → conectem o repo do time.
2. Configurem:
   - Root Directory: `backend`
   - Build Command: `pip install uv && uv sync --frozen`
   - Start Command: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free
3. Em Environment, adicionem `SEED_ON_BOOT=true`. Não adicionem `DEBUG`.

## Passo 2: banco populado no boot (`SEED_ON_BOOT`)

No lifespan do `main.py`, logo depois do `create_all`/rebuild:

```python
import os

if os.environ.get("SEED_ON_BOOT") == "true":
    from scripts.seed import main as rodar_seed  # ou seu seed_fake
    rodar_seed()
```

Como o filesystem zera a cada restart, a demo sempre começa com a rede
populada pelo seed fake.

## Passo 3: CORS com a URL pública

O `allow_origins` do `main.py` só tem `localhost:3000`. Adicionem o domínio
que a Vercel der. Dá para voltar aqui depois do passo 4.

```python
allow_origins=[
    "http://localhost:3000",
    "https://SEU-FRONT.vercel.app",
],
```

Façam o commit e o Render faz o redeploy sozinho.

## Passo 4: front na Vercel

1. [vercel.com](https://vercel.com) → Add New → Project → importem o repo.
2. Root Directory: `frontend`. A Vercel detecta o Next sozinha.
3. Em Environment Variables: `NEXT_PUBLIC_API_URL` = `https://SEU-BACK.onrender.com`.
4. Façam o deploy. Se ainda não puseram a URL final do front no CORS, voltem
   ao passo 3.

## Verificação

```bash
curl -s https://SEU-BACK.onrender.com/usuarios | head -c 120
# (a primeira pode demorar ~1 min por causa do cold start)
# → {"items":[...],"total":...}
```

Depois, na URL da Vercel, façam cadastro → login → post → follow → feed, o
mesmo fluxo do vídeo. Se funcionou aí, funciona na conferência.

## Depois da entrega: portfólio

O repo vira público depois da entrega. Com uns 15 minutos dá para transformar a
entrega em portfólio:

- [ ] README com o pitch do nicho (2 parágrafos), 2–3 screenshots e a URL pública no topo
- [ ] `RUBRICA.md`/`CATALOGO.md` movidos para `docs/`, porque são material da disciplina e não do produto
- [ ] `DECISIONS.md` mantido. Mostrar as decisões de produto e uma escolha
      técnica explicada (com números, se mediram algo) é o que conta num portfólio
- [ ] URL no ar (o free tier hiberna, mas volta sozinho)
