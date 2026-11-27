# Roteiro de avaliação

Este roteiro é para a banca reproduzir os critérios e para o time preparar a apresentação.
Consulte também a [rubrica completa](disciplina/RUBRICA.md), o [README do projeto](../README.md) e as
[decisões de produto e técnicas](../DECISIONS.md).

## Critérios e evidências

| Critério | Onde está no nosso projeto | Como conferir |
|---|---|---|
| Produto 1 — público e problema claros | [DECISIONS.md, Produto](../DECISIONS.md#produto) | Leia público, problema e exemplo de quem aprende sozinho. |
| Produto 2 — a rede resolve o problema | [DECISIONS.md, Produto](../DECISIONS.md#produto), [matches](../frontend/app/matches/page.tsx) | Veja habilidades que cada perfil oferece e procura; confira os dois níveis de match. |
| Produto 3 — nicho no conteúdo, seed e interface | [catálogo](../backend/app/services/habilidades.py), [seed](../backend/scripts/seed.py), [editor de post](../frontend/components/posts/FormNovoPost.tsx) | Confira habilidades de tecnologia e disciplinas, posts de rotina e rótulos de estudo. |
| Produto 4 — decisões, cortes e justificativas | [DECISIONS.md](../DECISIONS.md), [decisões complementares](decisoes/) | Leia contexto, opções, escolha e o que ficou de fora. |
| Vídeo, cerca de 4 min | [telas de cadastro e login](../frontend/app/cadastro/page.tsx), [feed](../frontend/app/feed/page.tsx), [perfil](../frontend/app/perfil/[username]/page.tsx), [matches](../frontend/app/matches/page.tsx) | Grave a sequência de produto descrita no roteiro abaixo, incluindo até duas features e uma decisão. |
| Pitch, 3 min + pergunta | [DECISIONS.md, Produto](../DECISIONS.md#produto), [decisão 1: match em dois níveis](../DECISIONS.md#1-match-em-dois-níveis) | Explique público, problema, solução e um corte; reserve tempo para uma pergunta. |
| Funcionamento — fluxo principal | [cadastro](../frontend/app/cadastro/page.tsx), [login](../frontend/app/login/page.tsx), [feed](../frontend/app/feed/page.tsx), [perfil](../frontend/app/perfil/[username]/page.tsx) | Reproduza cadastro → login → post → follow → feed, no deploy ou local. |
| Funcionamento — features escolhidas | [matches](../frontend/app/matches/page.tsx), [conversa](../frontend/app/mensagens/[username]/page.tsx), [avaliação](../frontend/components/avaliacoes/AvaliarTroca.tsx) | Use um par com habilidades compatíveis, abra a conversa e demonstre os estados realmente disponíveis. |
| Código 1 — sem duplicação | [services](../backend/app/services/), [componentes](../frontend/components/) | Compare comportamentos semelhantes e veja se a regra ou componente é reaproveitado. |
| Código 2 — nomes claros | [models](../backend/app/models/), [schemas](../backend/app/schemas/), [routers](../backend/app/routers/) | Siga nomes de domínio entre model, schema, endpoint e tela. |
| Código 3 — cada coisa no seu lugar | [routers](../backend/app/routers/), [services](../backend/app/services/), [core](../backend/app/core/) | Confira router fino, regra no service e estrutura de dados em `core/`. |
| Código 4 — sem sobra | [backend/app](../backend/app/), [frontend/app](../frontend/app/) | Procure código comentado, `print` de debug e funções sem chamada. |
| Código 5 — escolha técnica explicada | [DECISIONS.md, escolha técnica](../DECISIONS.md#uma-escolha-técnica), [match](../backend/app/core/matches.py), [benchmark](../backend/scripts/bench_matches.py) | Leia a justificativa do índice invertido; se desejarem medir, executem `make bench`. |
| Deploy público (+10) | [aplicação publicada](https://miniproj3.vercel.app), [guia de deploy](disciplina/guias/08-deploy.md) | Tente o fluxo principal na URL; o bônus depende de o deploy estar disponível para uso. |
| Destaque da turma (+2) | [DECISIONS.md](../DECISIONS.md) | Compare clareza do público, do escopo e das escolhas com os demais times. |

## Fluxo principal passo a passo

O deploy indicado é [miniproj3.vercel.app](https://miniproj3.vercel.app). O roteiro descreve
como conferir o fluxo; não pressupõe que ele tenha sido gravado ou testado previamente.

1. Abra `/cadastro` e crie a conta A. Preencha **Nome**, **Nome de usuário**, senha e
   confirmação; use **Criar conta**. O cadastro entra e segue para
   `/perfil/editar#habilidades`, onde pode informar o que sabe e quer aprender.
2. Para conferir o login, saia da sessão e abra `/login`. Preencha nome de usuário e senha e
   use **Entrar**; o destino é `/feed`.
3. No feed, clique em **O que você estudou hoje?** ou **Registrar estudo** para abrir o
   formulário. Preencha **O que você estudou hoje?**, selecione uma **Habilidade** e informe
   **Tempo estudado (min)**; publique com **Registrar estudo**.
4. Abra uma janela anônima, vá a `/cadastro` e crie a conta B. O cadastro já entra como B;
   siga nessa sessão (configurar habilidades é opcional).
5. Na sessão B, acesse `/perfil/<username-de-A>` ou encontre A pelo feed/busca. No perfil de A,
   use **Seguir**. O estado deve mudar para **Seguindo**.
6. Ainda como B, abra `/feed`. Localize o post de rotina de A e confira autor, texto e
   habilidade. Assim ficam percorridos cadastro, login, post, follow e feed.

Rotas correspondentes no frontend: [`/cadastro`](../frontend/app/cadastro/page.tsx),
[`/login`](../frontend/app/login/page.tsx), [`/feed`](../frontend/app/feed/page.tsx) e
[`/perfil/[username]`](../frontend/app/perfil/[username]/page.tsx). Os textos acima vêm dos
componentes de [cadastro](../frontend/app/cadastro/page.tsx),
[login](../frontend/app/login/page.tsx), [compositor do
feed](../frontend/components/feed/Composer.tsx), [formulário de
post](../frontend/components/posts/FormNovoPost.tsx) e [botão de
seguir](../frontend/components/ui/BotaoSeguir.tsx).

### Alternativa local com seed

Os comandos para rodar na máquina e as contas prontas (`ada`, `linus`, `grace`) estão no README:
[Como rodar localmente](../README.md#como-rodar-localmente) e
[Contas de demonstração](../README.md#contas-de-demonstração). O `make seed` só popula um banco
vazio.

## Features fortes para o vídeo

Escolha no máximo duas para mostrar com calma.

### Match em dois níveis

Abra `/matches` ([página](../frontend/app/matches/page.tsx)). A seção **Pares de troca**
destaca compatibilidade recíproca; **Pode te ensinar** encontra quem sabe algo que a pessoa
quer aprender. A decisão 1 explica o corte da troca recíproca como único resultado: numa rede
pequena, isso poderia deixar pessoas sem opções. O cálculo e o índice ficam em
[`core/matches.py`](../backend/app/core/matches.py) e no [service de
matches](../backend/app/services/matches.py).

### Troca: conversa, proposta de horário e avaliação

No perfil ou em Matches, abra uma conversa em `/mensagens/<username>`. O botão **Agendar
troca** abre a proposta: escolha o que cada pessoa ensina/aprende e um horário, então use
**Propor troca**. A outra pessoa pode **Confirmar** ou **Recusar**. Em troca confirmada, o
cartão oferece **Agendar no Google Agenda**; depois do horário, o selo de **Mensagens** avisa,
a conversa aparece com **Avaliar troca** na lista e o próprio cartão da troca traz as estrelas e
**Enviar avaliação**. Veja a [tela da conversa](../frontend/app/mensagens/[username]/page.tsx),
o [formulário](../frontend/components/trocas/FormAgendarTroca.tsx), o [cartão de
troca](../frontend/components/trocas/CartaoTroca.tsx), o [formulário de
avaliação](../frontend/components/avaliacoes/AvaliarTroca.tsx) e as decisões
[8](decisoes/08-troca-proposta-no-chat.md), [17](decisoes/17-do-match-a-troca.md), [28](decisoes/28-troca-so-avalia-o-que-aconteceu.md) e [39](decisoes/39-ranking-por-horas-respiro-e-avaliacao-na-conversa.md).

O seed cria conversas para os oito primeiros pares fixos; os cinco primeiros já têm troca
confirmada no passado com avaliação dos dois lados, e outro par fica com uma proposta pendente
([`_criar_conversas_e_trocas`](../backend/scripts/seed.py)). Para mostrar a avaliação ao
vivo sem esperar durante a gravação, prepare antes: proponha uma troca nova entre duas contas
para o horário mais próximo disponível e confirme antes que ele chegue (depois do horário a
confirmação é recusada, decisão 28). Quando o horário passar, o selo de **Mensagens** acende e o
cartão da troca na conversa mostra **Enviar avaliação** para as duas pessoas.

## Roteiro do vídeo (~4 min)

- **0:00–0:30 — Público e problema:** iniciantes em tecnologia estudam sozinhos, travam e
  podem trocar conhecimento com alguém.
- **0:30–1:30 — Fluxo base:** criar conta, entrar, registrar post de rotina, seguir uma pessoa
  e encontrar a publicação no feed.
- **1:30–2:20 — Feature 1:** mostrar Matches e explicar a diferença entre troca recíproca e
  “Pode te ensinar”.
- **2:20–3:10 — Feature 2 (se escolhida):** conversa, proposta, confirmação e ponto em que a
  avaliação fica disponível.
- **3:10–3:40 — Nicho na interface:** mostrar habilidades, post de estudo e exemplos do seed.
- **3:40–4:00 — Decisão:** resumir o que foi escolhido e o corte da troca recíproca pura.

### Demo curta (46 s)

Para abrir a apresentação ou mandar junto com o link, há uma demo sem som com as telas reais do app
(feed com fotos, registrar estudo, Sua semana e Mais estudadas, matches, conversa com agendamento,
troca confirmada levada ao Google Agenda, avaliação e notificações). Ela aparece na
[página inicial do deploy](https://miniproj3.vercel.app) e no topo do README, e o vídeo abre direto em
[miniproj3.vercel.app/demo/colmatch-demo.mp4](https://miniproj3.vercel.app/demo/colmatch-demo.mp4) (arquivo
`frontend/public/demo/colmatch-demo.mp4`).
Ela não substitui o vídeo de cerca de 4 minutos da rubrica, que mostra também cadastro, login e
follow. O [guia da demo](demo/README.md) explica como gerá-la de novo.

## Roteiro do pitch (3 min)

- **0:00–0:40:** público: iniciantes em tech, universitários, alunos de bootcamp e pessoas
  migrando de área; problema: aprender sem apoio e não ter a quem perguntar.
- **0:40–1:30:** solução: cada pessoa registra o que sabe e quer aprender; a rede mostra quem
  pode ensinar e destaca pares com troca recíproca.
- **1:30–2:20:** decisão a defender — **match em dois níveis**. A troca recíproca é ideal, mas
  como único resultado deixaria muita gente sem opções numa rede pequena; por isso há também
  “Pode te ensinar”.
- **2:20–3:00:** mostrar evidência no produto e fechar com o que ficou de fora: a troca recíproca como
  condição única, conforme a decisão 1.

### Perguntas prováveis

- **Por que não mostrar só trocas recíprocas?** Numa rede pequena, o requisito recíproco pode
  deixar a pessoa sem resultado. Mantivemos o destaque para a troca e acrescentamos a lista
  de quem pode ensinar.
- **Por que avaliar só depois de uma troca?** A nota deve refletir uma troca que aconteceu,
  não uma promessa ou popularidade de perfil; por isso a avaliação abre após o horário de
  uma troca confirmada ([decisão 8](decisoes/08-troca-proposta-no-chat.md) e [decisão 28](decisoes/28-troca-so-avalia-o-que-aconteceu.md)).
- **Por que o feed não é ranqueado por curtidas?** Para quem está aprendendo, importa
  descobrir quem estuda a habilidade; o feed cronológico inclui posts próprios, de quem
  segue e de pessoas relacionadas às habilidades ([decisão 5](../DECISIONS.md#5-feed-com-meus-posts-quem-eu-sigo-e-quem-pode-me-ensinar)).

## Nicho no seed e na interface

O nicho é a troca de habilidades entre iniciantes em tecnologia
([DECISIONS.md](../DECISIONS.md#produto)). O catálogo em
[`habilidades.py`](../backend/app/services/habilidades.py) mistura linguagens, ferramentas e
disciplinas como Python, React, Git, Cálculo 1 e Estrutura de Dados. O seed associa pares a
essas habilidades e gera bios sobre primeiro período, estudo diário e migração de área; os
posts falam de minutos estudados, revisão, exercícios e progresso
([`seed.py`](../backend/scripts/seed.py)). Na interface, confira os rótulos “O que você estudou
hoje?”, “Habilidade” e “Tempo estudado (min)” no [formulário de
post](../frontend/components/posts/FormNovoPost.tsx), além de **Sei** e **Quero aprender** no
[editor de habilidades](../frontend/app/perfil/editar/page.tsx).

## Nota final

`make test` orienta o time e ajuda a percorrer cenários; os testes não valem nota, conforme a
[rubrica](disciplina/RUBRICA.md#funcionamento-30). O destaque (+2) é comparativo entre os times e
considera qual `DECISIONS.md` explica melhor o público, o que ficou de fora e por quê.
