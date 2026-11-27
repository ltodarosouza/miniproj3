# 18. Editor de habilidades por toque, mesma skill nos dois tipos

- **Contexto:** o editor anterior exigia buscar cada habilidade pelo nome, uma
  por uma. A UX bloqueava o onboarding e impedia marcar a mesma habilidade como
  "sei" e "quero aprender" ao mesmo tempo.
- **Opções:** manter o autocomplete; nuvem de chips com abas separadas; nuvem
  com estado no próprio chip.
- **Escolha:** nuvem de chips com ciclo de estado por toque: neutro → Sei →
  Quero aprender → Os dois → neutro. A mesma habilidade pode ter os dois tipos
  com níveis independentes. O backend valida por `(habilidade_id, tipo)`, não
  por `habilidade_id` sozinho.
- **O que cortamos e por quê:** sugestões dinâmicas via `/matches` (dependência
  de runtime; fica como melhoria futura); animação com mola (complexidade
  desnecessária na primeira entrega).
- **Como ficou:** `EditorHabilidades.tsx` com chips clicáveis, filtro de busca
  inline, níveis separados por tipo e resumo vivo ("Você sabe X coisas e quer
  aprender Y"). `salvar_habilidades` no backend recusa apenas repetição exata
  de `(habilidade_id, tipo)`. Testes em `test_habilidades_usuario.py`.
