# Como vamos avaliar

A nota vai de 0 a 100, mais bônus. Não tem teste oculto nem tabela de pontos
por feature. A banca olha o produto, usa a rede e lê o código.

| O que a banca olha | Pontos | A pergunta |
|---|---|---|
| Produto | 50 | A rede faz sentido para o nicho que vocês escolheram? |
| Funcionamento | 30 | Dá para usar? |
| Código | 20 | Está organizado? |

Cada bloco recebe uma nota e um feedback curto, escrito, de duas ou três linhas.
O feedback conta tanto quanto a nota.

## Produto (50)

A banca vê o vídeo (cerca de 4 minutos), ouve o pitch (3 minutos, mais uma
pergunta) e lê a seção Produto do `DECISIONS.md`. Quatro perguntas guiam a nota:

1. O público e o problema estão claros? ("corredores iniciantes da UFPB" vale
   mais que "gente que gosta de esporte".)
2. A rede resolve esse problema para esse público?
3. O nicho aparece no conteúdo, no seed e na interface?
4. As decisões de produto fazem sentido? O que vocês escolheram, o que cortaram
   e por quê.

O vídeo mostra cadastro, login, criação de post, follow e feed, até duas
features fortes do time e uma decisão de produto.

## Funcionamento (30)

A banca usa a rede, no deploy ou na máquina do time. Vê se o fluxo principal
funciona de ponta a ponta (cadastro, login, post, feed e seguir alguém) e se as
features que o time escolheu funcionam de verdade, não só aparecem na tela.

Os testes do núcleo (`make test`) são um roteiro para o time. Eles ajudam, mas
não valem nota.

## Código (20)

A banca lê o repositório com cinco critérios simples e marca cada um como bom,
ok ou precisa melhorar (4, 2 ou 0 pontos):

1. **Sem duplicação.** O mesmo trecho não aparece copiado em vários lugares.
2. **Nomes claros.** Nomes em português, consistentes entre models, schemas,
   rotas e telas.
3. **Cada coisa no seu lugar.** Router fino, regra de negócio no service e
   estruturas de dados em `core/`.
4. **Sem sobra.** Sem código comentado, `print` de debug ou função que ninguém
   chama.
5. **Uma escolha técnica explicada.** O time conta, no `DECISIONS.md` ou no
   pitch, por que fez algo de um jeito (por exemplo, por que usou aquela
   estrutura de dados).

Quem quiser medir uma estrutura (`make bench`) e mostrar o resultado no
`DECISIONS.md` reforça o critério 5. Não é obrigatório.

## Bônus

- **Deploy público: +10.** A banca testa cadastro → login → post → follow →
  feed na URL.
- **Destaque da turma: +2.** Para o `DECISIONS.md` que melhor explica para quem
  é a rede, o que ficou de fora e por quê.

## Trabalho em time

Não entra na nota. É o combinado do time:

- cada pessoa é dona de pelo menos uma feature;
- cada feature tem uma issue, fechada pelo PR de quem a fez (`Closes #N`);
- cada pessoa tem commits relevantes e PRs revisados por outra pessoa.

A banca olha o histórico do Git para entender quem fez o quê e para comentar
no feedback.

## Uso de IA

IA é permitida. Registrem no `DECISIONS.md` qual ferramenta usaram e para quê.

## Datas

As datas estão no [README](README.md#prazos).
