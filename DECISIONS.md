# Decisões do time

**Time:** @italoosilva (Pessoa A), @NicoleAlverga (Pessoa B), @gecbeltrao (Pessoa C) e @ltodarosouza (Pessoa D)

**Rede:** troca de habilidades entre iniciantes em tech. Nome da rede: _a decidir_.

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

## Decisões de produto

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

### 2. Agendamento interno, sem login com Google

- **Contexto:** a troca acontece numa chamada. A rede precisa saber quando
  ela aconteceu para pedir a avaliação.
- **Opções:** integração completa com o Google Agenda (login com Google,
  leitura dos horários livres e convite enviado por e-mail); agendamento
  interno com um link para o Google Agenda.
- **Escolha:** agendamento interno. No chat, um propõe data, hora e link do
  Meet, e o outro confirma. Cada um tem o botão "Adicionar ao Google Agenda".
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

### 4. Nível é informativo, não decide quem ensina

- **Contexto:** a pessoa marca o nível (1 a 5) em cada habilidade.
- **Opções:** exigir nível mínimo para ensinar; nível só informativo.
- **Escolha:** informativo. Quem se dispõe a ensinar pode ensinar. O nível
  ajuda o iniciante a escolher alguém próximo do seu nível, que muitas vezes
  explica melhor do que alguém muito avançado.
- **O que cortamos e por quê:** o bloqueio por nível. Ele reduziria ainda
  mais os matches numa rede pequena.

### 5. Feed com quem eu sigo e quem pode me ensinar

- **Contexto:** o feed precisa ajudar a pessoa a descobrir com quem aprender.
- **Opções:** só posts de quem eu sigo; seguidos mais posts de quem sabe o que
  eu quero aprender.
- **Escolha:** feed misto, em ordem cronológica. Cada post de alguém que eu
  não sigo vem marcado como "pode te ensinar".
- **O que cortamos e por quê:** o feed ranqueado por engajamento. Para quem
  quer aprender, importa ver quem estuda aquilo agora, não o post mais curtido.

### 6. Visual de rede social conhecida, com movimento caprichado

- **Contexto:** quatro pessoas constroem telas em paralelo, e o público é
  iniciante e precisa se sentir em casa.
- **Opções:** um visual temático (álbum de figurinhas, tabela periódica,
  quadro branco) ou o padrão de rede social executado com capricho.
- **Escolha:** o padrão de rede social, limpo e acolhedor, em verde-azulado,
  com tema claro e escuro e movimento fluido (holofote que segue o mouse,
  arrastar habilidades, transições suaves). Detalhes no [DESIGN.md](DESIGN.md).
- **O que cortamos e por quê:** os visuais temáticos. Seriam mais marcantes,
  mas mais difíceis de reproduzir igual em quatro frentes e mais arriscados
  de parecer infantis. A personalidade fica no movimento e nos detalhes.

### 7. Chat por polling, com o id da última mensagem como cursor

- **Contexto:** a conversa precisa mostrar as mensagens novas sem a pessoa
  recarregar a página. WebSocket está fora do escopo.
- **Opções:** recarregar a conversa inteira a cada poucos segundos; buscar só
  o que chegou depois de uma data; buscar só o que chegou depois do id da
  última mensagem.
- **Escolha:** a tela pergunta a cada 3 segundos
  `GET /dms/{username}?depois_de=<id>` e recebe só as novas. O polling pausa
  com a aba escondida. O id é crescente e único, então não perde nem repete
  mensagens enviadas no mesmo segundo, o que a data não garante.
- **O que cortamos e por quê:** WebSocket e "digitando...". Exigiriam um
  servidor com conexão aberta e complicariam o deploy; 3 segundos de atraso
  bastam para combinar uma troca.

### 8. Troca proposta no chat, avaliada só depois do horário

- **Contexto:** a rede só pode pedir avaliação de uma troca que aconteceu, e
  nem toda troca é recíproca ("pode te ensinar").
- **Opções:** avaliar a pessoa a qualquer momento; avaliar a troca depois do
  horário marcado.
- **Escolha:** a troca guarda o que quem propôs ensina e o que aprende, e
  basta uma das duas. Ela nasce `proposta`, só quem recebeu confirma ou recusa,
  e a avaliação abre para os dois quando o horário de uma troca confirmada
  passa. Cada pessoa avalia uma vez por troca. O pedido aparece num cartão
  flutuante em qualquer tela, que pode ser adiado.
- **O que cortamos e por quê:** avaliação livre de perfil. Viraria ranking de
  popularidade, e a nota precisa vir de uma troca real (princípio "prova, não
  promessa").

## Features

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

Extras, só depois de tudo acima pronto: notificações, trending de habilidades
e badges.

## Uma escolha técnica

_(a preencher)_ Candidata principal: o índice invertido do match em
`backend/app/core/matches.py`. Para cada habilidade, guardamos quem sabe e
quem quer aprender. O match de troca vira uma interseção de conjuntos, sem
varrer todos os usuários. Expliquem o Big O e, se der, meçam com `make bench`
contra a versão que percorre todos os usuários.

## Uso de IA

- Claude para ajudar a definir o produto, recortar o escopo e dividir as
  frentes.
- IA dentro do produto: mapear a habilidade digitada para um item do catálogo.
- Frente D (chat, agendamento e avaliação): Claude Code planejou a frente,
  escreveu os models, schemas e o contrato do `api.ts`, e dividiu o resto em
  tarefas pequenas para agentes do Codex (GPT-6 Luna) em paralelo, um arquivo
  por agente. Claude revisou cada entrega, rodou os testes e conferiu as
  telas no navegador antes de mesclar.
- _(completem conforme usarem)_
