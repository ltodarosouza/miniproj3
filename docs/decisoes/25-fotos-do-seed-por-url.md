# 25. Fotos do seed por URL externa fixa

- **Contexto:** issue #62. Os posts dos usuários falsos eram só texto e
  ninguém tinha foto de perfil, então o feed parecia vazio na apresentação.
- **Opções:** guardar arquivos de foto no repositório e gravar como
  `ImagemPost`, usar `picsum.photos` (aleatório, sem relação com o post) ou
  apontar para URLs fixas de fotos escolhidas.
- **Escolha:** URLs absolutas e fixas. Avatares vêm de
  `randomuser.me/api/portraits/{women|men}/<n>.jpg`, sem repetir, com o gênero
  sorteado junto com o nome. Posts usam fotos do Unsplash por ID, agrupadas por
  tema (`FOTOS_POR_TEMA`) e ligadas às habilidades do catálogo
  (`TEMA_POR_HABILIDADE`; o que não está na tabela usa "estudo"). Cerca de 45%
  dos posts ganham foto, e há 10 posts extras de progresso com foto nas
  últimas 48 horas. Tudo sai do mesmo `random.Random(SEMENTE)`.
- **O que cortamos e por quê:** arquivos locais em `seed_fotos/` deixariam o
  repositório pesado sem ganho na apresentação. Sem internet, o `Avatar` e o
  `CartaoPost` já caem na inicial ou escondem a foto, então nada quebra.
