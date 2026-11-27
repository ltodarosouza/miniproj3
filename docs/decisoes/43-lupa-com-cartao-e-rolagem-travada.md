# 43. Lupa da foto vira cartão, e a página não rola por trás

Pedido direto do dono, sem issue. Refina a decisão 42.

- **Contexto.** A lupa da decisão 42 só esticava a foto sobre um fundo quase
  preto: sem borda, sem raio, sem quem postou, e o ✕ quase sumia no tema
  escuro. Com ela aberta, a roda do mouse e o arrasto no celular ainda rolavam
  o feed por trás.
- **Opções.** (a) manter a foto solta e só escurecer mais o fundo; (b) foto
  dentro de um cartão do sistema visual, com legenda do post; (c) trocar o
  `<dialog>` por uma biblioteca de lightbox (galeria, pinça, arrasto).
- **Escolha.** (b), no mesmo `<dialog>` nativo de `components/posts/Lupa.tsx`.
  A foto vai num cartão com os tokens do Colmatch (`rounded-cartao`, borda
  `linha`, `bg-superficie`, `shadow-alta`), proporção preservada
  (`object-contain`, limites em `dvh`/`vw`) e, no topo, a legenda: avatar,
  nome, @usuário, hora e a habilidade do post, com o ✕ ao lado, sempre visível
  nos dois temas. O fundo (`::backdrop`) escurece com desfoque. O cartão entra
  e sai em escala (`--medio` na entrada, `--rapido` na saída); com
  `prefers-reduced-motion` fecha na hora. Esc, ✕ e clique fora fecham; o Tab
  circula só entre o ✕ e a foto, e ao fechar o foco volta ao botão da foto no
  post. O zoom 2× ancorado da decisão 42 continua, agora recortado pela
  moldura, e também responde ao Enter (ancora no centro).
- **Rolagem travada.** `lib/rolagem.ts` fixa o `body` (`position: fixed` com
  `top` negativo), que segura também o iOS, onde `overflow: hidden` não basta;
  ao fechar a página volta à mesma posição. O `PuxarParaAtualizar` passou a
  ignorar toques dentro de um diálogo aberto: com a rolagem travada o `scrollY`
  fica 0 e o arrasto na foto deslocava o feed por trás.
- **O que cortamos e por quê.** Galeria, pinça e arrasto (opção c): o post tem
  uma foto só, e uma dependência nova não se paga por isso. O desfoque não
  roda em navegadores sem `backdrop-filter`; ali fica só o escurecimento.
