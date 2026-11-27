# 45. Ajuste da foto de perfil

Pedido direto do dono, sem issue. Estende a decisão 44.

- **Contexto.** A foto de perfil ia direto para o servidor ao ser escolhida.
  O avatar é um hexágono, então fotos em retrato muitas vezes saíam com o
  rosto cortado, sem jeito de ajustar.
- **Opções.** (a) um editor novo só para o avatar; (b) o mesmo
  `RecortarFoto` da decisão 44 com um modo "perfil"; (c) deixar o backend
  centralizar a foto sozinho.
- **Escolha.** (b). Em `modo="perfil"` a foto é sempre quadrada, os botões de
  proporção somem e uma máscara escurece o que fica fora do hexágono (o mesmo
  polígono do `clip-path` de `components/ui/Avatar.tsx`), para a pessoa ver
  como o rosto vai ficar. A foto é preparada em 1600 px, para o zoom não
  borrar, e o recorte sai com 512 px (`LADO_MAXIMO_AVATAR`), como antes; o
  backend não muda. Em `/perfil/editar`, o envio só acontece depois de "Usar
  foto"; "Cancelar" ou Esc mantém a foto atual. "Ajustar foto" reabre o
  editor a partir da foto escolhida, no último enquadramento.
- **O que cortamos e por quê.** Ajustar de novo a foto que já está no
  servidor (depois de recarregar a página): o canvas não exporta imagem de
  outra origem sem CORS. Para reajustar, escolhe-se a foto de novo.