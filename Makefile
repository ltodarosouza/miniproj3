# Comandos do dia a dia. Rode da raiz do repo.

.PHONY: check dev-back dev-front seed test bench

check:
	cd backend && uv run python scripts/check_setup.py

dev-back:
	cd backend && uv run uvicorn app.main:app --reload

dev-front:
	cd frontend && npm run dev

seed:
	cd backend && uv run python scripts/seed.py

test:
	cd backend && uv run pytest -v

bench:
	@cd backend && ls scripts/bench_*.py >/dev/null 2>&1 \
		&& for f in scripts/bench_*.py; do uv run python $$f; done \
		|| echo "nenhum scripts/bench_*.py ainda — opcional, para medir uma estrutura de dados"
