# 24. Uma régua de alinhamento para a casca e os cartões

- **Contexto:** issue #64. Elementos que deveriam ficar alinhados começavam em
  colunas diferentes: na navegação lateral larga, o logo, os ícones do menu, o
  tema e o "Sair" tinham centros diferentes. Os itens de notificação ficavam
  12 px para dentro dos títulos, e os cabeçalhos das duas colunas de mensagens
  tinham alturas diferentes. No celular, os botões do perfil espremiam o nome.
- **Opções:** ajustar cada caso com valores soltos, ou fixar algumas regras
  e corrigir pelos tokens que já existem.
- **Escolha:**
  - Na navegação lateral, o logo, os itens do menu, o tema e o Sair têm o
    ícone numa caixa `size-9` encostada na borda interna, e os rótulos
    começam na mesma coluna (`gap-3`). "Publicar" é um botão e continua
    centralizado. A nav rola por dentro quando falta altura, para o Sair
    nunca sair da tela.
  - Item de lista com fundo próprio (não lida, hover) usa margem negativa
    igual ao padding (`-mx-3` com `p-3`, como o `-mx-2 px-2` de Em alta), para
    o conteúdo ficar na coluna dos títulos.
  - Cabeçalhos lado a lado têm altura fixa igual (`h-16`).
  - Todo contêiner que repete `rounded-cartao border bg-superficie` também
    leva `shadow-cartao`, igual ao `Cartao`.
  - Ações ao lado de um nome descem para a linha de baixo abaixo de `sm`.
- **O que cortamos e por quê:** a assimetria de padding do cabeçalho do
  celular fica como está, porque compensa o respiro interno dos botões de 44 px.
  Arquivos de outras issues (`CartaoPost`, `Streak`, `Avatar`, `app/feed`)
  ficaram de fora.
