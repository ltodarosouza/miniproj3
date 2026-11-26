# 39. Mais estudadas por horas, coluna com respiro e avaliação dentro da conversa

Pedido direto do dono, sem issue, depois de usar a Mesa e as trocas.

- **Contexto.** Três incômodos de uso:
  1. A faixa "1º … 5º" no topo da Mesa (a "cotação" da decisão 33) não dizia
     o que era nem por qual critério ordenava. O `GET /feed/em-alta`
     ordenava por número de posts, mas a tela mostra as horas, então o 2º
     lugar podia ter 3h20 e o 3º, 5h27.
  2. A coluna da direita ("Sua semana", ranking, "Pode te ensinar") ficava a
     35 px dos posts em 1100 e 1440 px.
  3. O pedido de avaliação de troca era um cartão flutuante por cima de
     qualquer tela (decisão 8), que atrapalhava o que a pessoa estava fazendo.
- **Opções.** Para o ranking: manter por posts e mostrar posts, ou ordenar
  pelas horas que já estão na tela. Para a avaliação: manter o cartão
  flutuante com outro visual, levá-la para Notificações ou levá-la para a
  conversa onde a troca foi combinada.
- **Escolha.**
  - O ranking passa a se chamar **Mais estudadas** e é ordenado por **minutos
    estudados nos últimos 7 dias**, com desempate por posts e depois por nome.
    A tabela mostra a posição (1º, 2º…), destaca a coluna Horas e escreve o
    critério embaixo ("Ordem: horas estudadas nos últimos 7 dias."). A faixa
    do topo, com o rótulo "Mais estudadas · 7 dias", só aparece abaixo de
    1024 px, onde a coluna da direita fica escondida. No computador, a tabela
    da coluna basta e a faixa só repetia o mesmo conteúdo.
  - O grid da Mesa passa de 60rem com vão de 2rem para 64rem com vão de 3rem
    (`lg`) e 4rem (`xl`). Medido com `getBoundingClientRect`, o vão entre posts
    e coluna fica em 48 px em 1024 e 1100 px e 84 px em 1440 px. O Diário
    continua com 600 px a partir de 1280 px e não há rolagem horizontal.
  - A avaliação acontece **no cartão da ordem, dentro da conversa**. Ela segue
    a mesma regra da decisão 28: a troca precisa estar confirmada, o horário
    precisa ter passado e a pessoa ainda não pode ter avaliado
    (`GET /trocas/pendentes-avaliacao`, sem mudança no backend). A conversa
    mostra uma faixa "Como foi a troca?" com atalho até o cartão. A lista de
    conversas marca a linha com "Avaliar troca", e o selo de **Mensagens**
    soma as mensagens não lidas e as trocas a avaliar. O rótulo acessível
    separa as duas contagens. Ao enviar, o evento `troca:avaliacao-enviada`
    (`lib/avaliacoes.ts`) atualiza o selo e a lista sem esperar o polling.
- **O que cortamos e por quê.** Não há rota de contagem dedicada: o selo usa o
  tamanho da lista de pendentes, que é curta por natureza (uma por troca
  passada), e assim o contrato não muda. O "Avaliar depois" do cartão
  flutuante saiu, porque o pedido não fica mais no caminho: ele espera na
  conversa até a pessoa avaliar. A faixa do topo da Mesa continua sem seta de
  subida ou descida, porque ainda não há histórico de semanas (decisão 33).
