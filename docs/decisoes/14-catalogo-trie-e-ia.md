# 14. Catálogo: trie em memória, autocomplete e IA genérica com fallback

- **Contexto:** a pessoa precisa escolher habilidades de um catálogo fechado
  para o match ser confiável. A experiência de rolar uma lista de 48 itens
  toda vez era ruim, e erros de digitação como "pytom" precisavam ser
  corrigidos sem criar novas habilidades.
- **Opções:** busca SQL com `LIKE '%texto%'`; índice em memória com trie;
  Elasticsearch/Meilisearch; deixar tudo no frontend.
- **Escolha:** trie em memória no backend. Cada nó guarda um dicionário de
  filhos e um conjunto de ids de habilidades que terminam naquele prefixo. A
  busca por prefixo percorre os caracteres normalizados (casefold e sem
  acento) e devolve os ids em ordem alfabética. A trie é reconstruída uma
  vez no `lifespan`, junto com o seed e o índice de matches.
- **O que cortamos e por quê:** busca SQL `LIKE` (escalaria com o catálogo e
  perderia a ordenação por proximidade do prefixo) e motor de busca externo
  (adicional de infra fora da stack do projeto).
- **Como ficou:**
  - `backend/app/core/catalogo.py` tem a `TrieDeHabilidades`, singleton
    carregado no startup.
  - `GET /habilidades/autocomplete?prefixo=...&limite=...` devolve sugestões
    em O(P + L), onde P é o tamanho do prefixo e L o limite de resultados.
  - O frontend substituiu o `<select>` por um campo de busca com dropdown de
    sugestões e chips clicáveis do catálogo. Habilidades adicionadas vão para
    colunas "Sei" e "Quero aprender", com botão de mover e remover — o
    arrastar foi cortado porque quebrava em telas touch e não agregava
    usabilidade real.
  - `POST /habilidades/mapear` recebe um texto digitado e devolve a
    habilidade correspondente, se houver. A lógica é:
    1. Tenta a IA genérica (OpenAI, Groq ou Gemini, configurável por
       `IA_PROVIDER` e `IA_API_KEY`).
    2. Se a chave estiver vazia ou a chamada falhar, cai no fallback
       `difflib` com texto/nomes normalizados (casefold, sem acento) e
       cutoff 0.5.
    3. Se nenhum dos dois encontrar, a resposta é `null` e o frontend mostra
       "Escolha uma habilidade da lista".
  - A IA só mapeia para itens que já existem no catálogo; nunca cria novos.
    Isso evita poluição do catálogo e mantém o match determinístico.
- **Big O:**
  - Autocomplete: O(P + L) na trie, mais O(L) no banco para completar nome e
    categoria.
  - Mapeamento: O(N) para montar a lista de nomes (N = tamanho do catálogo),
    onde a chamada de IA é dominante em latência, não em complexidade.
  - Fallback difflib: O(N × M) no pior caso, onde M é o tamanho médio dos
    nomes, mas roda só quando a IA falha e o catálogo é pequeno.
