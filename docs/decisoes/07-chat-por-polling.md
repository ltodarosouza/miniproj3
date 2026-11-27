# 7. Chat por polling, com o id da última mensagem como cursor

- **Contexto:** a conversa precisa mostrar as mensagens novas sem a pessoa
  recarregar a página. WebSocket está fora do escopo.
- **Opções:** recarregar a conversa inteira a cada poucos segundos; buscar só
  o que chegou depois de uma data; buscar só o que chegou depois do id da
  última mensagem.
- **Escolha:** a tela pergunta a cada 1,5 segundo
  `GET /dms/{username}?depois_de=<id>` e recebe só as novas. O polling pausa
  com a aba escondida. O id é crescente e único, então não perde nem repete
  mensagens enviadas no mesmo segundo, o que a data não garante.
- **O que cortamos e por quê:** WebSocket e "digitando...". Exigiriam um
  servidor com conexão aberta e complicariam o deploy. A decisão 16 complementa
  esta com envio otimista, entregue/visto e contagem de não lidas.
