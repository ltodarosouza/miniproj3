# 30. Cursor temporal e leitura atômica

- **Contexto:** issue #75, auditoria F6 e F9. Esta decisão reescreve trechos
  da 21 (notificações montadas a cada request e paginadas por offset) e da 16
  (entregue/visto e contadores de mensagens não lidas). A 7 (polling do chat
  com cursor pelo id da última mensagem) não muda.

  A lista de notificações é montada a cada request, mas o front paginava por
  offset. Uma curtida, comentário ou follow durante a rolagem podia repetir ou
  esconder itens. Na revisão do PR #89 (#85) apareceu o caso sutil: curtidas
  são agrupadas por post e dia UTC, com o horário da última curtida. Uma
  curtida nova num post ainda não exibido fazia o grupo subir ao topo e sumir
  da página seguinte.

  "Marcar conversa como lida" gravava `lida_em` das mensagens e o carimbo
  `LeituraConversa` em dois commits. Se o processo caísse entre eles (o
  Render dorme, decisão 13), o badge seguia contando mensagens já lidas.
- **Opções:** para notificações, filtrar `antes_de=<iso>` depois de agrupar,
  o que perde o grupo do post ainda não exibido; filtrar cada curtida por
  `antes_de` antes de agrupar, o que resolve o caso mas exige que o front some
  1 µs e deduplique empates; ou um cursor opaco com recorte fixo e posição
  com desempate.
- **Escolha:** `GET /notificacoes` devolve `proximo_cursor`, base64url de um
  JSON com o instante do recorte (fixado no request da página 1) e a posição
  do último item: `em`, `tipo`, `ator_id` e uma chave interna. Com `cursor=`,
  o servidor ignora cada evento posterior ao recorte antes de agrupar
  curtidas, ordena por (`em` desc, `tipo`, `ator_id`, chave) e devolve os
  itens estritamente depois da posição.

  Descurtir entre páginas baixaria o horário de um grupo já entregue e o
  faria reaparecer. Por isso, a cada página com próxima, o servidor guarda
  em `notificacoes_entregues` (migração 0006) a posição original de cada
  grupo de curtida entregue (pessoa, recorte, post, dia, `em`, ator). Nas
  páginas seguintes do mesmo recorte, esse grupo é ordenado pela posição
  guardada, então continua acima do cursor. Levar a lista no próprio cursor
  foi a primeira tentativa, mas ela crescia a cada página e estourava o
  limite do parâmetro. Na tabela, o cursor tem tamanho fixo, e repetir o
  mesmo cursor devolve a mesma página. Linhas com recorte de mais de um dia
  são apagadas quando a pessoa pede a página 1.

  `antes_de=<iso>` continua por compatibilidade e recorta cada evento com
  `em < antes_de` antes de agrupar. Os dois parâmetros juntos ou um cursor
  inválido dão 422. Sem parâmetros, o comportamento é o de antes (offset),
  com ordem determinística e o campo novo. Eventos posteriores ao recorte
  aparecem ao recarregar a lista; o toast avisa.

  `marcar_lidas` grava mensagens e carimbo num commit só. Se outra requisição
  criar o carimbo ao mesmo tempo (`IntegrityError`), refaz as duas gravações
  numa nova transação. `_lidas_ate_id` e `_entregues_ate_id` viraram uma
  função com a coluna como parâmetro.
- **O que cortamos e por quê:** snapshot persistido no banco (tabela de
  notificações), que mudaria a decisão 21 inteira; guardamos só a posição
  dos grupos de curtida, o único item cujo horário muda. Na página 1 pedida
  por `offset` > 0, as páginas anteriores por offset não foram guardadas;
  quem pagina com `cursor` desde o início não tem esse limite. Um cursor
  com mais de um dia perde a proteção contra descurtida. A troca da busca de
  username em `dms.py` por `por_username_ou_404` fica para quando a #73
  entrar.
