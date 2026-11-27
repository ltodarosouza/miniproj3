# Decisões do time

**Time:** @italoosilva (Pessoa A), @NicoleAlverga (Pessoa B), @gecbeltrao (Pessoa C) e @ltodarosouza (Pessoa D)

**Rede:** Colmatch, troca de habilidades entre iniciantes em tech.

Este arquivo acompanha o projeto. Atualizem quando as decisões mudarem. O
escopo detalhado de cada frente está em [docs/FRENTES.md](docs/FRENTES.md).

## Produto

- **Público:** iniciantes em tech: universitários, alunos de bootcamp e quem
  está migrando de área, aprendendo programação e as disciplinas da base
  (Cálculo 1, Estrutura de Dados).
- **Problema:** quem aprende sozinho trava e não tem a quem perguntar. O
  professor não explica bem, o tutorial não cobre a dúvida e aula particular
  é cara. Ao mesmo tempo, essa mesma pessoa já sabe outra coisa que alguém
  precisa aprender.
- **Como a rede resolve:** cada pessoa diz o que sabe e o que quer aprender.
  A rede mostra quem pode te ensinar e, em destaque, com quem dá para trocar
  ("te ensino React, você me ensina Cálculo 1"). Depois do match, as duas
  pessoas conversam, agendam a troca e se avaliam.
- **Como saberíamos que funcionou:** uma troca agendada termina com avaliação
  dos dois lados, e a pessoa volta para marcar outra.
- **Princípios que guiaram as telas:** a troca vem primeiro (toda tela
  aproxima a pessoa de um match ou de uma troca agendada); ninguém sai de mãos
  vazias (sempre aparece quem pode ensinar, mesmo sem troca recíproca);
  iniciante é bem-vindo (linguagem leve, nível informativo, nada de ranking de
  quem sabe mais); prova, não promessa (a rotina postada e as avaliações
  mostram quem estuda e quem ensina bem).
- **Onde o nicho aparece:** o catálogo reúne habilidades de programação e disciplinas da base (`backend/app/services/habilidades.py`, `CATALOGO`); o seed monta 32 pessoas, pares de troca garantidos e posts de rotina de estudo, metade com foto ligada à habilidade (`backend/scripts/seed.py`); a interface traz o Feed/Diário com “O que você estudou hoje?” e o livro de pares em `/matches` (decisões [32](docs/decisoes/32-identidade-colmatch-bolsa-de-saberes.md), [33](docs/decisoes/33-mesa-diario-e-cotacao.md) e [36](docs/decisoes/36-pares-e-busca.md)).

## Decisões de produto

