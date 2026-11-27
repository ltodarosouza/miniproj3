# 9. Follow idempotente, com o estado devolvido na resposta

- **Contexto:** o botão de seguir aparece no perfil, nas listas e nos
  matches, e precisa mostrar o estado certo sem recarregar a página.
- **Opções:** `POST`/`DELETE` devolvendo `204`, com a tela fazendo um `GET`
  depois para saber o contador; ou devolver o estado atualizado na resposta.
- **Escolha:** `POST` e `DELETE /usuarios/{username}/follow` são idempotentes
  (seguir duas vezes não duplica, e a tabela `follows` tem `UNIQUE` no par) e
  devolvem `{"seguindo", "seguidores"}`. Assim a tela economiza uma ida ao
  servidor e o contador nunca fica velho. `GET` na mesma rota diz se quem está
  logado segue a pessoa, e as listas de seguidores/seguindo trazem `eu_sigo`
  em cada item, para não fazer um pedido por pessoa.
  `services.follows.contadores(db, id)` entrega `seguidores` e `seguindo` para
  o perfil de A.
- **O que cortamos e por quê:** seguir de volta automático. O follow imediato
  é o comportamento de conta pública do [CONTRATO.md](../disciplina/CONTRATO.md); conta
  privada com pedidos (`202`) fica como extra, se der tempo.
- **Encaixe com o login:** as listas usam `get_current_user_opcional` em
  `deps.py`, para quem não está logado ver as listas. Quando A trocar o
  `X-User-Id` pelo token, troca nas duas funções.
