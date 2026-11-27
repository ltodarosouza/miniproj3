# 16. Chat com entregue/visto, não lidas e trocas na conversa

- **Contexto:** o chat precisava mostrar entrega e leitura, sinalizar mensagens
  e propostas recebidas e incluir conversas que começam por uma troca.
- **Opções:** derivar tudo em cada consulta; guardar leitura de conversa e os
  estados das mensagens; persistir notificações separadas.
- **Escolha:** `mensagens.entregue_em` e `mensagens.lida_em` registram estados.
  `leitura_conversas` guarda até quando cada pessoa abriu uma conversa, então
  uma proposta recebida conta como não lida até a conversa ser aberta. A lista
  de conversas combina mensagens e trocas, e `/dms/nao-lidas` é o contrato C1.
  O chat usa polling de 1,5 s, com envio otimista no front. O `cliente_id`
  torna o envio idempotente e é a chave de reconciliação da mensagem otimista,
  sempre junto com o remetente (é único por quem envia, não no banco todo).
- **O que veio junto:** em SQLite o boot só roda `create_all`, que cria tabela
  nova mas não coluna nova. `completar_esquema_sqlite` (em `main.py`) adiciona
  as colunas e índices que faltam num `app.db` antigo sem apagar dados, então
  ninguém precisa recriar o banco local ao puxar esta mudança. Coluna
  obrigatória nova ainda exige `rm backend/app.db && make seed`.
- **O que cortamos e por quê:** tabela de notificações por mensagem ou troca;
  mensagens e propostas existentes já permitem derivar o contador, enquanto a
  leitura por conversa preserva o estado da proposta sem alterar o modelo de
  troca.