O time registrou 46 decisões à medida que o produto mudou (lista completa em [Todas as decisões](#todas-as-decisões)). Estas quatro são as que mudaram o que a rede é. A decisão 1 é a que vai para o vídeo e o pitch ([docs/AVALIACAO.md](docs/AVALIACAO.md)).

### 1. Match em dois níveis

- **Contexto:** o match de troca exige que eu queira o que você sabe e que
  você queira o que eu sei. Numa rede pequena isso quase nunca acontece, e a
  pessoa entra e não encontra ninguém.
- **Opções:** só troca recíproca; lista de todo mundo ordenada por
  compatibilidade; dois níveis.
- **Escolha:** dois níveis. "Pode te ensinar" mostra quem sabe o que eu quero
  aprender. "Match de troca" mostra quem também quer algo que eu sei, e
  aparece em destaque.
- **O que cortamos e por quê:** a troca recíproca pura. Ela é o ideal, mas
  deixaria a maioria das pessoas sem nenhum resultado.
- **Como ficou:** `GET /matches` devolve `troca`, `pode_te_ensinar` e
  `em_andamento` (decisão 17). Quem está na troca não se repete na outra lista. Dentro de cada grupo, vem
  primeiro quem tem mais habilidades em comum comigo (o que a pessoa me ensina
  mais o que eu ensino a ela), com empate pelo nome sem acento. O
  índice invertido de `core/matches.py` escolhe os candidatos, e o banco só
  completa nome e nível deles.

### 2. Agendamento interno, sem login com Google

- **Contexto:** a troca acontece numa chamada. A rede precisa saber quando
  ela aconteceu para pedir a avaliação.
- **Opções:** integração completa com o Google Agenda (login com Google,
  leitura dos horários livres e convite enviado por e-mail); agendamento
  interno com um link para o Google Agenda.
- **Escolha:** agendamento interno. No chat, um propõe dia, horário e
  habilidades, e o outro confirma. Cada um tem o botão "Agendar no Google
  Agenda", que abre o evento preenchido; o Meet é adicionado lá (decisão 17).
  Passado o horário, a rede pede a avaliação aos dois.
- **O que cortamos e por quê:** o OAuth do Google. Exige tela de
  consentimento e cadastro de usuários de teste no Google Cloud, e poderia
  travar o time por dias. O link entrega o mesmo resultado prático.

### 3. A IA só traduz para o catálogo, não cria habilidade

- **Contexto:** o match depende de "Python" e "pyton" serem a mesma coisa.
- **Opções:** texto livre; catálogo fechado; IA que mapeia para o catálogo e
  cria itens novos; IA que só mapeia para itens existentes.
- **Escolha:** catálogo com autocomplete. Se a pessoa digitar livre, a IA
  aponta o item do catálogo que corresponde. Sem correspondência, pedimos
  para escolher da lista. Se a API falhar, usamos uma busca aproximada.
- **O que cortamos e por quê:** a IA criar habilidades. O catálogo ficaria
  bagunçado e o match deixaria de ser confiável.

### 5. Feed com meus posts, quem eu sigo e quem pode me ensinar

- **Contexto:** o feed precisa ajudar a pessoa a descobrir com quem aprender.
  No teste de 22/11 a publicação "sumia" ao recarregar: o feed tirava os
  posts da própria pessoa, e quem não seguia ninguém via o feed vazio.
- **Opções:** só posts de quem eu sigo; seguidos mais posts de quem sabe o que
  eu quero aprender; os dois mais os meus.
- **Escolha:** feed misto, em ordem cronológica, com motivo em cada post:
  `meu`, `seguindo`, `pode_te_ensinar` e `descobrir` (quem marcou alguma
  habilidade igual às minhas). O conjunto de autores não depende de quantos
  posts já existem, para a paginação não pular posts quando alguém publica
  no meio da rolagem.
- **O que cortamos e por quê:** o feed ranqueado por engajamento. Para quem
  quer aprender, importa ver quem estuda aquilo agora, não o post mais curtido.
  Completar com posts aleatórios de quem não tem nada em comum também ficou
  fora: encheria a tela sem ajudar a achar professor.

## Todas as decisões

As quatro de cima estão neste arquivo; as outras ficam em `docs/decisoes/<número>-<nome>.md`, no formato contexto, opções, escolha e o que cortamos. A partir da 27 são da rodada de auditoria e da repaginada Colmatch. Não há decisão 35.

- [1. Match em dois níveis](#1-match-em-dois-níveis).
- [2. Agendamento interno, sem login com Google](#2-agendamento-interno-sem-login-com-google).
- [3. A IA só traduz para o catálogo, não cria habilidade](#3-a-ia-só-traduz-para-o-catálogo-não-cria-habilidade).
- [4. Nível é informativo, não decide quem ensina](docs/decisoes/04-nivel-informativo.md).
- [5. Feed com meus posts, quem eu sigo e quem pode me ensinar](#5-feed-com-meus-posts-quem-eu-sigo-e-quem-pode-me-ensinar).
- [6. Visual de rede social conhecida, com movimento caprichado](docs/decisoes/06-visual-de-rede-social.md).
- [7. Chat por polling, com o id da última mensagem como cursor](docs/decisoes/07-chat-por-polling.md).
- [8. Troca proposta no chat, avaliada só depois do horário](docs/decisoes/08-troca-proposta-no-chat.md).
- [9. Follow idempotente, com o estado devolvido na resposta](docs/decisoes/09-follow-idempotente.md).
- [10. Login com token opaco em sessões](docs/decisoes/10-login-com-token-opaco.md).
- [11. Seed determinístico, com pares de troca garantidos](docs/decisoes/11-seed-deterministico.md).
- [12. Perfil como currículo de troca](docs/decisoes/12-perfil-como-curriculo.md).
- [13. Deploy: front na Vercel, back no Render com SQLite](docs/decisoes/13-deploy-vercel-e-render.md).
- [14. Catálogo: trie em memória, autocomplete e IA genérica com fallback](docs/decisoes/14-catalogo-trie-e-ia.md).
- [15. Banco de produção no Postgres do Neon, com migrações Alembic](docs/decisoes/15-postgres-neon-e-alembic.md).
- [16. Chat com entregue/visto, não lidas e trocas na conversa](docs/decisoes/16-chat-entregue-visto.md).
- [17. Do match à troca: horário por toque, habilidades do par e Meet pelo Google Agenda](docs/decisoes/17-do-match-a-troca.md).
- [18. Editor de habilidades por toque, mesma skill nos dois tipos](docs/decisoes/18-editor-de-habilidades.md).
- [19. Home em 3 colunas, busca sem acento e fotos guardadas no banco](docs/decisoes/19-home-busca-e-fotos-no-banco.md).
- [20. Casca de rede social: painel lateral no computador, barra inferior no celular, movimento por ação](docs/decisoes/20-casca-de-rede-social.md).
- [21. Notificações montadas na leitura, com polling de 15 s](docs/decisoes/21-notificacoes-na-leitura.md).
- [22. Foto de perfil por arquivo e compressão da foto no navegador](docs/decisoes/22-foto-de-perfil-e-compressao.md).
- [23. Streak conta o dia no fuso do Brasil](docs/decisoes/23-streak-no-fuso-do-brasil.md).
- [24. Uma régua de alinhamento para a casca e os cartões](docs/decisoes/24-regua-de-alinhamento.md).
- [25. Fotos do seed por URL externa fixa](docs/decisoes/25-fotos-do-seed-por-url.md).
- [26. Ícone do site: favicon.ico, PNG 32 e SVG, sem trocar o desenho](docs/decisoes/26-icone-do-site.md).
- [27. Bypass `X-User-Id` só no dev: produção recusa o boot com DEBUG](docs/decisoes/27-bypass-so-no-dev.md).
- [28. Troca só avalia o que aconteceu](docs/decisoes/28-troca-so-avalia-o-que-aconteceu.md).
- [29. Índice com tranca e normalização única](docs/decisoes/29-indice-com-tranca-e-normalizacao-unica.md).
- [30. Cursor temporal e leitura atômica](docs/decisoes/30-cursor-temporal-e-leitura-atomica.md).
- [31. Erro honesto em post apagado, limite de 5 posts por minuto e validação única de upload](docs/decisoes/31-erro-honesto-e-limite-de-posts.md).
- [32. Identidade Colmatch e sistema visual “Bolsa de saberes”](docs/decisoes/32-identidade-colmatch-bolsa-de-saberes.md).
- [33. Mesa, Diário e cotação da semana](docs/decisoes/33-mesa-diario-e-cotacao.md).
  Atualizada a pedido do dono: a tela volta a se chamar Feed.
- [34. Mensagens e sessão encerrada](docs/decisoes/34-mensagens-e-sessao-encerrada.md).
- [36. Livro de pares e busca em paleta](docs/decisoes/36-pares-e-busca.md).
  Com aval do dono, o escopo da #83 passou a incluir as habilidades públicas
  nos itens de `GET /usuarios`, carregadas em lote para a página solicitada.
- [37. A proposta de troca vira uma ordem numerada, e confirmar celebra](docs/decisoes/37-trocas-como-ordem.md).
- [38. Notificações como registro de atividade, com cursor opaco no front](docs/decisoes/38-notificacoes-registro-e-cursor.md).
- [39. Mais estudadas por horas, coluna com respiro e avaliação dentro da conversa](docs/decisoes/39-ranking-por-horas-respiro-e-avaliacao-na-conversa.md).
  Pedido direto do dono; substitui o cartão flutuante de avaliação da decisão 8.
  Atualizada a pedido do dono: a coluna encosta na borda direita em telas largas.
- [40. Símbolo do Colmatch vira uma colmeia](docs/decisoes/40-logo-colmeia.md).
  Pedido direto do dono; substitui o desenho de três células da decisão 32.
- [41. Feed com mais imagem](docs/decisoes/41-feed-com-mais-imagem.md).
  Pedido direto do dono.
- [42. Foto do post abre em tela cheia](docs/decisoes/42-foto-do-post-em-tela-cheia.md).
  Issue #106; o toque na foto amplia a imagem inteira, e seguidores/seguindo
  seguem como página (o modal estilo Instagram foi descartado).
- [43. Lupa da foto vira cartão, e a página não rola por trás](docs/decisoes/43-lupa-com-cartao-e-rolagem-travada.md).
  Pedido direto do dono; refina a decisão 42 com legenda, fundo desfocado e rolagem travada.
- [44. Recorte da foto do post e texto longo sem espaço](docs/decisoes/44-recorte-da-foto-e-texto-longo-sem-espaco.md).
  Pedido direto do dono; editor de recorte sem dependência nova e quebra de sequências longas no direct, posts e comentários.
- [45. Ajuste da foto de perfil](docs/decisoes/45-ajuste-da-foto-de-perfil.md).
  Pedido direto do dono; o editor da decisão 44 em modo perfil, com máscara no hexágono do avatar.
- [46. Demo em vídeo na página inicial e no README](docs/decisoes/46-demo-na-pagina-inicial.md).
  Pedido direto do dono; versão web leve servida pela Vercel, sem o MP4 grande no git.
- [47. Repositório organizado para a entrega](docs/decisoes/47-repositorio-organizado-para-a-entrega.md).
  Pedido direto do dono; material da disciplina em `docs/disciplina/` e decisões em `docs/decisoes/`.

## Features

Dono é quem abriu o PR que entregou a feature; quando uma entrega posterior foi
de outra pessoa, as duas aparecem com o número do PR.

| Feature | Dono | Por quê (1 frase) |
|---|---|---|
| Auth (núcleo) | @italoosilva | Sem login não existe troca entre pessoas. |
| Perfil com nível e habilidades (núcleo + diferencial) | @italoosilva | O perfil é o "currículo" que decide se vale trocar com alguém. |
| Catálogo de habilidades com autocomplete e IA | @italoosilva | Garante que o match compare a mesma habilidade. |
| Posts de rotina com tempo e foto (núcleo) | @NicoleAlverga | Mostra que a pessoa estuda aquilo de verdade. |
| Curtidas e comentários (núcleo) | @NicoleAlverga | Motivação e dúvidas rápidas na rotina dos outros. |
| Feed misto (núcleo) | @NicoleAlverga | Ajuda a descobrir quem pode te ensinar. |
| Streak de estudo | @NicoleAlverga | Incentiva a voltar todo dia. |
| Follow (núcleo) | @gecbeltrao | Acompanhar quem estuda o mesmo que você. |
| Match em dois níveis | @gecbeltrao | É o centro do produto. |
| Seed fake (núcleo) | @gecbeltrao | A demo começa com matches de verdade. |
| Chat 1-para-1 | @ltodarosouza | É onde a troca é combinada. |
| Agendamento de troca | @ltodarosouza | Marca a troca e avisa quando avaliar. |
| Avaliação pós-troca | @ltodarosouza | Passa confiança sobre quem ensina bem. |
| Deploy | @ltodarosouza | Bônus de +10 e banca testando na URL. |
| Notificações | @ltodarosouza | Mantêm a pessoa informada sobre atividade e mensagens. |
| Busca de pessoas e habilidades | @gecbeltrao (busca, #56); @ltodarosouza (repaginada em paleta, #87) | Ajuda a encontrar pessoas e habilidades relevantes. |
| Feed/Diário com cotação da semana (antes chamado Mesa) | @gecbeltrao | Reúne a rotina de estudo e o contexto das habilidades em alta. |
| Fotos de post e de perfil | @NicoleAlverga (foto do post, #31); @ltodarosouza (foto de perfil por arquivo, #65) | Dá contexto visual às publicações e aos perfis. |
| Identidade Colmatch | @ltodarosouza | Dá unidade visual e nome à rede. |

**Ficou de fora, e por quê:**

- **Badges e ranking de pessoas:** viram métrica de vaidade e não aproximam
  ninguém de uma troca; a sequência de estudo e a avaliação pós-troca já dão o
  sinal de quem estuda e de quem ensina bem.
- **Login com Google (OAuth):** pediria consentimento e usuários de teste no
  Google Cloud; o link preenchido do Google Agenda resolve (decisão 2).
- **WebSocket no chat:** exigiria conexão aberta no servidor e complicaria o
  deploy; polling com o id da última mensagem basta para conversa 1-para-1
  (decisão 7).
- **Pagamento e aula paga:** a rede é troca entre iguais, sem dinheiro.
- **IA criando habilidades:** poluiria o catálogo e quebraria o match (decisão 3).

## Uma escolha técnica

O índice invertido de `backend/app/core/matches.py` guarda dois mapas habilidade → conjunto de usuários (`sabem` e `querem`) e dois mapas usuário → conjunto de habilidades (`_sei` e `_quero`). Para buscar troca, une os buckets de quem sabe cada habilidade que eu quero e cruza o resultado com a união dos buckets de quem quer cada habilidade que eu sei.

Custos (operações de `dict` e `set` em média/amortizadas):

- **Construção:** O(R), com R registros usuário–habilidade.
- **Salvar habilidades:** O(1) por registro adicionado ou removido, sob a
  tranca da [decisão 29](docs/decisoes/29-indice-com-tranca-e-normalizacao-unica.md).
- **Consulta de troca:** O(h + soma dos buckets das minhas habilidades), com h
  o número de habilidades da pessoa (no máximo 40, `MAX_HABILIDADES` em
  `services/users.py`); as h habilidades são percorridas mesmo quando o bucket
  está vazio. A varredura sem índice olha todos os U usuários e, para cada um,
  cruza até h habilidades: O(U × h).

Com um catálogo fixo e pequeno, cada bucket cresce junto com U, então a
consulta continua linear em U: o índice não muda a classe de complexidade, mas
só visita quem tem alguma habilidade em comum comigo. O ganho cresce quanto
mais espalhadas as habilidades estiverem.

`make bench` gera dados determinísticos (48 habilidades, 1 a 5 "sei" e 1 a 5
"quero aprender" por pessoa), confere que índice e varredura devolvem o mesmo
conjunto de troca antes de medir e mede a construção e a mediana das consultas.
A partir de 1.000 usuários, o índice ficou de 4 a 5× mais rápido que a
varredura; construir para 50 mil usuários levou menos de 0,1 s.

```text
Mede a construção do índice invertido e o tempo de consulta de matches de troca.
A varredura percorre todos os usuários e devolve só as trocas, como o índice; consultas em mediana por pessoa.
  usuários   construção do índice (ms)   consulta índice (µs, mediana)    consulta varredura (µs, mediana)   vezes mais rápido   tamanho médio do resultado de troca
       100                        0.11                            1.21                                4.83                 4.0                                  2.34
     1,000                        0.98                           10.62                               55.52                 5.2                                 29.54
    10,000                       11.60                          100.69                              532.90                 5.3                                297.13
    50,000                       87.70                          834.75                             3402.73                 4.1                               1647.25
Nota: para N=50.000, a mediana usa 20 consultas para manter a execução rápida.
```

O índice fica na memória de um processo (um worker no Render) e é reconstruído no startup a partir do banco. Se o sistema crescesse 100× e tivesse várias instâncias, substituiria essa estrutura por uma consulta SQL com índice por habilidade ou por um cache compartilhado. A outra estrutura em `core/` é a trie do catálogo, descrita na [decisão 14](docs/decisoes/14-catalogo-trie-e-ia.md).

## Uso de IA

- Claude para ajudar a definir o produto, recortar o escopo e dividir as
  frentes.
- IA dentro do produto: mapear a habilidade digitada para um item do catálogo.
- Frente D (chat, agendamento e avaliação): Claude Code planejou a frente,
  escreveu os models, schemas e o contrato do `api.ts`, e dividiu o resto em
  tarefas pequenas para agentes do Codex (GPT-6 Luna) em paralelo, um arquivo
  por agente. Claude revisou cada entrega, rodou os testes e conferiu as
  telas no navegador antes de mesclar.
- Frente C (follow): Claude Code escreveu model, service, rotas, testes e as
  telas de seguidores/seguindo seguindo o slice de usuários, e conferiu o
  botão de seguir no navegador. Um subagente revisor apontou bugs no
  frontend (erro engolido, resposta velha na lista, hydration), que foram
  corrigidos antes do PR.
- Frente A (auth e perfil): IA escreveu models, schemas, services, rotas,
  testes e as telas de login/cadastro e perfil, revisou a integração com o
  follow e realizou os testes (incluindo testes visuais no navegador) antes
  do PR.
- Frente B (posts e comentários, frontend): Claude Code escreveu o contrato
  em `lib/posts.ts` e dividiu as telas em tarefas curtas para agentes do Codex
  (GPT-6 Luna), em duas ondas e um dono por arquivo. Dois revisores Luna só de
  leitura (lógica e design) apontaram achados; Claude fez a triagem, corrigiu
  os reais e testou criar post com e sem foto, apagar, comentar e curtir no
  navegador, em 375 px e nos dois temas.
- Notificações (issue #50): Claude Code dividiu a issue em nove tarefas
  pequenas para agentes do Codex (GPT-6 Luna), em ondas e com um dono por
  arquivo: model e migração, schemas, service, router, testes, lib com o
  hook, item, toast e página. Claude revisou cada entrega, corrigiu o hook
  (timer do toast reiniciando a cada consulta e polling que não começava
  depois do login), rodou a suíte e testou o toast, a página e o "seguir de
  volta" no navegador, em 375 px e nos dois temas.
- Design e celular (issue #49): Claude Code pesquisou padrões de navegação e
  apresentou três opções por decisão para o dono escolher. Escreveu o contrato
  `casca.ts` e dividiu o restante em cerca de 15 tarefas pequenas para agentes
  do Codex (GPT-6 Luna), em quatro ondas, um dono por arquivo. Claude revisou
  as entregas e corrigiu contraste da sequência, dica fora da tela, clique no
  padding da Folha, contador cortado na curtida e zoom do iOS no toque duplo.
  Testou em 375 px e 1440 px no navegador.
- Rodada da auditoria e da repaginada Colmatch (issues #72 a #86): coordenadores Claude Code dividiram cada issue em tarefas pequenas para agentes do Codex (GPT-6 Luna), revisaram os diffs, rodaram testes, tsc e build e passaram cada PR por um agente revisor antes do merge.
- Documentação e critérios de avaliação: Claude Code levantou os critérios da rubrica, agentes do Codex escreveram README, roteiro de avaliação (docs/AVALIACAO.md), o benchmark do índice e a limpeza de backend da issue #77; Claude revisou e corrigiu.
- Demo em vídeo e organização para a entrega: Claude Code montou a demo de 46 s
  ([docs/demo/](docs/demo/README.md)) a partir de capturas do app real com o
  seed e gerou a versão web que a página inicial e o README mostram. Na
  organização final, Claude Code (coordenador) e agentes Claude Haiku separaram
  as decisões em `docs/decisoes/`, juntaram o material da disciplina em
  `docs/disciplina/`, tiraram código sem chamador do frontend e conferiram os
  links. O bot revisor de PR leu o PR #113 em rodadas e pediu ajustes (alternativa
  em texto da demo, exemplos do `.env`, trechos do DESIGN.md).
