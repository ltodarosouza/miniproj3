# 19. Home em 3 colunas, busca sem acento e fotos guardadas no banco

- **Contexto:** relatos de 22/11: post que some ao recarregar, não dá para
  editar, faixa vazia dos lados no notebook e nenhuma busca de posts ou
  habilidades. As fotos ficavam em `uploads/` no disco do Render, que zera a
  cada deploy (decisão 13), e o post ficava com link quebrado.
- **Opções:** para as fotos, Vercel Blob, Cloudinary ou uma tabela de bytes
  no Neon; para a busca, `ILIKE` no banco, índice de texto do Postgres ou
  comparação em Python; para a home, coluna única mais larga ou grade
  feed | descoberta, como X, Instagram e LinkedIn.
- **Escolha:**
  - Fotos na tabela `imagens_post` (nome, post, tipo, bytes), servidas por
    `GET /posts/imagens/{nome}` com cache de um ano. Não exige conta nova nem
    chave, e sobrevive a deploy porque mora no Neon. Arquivos antigos que
    ainda estejam no disco continuam servidos.
  - `GET /busca?q=&tipo=pessoas|posts|habilidades` e
    `GET /busca/habilidades/{id}`, comparando com `normalizar()` do catálogo
    (casefold sem acento), o mesmo para SQLite e Postgres.
  - Home em grade `feed (até 600 px) | coluna de 20 rem` a partir de 1024 px.
    A coluna é fixa ao rolar e traz busca, progresso da semana, "Pode te
    ensinar" (de `GET /matches`, só leitura) e "Em alta esta semana"
    (`GET /feed/em-alta`). Abaixo de 1024 px a coluna some e "Pode te
    ensinar" vira carrossel depois do 3º post.
- **O que cortamos e por quê:** Cloudinary e Vercel Blob (conta e segredo a
  mais a quatro dias da entrega); índice de texto do Postgres (não roda no
  SQLite dos testes e do dev); vídeos curtos ("Pílulas"), que ficam para uma
  sub-issue P2 depois de tudo isto na `main`.
- **Como ficou:**
  - `Post.editado_em` (migração 0004) é preenchido só quando algo muda de
    verdade; o cartão mostra "· editado". O menu "⋯" do autor tem Editar
    (texto, habilidade e minutos no próprio cartão, Esc cancela) e Apagar.
  - Composer compacto "O que você estudou hoje?" que abre ao tocar; o link
    `/feed?publicar=1` da casca (decisão 20) também abre. Rolagem infinita
    com IntersectionObserver, puxar para atualizar e toque duplo para curtir.
  - `/busca` com abas Pessoas · Publicações · Habilidades, debounce de
    300 ms, termo e aba na URL, e "Recomendados" quando o campo está vazio.
    Cada habilidade abre quem sabe, quem quer aprender e os posts sobre ela.
  - `GET /feed/meu-progresso` devolve sequência, minutos e posts dos
    últimos 7 dias.
- **Big O:** a busca percorre pessoas, posts ou habilidades em Python:
  O(U), O(P) ou O(H) por consulta. Com a rede da turma isso leva
  milissegundos; se crescer, o próximo passo é uma coluna normalizada
  indexada ou `unaccent` + `pg_trgm` no Postgres. "Em alta" é um
  `GROUP BY` nos posts da semana.
