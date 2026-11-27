# 22. Foto de perfil por arquivo e compressão da foto no navegador

- **Contexto:** issue #59. Foto de celular (3 a 8 MB) passava do limite de
  2 MB e era recusada; arquivos da câmera sem extensão davam 422; não dava
  para mexer na foto ao editar o post; a foto de perfil só aceitava URL.
- **Opções:** subir o limite do servidor, comprimir no servidor (Pillow) ou
  comprimir no navegador antes do upload.
- **Escolha:**
  - `prepararImagem()` em `lib/imagens.ts` redimensiona no canvas (lado maior
    1600 px no post, 512 px no avatar) e exporta webp/jpeg abaixo de 2 MB. O
    servidor mantém o limite de 2 MB.
  - O backend ignora o nome e o `content-type` enviados: decodifica a imagem
    com Pillow (JPEG, PNG ou WebP, até 40 MP) e grava o formato detectado.
    Arquivo truncado ou corrompido dá 422 e não substitui a foto anterior. As
    rotas que servem imagens enviam `X-Content-Type-Options: nosniff`.
  - Avatar guardado como bytes na tabela `imagens_avatar` (migração 0005, um
    por usuário; o downgrade limpa os `avatar_url` internos),
    mesmo padrão da decisão 19: `POST`/`DELETE /usuarios/eu/avatar` e
    `GET /usuarios/avatares/{nome}` com cache de um ano.
  - `DELETE /posts/{id}/imagem`; o editor do post adiciona, troca e remove a
    foto ao salvar.
- **O que cortamos e por quê:** redimensionar no servidor (a compressão fica
  no navegador; o Pillow só valida, e o limite de 2 MB mantém o custo baixo);
  recorte do avatar (o `object-cover` já centraliza); limite do corpo antes do
  parser multipart (exige middleware global, fora da #59).
