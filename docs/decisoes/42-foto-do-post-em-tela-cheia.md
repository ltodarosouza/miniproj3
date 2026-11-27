# 41. Foto do post abre em tela cheia

Issue #106.

- **Contexto.** A foto no cartão sai com altura máxima de 448 px e `object-cover`:
  cortada e fixa, sem gesto para vê-la inteira. Fotos de celular e as do seed são
  altas, e nada dava à pessoa uma forma de ler a imagem.
- **Opções.** (a) toque na foto abre lupa em tela cheia; (b) tocar navega ao post
  (`/posts/{id}`), onde a foto aparece grande; (c) expandir dentro do próprio
  cartão. A rodada também avaliou seguidores/seguindo como modal estilo Instagram.
- **Escolha.** (a), com `<dialog>` nativo em `components/posts/Lupa.tsx`, o mesmo
  padrão da `Folha` (decisão 20): imagem ajustada à tela com `object-contain`,
  fundo escuro, e fecha com Esc (evento `cancel` nativo), no ✕ ou tocando fora. O
  dialog vive na camada superior, então cobre a barra inferior no celular sem
  mexer em z-index. No `CartaoPost`, a foto vira um botão com
  `aria-label="Ampliar foto"` e `data-sem-toque-duplo`: o duplo toque de curtir
  continua valendo no resto do cartão e não briga com o clique na foto. Vale para
  as três telas que usam o cartão — feed, perfil e página do post — porque é o
  mesmo componente.
- **O que cortamos e por quê.** Zoom contínuo (alternar ajustada ↔ 1:1 com pan)
  seriam ~100 linhas a mais e arriscado na véspera da entrega; o pinça do
  navegador no celular já dá o zoom da página. Seguidores/seguindo ficam como as
  páginas que já existem em `/usuarios/{username}/seguidores` e
  `/usuarios/{username}/seguindo`: o modal estilo Instagram foi considerado e
  recusado, porque as rotas já funcionam, são compartilháveis e respondem ao
  botão voltar — virar diálogo seria reimplementar URL e histórico por ganho só
  cosmético.
