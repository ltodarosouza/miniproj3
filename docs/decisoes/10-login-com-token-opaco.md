# 10. Login com token opaco em sessões

- **Contexto:** toda rota protegida precisa saber quem está chamando. O
  `X-User-Id` da Fase 0 só funciona com `DEBUG=true` e qualquer pessoa poderia
  mandá-lo para se passar por outra; não é autenticação.
- **Opções:** JWT assinado e stateless; token opaco guardado numa tabela
  `sessions`; cookie `httpOnly` com sessão no servidor.
- **Escolha:** token opaco. O cadastro guarda só o hash bcrypt da senha em
  `users.password_hash`. O login confere o hash e cria uma linha em `sessions`
  com um token aleatório de 32 bytes (`secrets.token_urlsafe`), devolvido uma
  única vez. Toda request protegida manda `Authorization: Bearer <token>`; o
  `get_current_user` busca a sessão pelo token e devolve o dono. Logout apaga a
  linha e o token morre de verdade. Cada login cria uma sessão nova, e várias
  sessões podem coexistir (celular e notebook). Sem expiração: o logout revoga
  a sessão, e expiração fica como extra se o produto crescer. O front chama
  `GET /auth/eu` depois do login para validar o token e guardar o id.
- **O que cortamos e por quê:** JWT, porque revogar exige lista negra e o ganho
  de não consultar o banco não compensa neste tamanho; cookie `httpOnly`,
  porque exigiria CORS com credenciais e proteção de CSRF; refresh token e
  expiração, porque adicionam código e teste sem mudar a demo. O token fica no
  `localStorage`: um XSS pode lê-lo, mas cookie `httpOnly` exigiria CORS com
  credenciais e proteção de CSRF; a simplicidade de depurar ganha e o risco
  fica documentado.
- **Encaixe com as outras frentes:** o `localStorage` guarda o token e o
  `usuario_id` (o id não autentica; serve para a tela saber "esse perfil sou
  eu?"). O `api.ts` manda `Bearer` e mantém o `X-User-Id` só como fallback de
  desenvolvimento. O bypass de `DEBUG` continua no topo de `get_current_user` e
  `get_current_user_opcional`, então B, C e D podem testar no Swagger antes de
  todas as telas usarem o token.
- **Senha e username:** mínimo de 8 e máximo de 32 caracteres (o bcrypt tem
  limite técnico de 72 bytes; a API avisa em caracteres e barra excesso de
  emojis). O username é normalizado para minúsculas; só aceita `a-z`, `0-9` e
  `_`, sem acento, como as redes grandes. Duplicata devolve `409`, inclusive em
  dois cadastros simultâneos (o `UNIQUE` do banco gera `IntegrityError`,
  convertido em `409`). O seed usa a senha `senha-forte-123`; contas criadas
  pelo `POST /usuarios` do slice ficam sem hash e não logam.
