# 36. Livro de pares e busca em paleta

- **Contexto.** A issue #83 reúne as telas de descoberta da Bolsa de saberes.
  A lista de pares precisa mostrar quem ensina cada habilidade e como abrir a
  conversa. A busca reúne pessoas, posts e habilidades.
- **Escolha.** Organizar pares em tabelas com cabeçalhos de coluna e mostrar
  os dois grupos de habilidades na segunda faixa da linha no celular.
  Usar o mesmo campo para os três tipos de busca, com atalhos de teclado e
  resultados separados por réguas.
- **Dados.** A cotação da habilidade usa as contagens das listas de quem sabe e
  de quem quer aprender. A API de detalhe não informa horas da semana por
  habilidade. Com aval do dono, a #83 passou a incluir as habilidades públicas
  nos itens de `GET /usuarios`. O serviço carrega as habilidades em lote para
  os usuários da página, e a interface as exibe em etiquetas mono. O contador
  acompanha as pessoas exibidas e a paginação usa o total da API.
