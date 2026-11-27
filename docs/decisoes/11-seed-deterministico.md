# 11. Seed determinístico, com pares de troca garantidos

- **Contexto:** a demo precisa abrir com matches de verdade. Com habilidades
  sorteadas ao acaso, alguns usuários ficariam sem ninguém para trocar.
- **Opções:** sortear tudo com o Faker; montar tudo à mão; pares fixos e
  sorteio só para o resto.
- **Escolha:** 16 pares fixos, em que um sabe o que o outro quer e vice-versa,
  então todo usuário do seed tem pelo menos um match de troca (há teste para
  isso). O Faker cria os nomes, e habilidades extras, posts, curtidas e
  follows saem de um `random.Random(42)`. Por isso a demo é igual em toda
  máquina. As três contas antigas (`ada`, `linus`, `grace`) continuam. O seed
  não roda se o banco já tiver usuários.
- **O que cortamos e por quê:** um seed totalmente aleatório. A cada execução
  a demo mudaria e poderia sair sem trocas.
