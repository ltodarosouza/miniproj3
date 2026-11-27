# 47. Repositório organizado para a entrega

Pedido direto do dono, sem issue.

- **Contexto.** Na véspera da entrega, a raiz misturava o produto com o enunciado da disciplina
  (`RUBRICA.md`, `CATALOGO.md`, `CONTRATO.md`), o `DECISIONS.md` tinha 26 decisões completas e
  outras 17 em arquivos à parte, e o README repetia trechos do roteiro de avaliação.
- **Opções.** Deixar como estava; mover só o necessário; reorganizar seguindo a sugestão do
  [guia 08](../disciplina/guias/08-deploy.md#depois-da-entrega-portfólio) (material da disciplina
  em `docs/`, README de produto com a URL no topo).
- **Escolha.**
  - O material da disciplina, sem alteração, foi para `docs/disciplina/` (rubrica, catálogo,
    contrato, guias e estruturas), com um índice e as datas.
  - O `DECISIONS.md` ficou com o que a rubrica pede: time, produto, as quatro decisões que mudaram
    a rede, o índice de todas as decisões, features com dono e motivo, a escolha técnica e o uso
    de IA. As decisões 4 e 6 a 26 foram para `docs/decisoes/`, com o texto original.
  - O README virou a apresentação do produto (o que é, para quem, demo, deploy, contas de demo,
    como rodar, mapa); o `docs/AVALIACAO.md` é o mapa da rubrica. Um aponta para o outro, e
    nenhum repete o outro.
  - O `DESIGN.md` continua na raiz (ali a ferramenta de design do time o encontra, e o caminho
    `docs/design.md` é reservado no `.gitignore` para material do instrutor) e foi atualizado para
    a identidade Colmatch. O `PRODUCT.md` (contexto para a ferramenta de design, ainda com nome
    provisório e cor antiga) saiu; os princípios dele entraram na seção Produto do `DECISIONS.md`.
  - Saíram do frontend os exports sem uso apontados pelo knip.
- **O que cortamos e por quê.** Reescrever as decisões antigas: o texto de cada uma ficou como foi
  escrito na época, para manter o histórico. A página `/usuarios` (o slice de exemplo da
  disciplina, sem link na navegação) ficou, porque tirar uma rota muda o comportamento do app.
