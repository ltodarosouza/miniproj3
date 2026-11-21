"""Valida o ambiente do time e testa o slice de exemplo. Rode com: make check

Cada falha diz exatamente o que instalar. Verde aqui = pode começar.
"""

import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

ERROS: list[str] = []


def falha(msg: str) -> None:
    ERROS.append(msg)
    print(f"  ✗ {msg}")


def ok(msg: str) -> None:
    print(f"  ✓ {msg}")


def checa_python() -> None:
    v = sys.version_info
    if v >= (3, 11):
        ok(f"python {v.major}.{v.minor}")
    else:
        falha(
            f"python {v.major}.{v.minor} — precisa de 3.11+. "
            "Instale via https://docs.astral.sh/uv/ (uv python install 3.12) "
            "e rode sempre com 'uv run' (ver docs/guias/00-setup.md)"
        )


def checa_uv() -> None:
    if shutil.which("uv"):
        ok("uv instalado")
    else:
        falha("uv não encontrado — instale: https://docs.astral.sh/uv/getting-started/installation/")


def checa_node() -> None:
    node = shutil.which("node")
    if not node:
        falha("node não encontrado — instale a versão do frontend/.nvmrc via https://nodejs.org")
        return
    versao = subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip()
    major = int(versao.lstrip("v").split(".")[0])
    if major >= 20:
        ok(f"node {versao}")
    else:
        falha(f"node {versao} — precisa de 20+ (frontend/.nvmrc); use nvm ou reinstale")


def checa_backend() -> None:
    try:
        from fastapi.testclient import TestClient

        from app.main import app
    except ImportError as e:
        falha(f"dependências do backend faltando ({e}) — rode 'uv sync' dentro de backend/")
        return

    with TestClient(app) as client:
        r = client.get("/usuarios")
        if r.status_code == 200 and "items" in r.json():
            ok("backend responde: GET /usuarios → 200")
        else:
            falha(f"GET /usuarios devolveu {r.status_code} — o esqueleto foi alterado? confira app/routers/users.py")

        r = client.get("/usuarios/stats")
        if r.status_code == 200:
            ok("core/ conectado: GET /usuarios/stats → 200")
        else:
            falha(f"GET /usuarios/stats devolveu {r.status_code}")


def main() -> None:
    print("check_setup — validando o ambiente\n")
    checa_python()
    checa_uv()
    checa_node()
    checa_backend()
    print()
    if ERROS:
        print(f"{len(ERROS)} problema(s). Corrija acima e rode de novo (docs/guias/00-setup.md ajuda).")
        sys.exit(1)
    print("tudo verde — próximos passos: make seed, make dev-back, make dev-front")


if __name__ == "__main__":
    main()
