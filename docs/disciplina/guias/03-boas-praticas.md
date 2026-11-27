# Guia 03: boas práticas

1. Nomes em português e consistentes. O contrato já segue esse padrão
   (`/usuarios`, `texto`, `curtidas`); usem o mesmo nos módulos, schemas e
   variáveis. Não misturem `post_text` com `texto_do_post`.

2. Router fino, service com a lógica, `core/` puro. O router traduz HTTP para
   Python e nada mais. A regra de negócio fica no service. A estrutura de dados
   fica em `core/` sem depender da web. O slice de exemplo segue esse desenho;
   copiem.

3. Commit pequeno, com o porquê na mensagem. "curtir post: endpoint
   idempotente" diz o que mudou; "ajustes" não diz nada. Se a mensagem precisa
   de "e também...", eram dois commits.

4. Código morto não sobe. Bloco comentado, `print()` de debug e função que
   ninguém chama: apaguem antes do PR. O git guarda o histórico.

5. Leiam o traceback de baixo para cima. A última linha diz o que quebrou
   (`IntegrityError: UNIQUE constraint failed`). Subindo, a primeira linha que
   cita um arquivo de vocês diz onde. O meio é código do framework; ignorem na
   primeira leitura. Se o erro for conhecido, consultem o guia 04 antes de
   chamar monitor.

6. Rodem `make test` antes de todo PR. Com os testes verdes, o review do
   colega se concentra na lógica. Teste `skipped` é trabalho pendente, não
   sucesso.
