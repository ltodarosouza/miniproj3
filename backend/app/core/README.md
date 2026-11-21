# core/: as estruturas de dados do time

Aqui ficam as estruturas de dados das features, em Python puro: sem
SQLAlchemy, sem FastAPI, sem import de banco. Só dicts, sets, listas, deques,
heaps e a lógica deles. A banca olha isso no critério de organização do código: a lógica das
estruturas fica aqui, e o endpoint a usa de verdade.

## O padrão

`contadores.py` é o exemplo. Cada estrutura segue cinco regras:

1. É uma classe ou módulo puro, testável sem servidor.
2. Existe uma instância global (singleton de módulo) que a API usa.
3. No startup (lifespan, em `main.py`), o singleton é reconstruído a partir do
   banco. A memória zera a cada restart, o banco não.
4. Todo write relevante da API atualiza o singleton em O(1), sem reconstruir
   tudo em O(n).
5. O endpoint importa e usa o singleton (`from app.core...`).

## Avisos

- `uvicorn --reload` reinicia o processo a cada save. O singleton zera e é
  reconstruído no startup. Se os números sumirem, é isso (guia 04).
- Em produção, isso seria um índice ou uma consulta no banco. Aqui a estrutura
  fica em memória porque o objetivo é vocês a implementarem e medirem.
- Reconstruir a estrutura a cada request só é aceitável se o Big O declarado no
  `DECISIONS.md` disser isso. Nesse caso a operação é O(n), não O(1).
