# 21. Notificações montadas na leitura, com polling de 15 s

- **Contexto:** ninguém ficava sabendo de curtida, comentário, seguidor,
  proposta de troca ou avaliação sem abrir cada tela. A issue pedia isso sem
  mexer nos models e services das outras áreas.
- **Opções:** tabela de notificações gravada a cada ação (exigiria editar os
  services de curtida, comentário, follow e troca); notificações derivadas na
  leitura a partir das tabelas que já existem; WebSocket/SSE para empurrar em
  tempo real.
- **Escolha:** derivar na leitura. A única tabela nova é
  `leituras_notificacoes` (`usuario_id` único, `lidas_ate`): um item é lido
  quando `em <= lidas_ate`. Tempo real por polling de
  `GET /notificacoes/nao-lidas` a cada 15 s.
- **O que cortamos e por quê:** gravar notificação por ação (quebraria a regra
  de arquivos exclusivos da rodada); WebSocket/SSE (o backend no Render dorme
  e reinicia, e 15 s atende o "pronto quando"); notificação de match novo (não
  há registro de quando um match surge, só o índice em memória).
- **Como ficou:**
  - `GET /notificacoes`, `GET /notificacoes/nao-lidas` (contrato C2) e
    `POST /notificacoes/lidas`. Tipos: `curtida` (agrupada por post e dia UTC:
    "Bia e mais 3 curtiram seu post"), `comentario`, `seguidor`,
    `troca_proposta`, `troca_confirmada`, `troca_recusada` e `avaliacao`.
    Ação da pessoa sobre si mesma nunca vira notificação.
  - O service monta a lista inteira em Python (uma consulta por tipo, atores
    carregados de uma vez), ordena por data e fatia `offset`/`limit`.
  - `/nao-lidas` devolve `{"total", "ultima_em"}`. O `total` é o C2;
    `ultima_em` existe porque uma curtida nova num grupo já não lido não muda
    o total, e o front precisa perceber que algo chegou para mostrar o toast.
  - `useNotificacoes()` em `lib/notificacoes.ts`: consulta ao montar, a cada
    15 s com a aba visível e na volta para a aba. Com a aba escondida só
    continua (a cada 60 s) se a permissão de notificação do navegador já foi
    dada, para avisar proposta de troca. Não pede permissão: reaproveita a do
    chat. Erro ou 404 vira "sem dado".
  - Página `/notificacoes` agrupada em "Hoje", "Esta semana" e "Antes"; ao
    abrir, marca tudo como lido, mas mantém o destaque das não lidas naquela
    visita.
  - `<ToastNotificacoes />` foi montado no `layout.tsx` (exceção combinada à
    regra de arquivos exclusivos, como já é feito com `<AvisoAvaliacao />`):
    canto superior direito no desktop, embaixo no celular.
- **Big O:** cada consulta é O(C + M + S + T + A) no número de curtidas e
  comentários nos posts da pessoa, seguidores, trocas e avaliações recebidas,
  mais O(n log n) para ordenar. Se um perfil ficar grande, o próximo passo é
  limitar a janela (ex.: últimos 90 dias) ou guardar um contador.
