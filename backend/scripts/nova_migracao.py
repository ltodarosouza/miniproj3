import os
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

pasta = tempfile.mkdtemp(prefix="migracao-")
os.environ["DATABASE_URL"] = f"sqlite:///{Path(pasta) / 'comparacao.db'}"

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402

if len(sys.argv) < 2 or not sys.argv[1].strip():
    sys.exit('use: make migracao m="o que mudou"')

config = Config(str(RAIZ / "alembic.ini"))
command.upgrade(config, "head")
command.revision(config, message=sys.argv[1], autogenerate=True)
