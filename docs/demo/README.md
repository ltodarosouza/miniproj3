# Demo em vídeo (46 s)

Uma demo curta do Colmatch em uso, sem som: um cursor percorre as telas reais do app e mostra as features
principais. A página `index.html` anima as capturas e o `render.py` transforma essa página em MP4.

## Roteiro

| Tempo | Cena | O que aparece |
|---|---|---|
| 0:00 | Abertura | Logo colmeia e "Troque conhecimento com quem estuda o mesmo que você." |
| 0:03 | Feed | Posts de rotina com foto; destaque no post da Julia. |
| 0:07 | Registrar estudo | A ada abre o formulário, preenche (CSS, 45 min, foto) e publica. |
| 0:14 | Sua semana | Zoom na coluna: horas da semana sobem para 4h05 e CSS passa a 1º em "Mais estudadas". |
| 0:18 | Matches | Ana Borges como troca recíproca e a lista "Pode te ensinar"; clique em Conversar. |
| 0:23 | Conversa | Mensagem enviada, perfil clicável da Ana e "Agendar troca" com dia e horário. |
| 0:32 | Google Agenda | A Ana confirma; o cartão mostra "Agendar no Google Agenda" e o clique abre o Google Agenda da pessoa com o evento já preenchido pelo link do app (título, dia, 19:00–20:00 e quem ensina o quê). Ao salvar, o Google adiciona a videoconferência do Meet; o painel avisa que isso vale para a conta com o Meet automático ativado (sem ele, a pessoa adiciona o Meet antes de salvar, como diz o cartão). O painel é uma reconstrução: os textos vêm do link real capturado, sem conta Google. |
| 0:37 | Avaliação | Na troca já feita com o Linus: 5 estrelas, recado e envio. |
| 0:41 | Notificações | Confirmação da troca, curtidas, comentários e seguidores. |
| 0:44 | Fechamento | "Aprenda junto." e o endereço do deploy. |

## Ver a animação

Abra `docs/demo/index.html` no navegador (funciona direto do disco). Espaço pausa; a barra de baixo
navega no tempo. Com `?render=1` a página mostra só o palco de 1920×1080, sem player.

## Gerar o MP4

Precisa de [uv](https://docs.astral.sh/uv/) e do Chromium do Playwright
(`uv run --with playwright==1.64.0 playwright install chromium` se ainda não tiver). O ffmpeg vem do
pacote `imageio-ffmpeg`; a variável `FFMPEG` permite usar outro.

```bash
uv run --with playwright==1.64.0 --with imageio-ffmpeg==0.6.0 python docs/demo/render.py --saida /caminho/colmatch-demo.mp4
```

Sai um MP4 H.264 1920×1080, 60 fps, CRF 18, yuv420p e faststart (~13 MB, ~4 min de render), além de
`colmatch-demo-previa.mp4` (960×540) e `colmatch-demo-previa.gif` na mesma pasta (`--sem-previa` desliga).
Para conferir sem renderizar tudo: `--quadros 5,20,35` salva PNGs e uma folha de contato
(acrescente `--with pillow==11.3.0`), e `--de 6 --ate 15` renderiza só um trecho. Esses vídeos não vão
para o git.

## Onde a demo aparece

A versão web (1280×720, 2,3 MB) e o poster ficam em `frontend/public/demo/` e são servidos pela Vercel:
a página inicial do app mostra o vídeo (no deploy, `/demo/colmatch-demo.mp4`), e a capa
`capa-readme.webp` do README abre [o arquivo no repositório](../../frontend/public/demo/colmatch-demo.mp4). O comando que gera a versão web a partir do MP4 grande está na
[decisão 45](../decisoes/45-demo-na-pagina-inicial.md).

## Refazer as capturas

As telas em `telas/` saem do app real com o seed. O `capturar.py` muda o banco (publica post, agenda
troca, avalia), então use um banco SQLite novo, só para isso:

```bash
# 1. banco novo com o seed e API na porta 8010
cd backend
export DATABASE_URL=sqlite:////tmp/colmatch-demo.db
uv run python scripts/seed.py
CORS_ORIGINS=http://localhost:3010 uv run uvicorn app.main:app --port 8010

# 2. em outro terminal: front em build de produção (sem o selo do modo dev) na porta 3010
cd frontend
NEXT_PUBLIC_API_URL=http://localhost:8010 npx next build
NEXT_PUBLIC_API_URL=http://localhost:8010 npx next start -p 3010

# 3. na raiz do repo
DEMO_DB=/tmp/colmatch-demo.db uv run --with playwright==1.64.0 --with pillow==11.3.0 python docs/demo/capturar.py
```

O script entra como `ada`, segue o roteiro e grava `telas/NN-id.webp` (3200×1800, viewport
1600×900 @2x, tema claro) e `telas/telas.json` + `telas/telas.js` com os retângulos dos elementos que o
cursor clica. A animação lê esses retângulos, então novas capturas continuam alinhadas. Duas preparações
usam o próprio app: a ada ganha "Estrutura de Dados" pela rota de editar habilidades (assim a Ana vira par
de troca) e a Ana confirma a troca pela API (como se clicasse em "Confirmar"), para o cartão mostrar o
botão do Google Agenda; o link real desse botão vai para `telas.json` e o painel do Google Agenda da demo
é montado a partir dele. A avaliação que a ada já tinha dado ao Linus é apagada do banco temporário, para
mostrar o estado logo depois da troca.

Rodar o script de novo pede um banco recém-semeado. As fotos do seed vêm do Unsplash e do randomuser,
então é preciso internet.
