import argparse
import base64
from functools import lru_cache
import json
import random
import os
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bcrypt
from sqlalchemy import create_engine, delete, func, select, text
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal, engine
import app.models  # noqa: F401
from app.models.comentario import Comentario
from app.models.curtida import Curtida
from app.models.habilidade import Habilidade
from app.models.imagem_post import ImagemPost
from app.models.notificacao_entregue import NotificacaoEntregue
from app.models.post import Post
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
import seed

MODELOS = {
    "posts": Post,
    "likes": Curtida,
    "comentarios": Comentario,
    "imagens_post": ImagemPost,
    "notificacoes_entregues": NotificacaoEntregue,
}


@lru_cache(maxsize=1)
def usernames_do_seed() -> frozenset[str]:
    motor = create_engine("sqlite://")
    Base.metadata.create_all(motor)
    try:
        with Session(motor) as db:
            seed.seed_fake(db)
            return frozenset(db.scalars(select(User.username)))
    finally:
        motor.dispose()


def bios_do_seed() -> set[str]:
    return set(seed.BIOS) | {bio for _, _, bio, _ in seed.CONTAS_FIXAS}


def encontrar_bots(db: Session) -> list[User]:
    nomes = usernames_do_seed()
    bios = bios_do_seed()
    candidatos = db.scalars(
        select(User)
        .where((User.username.in_(nomes)) | (User.bio.in_(bios)))
        .order_by(User.id)
    )
    bots = []
    for usuario in candidatos:
        if not bcrypt.checkpw(seed.SENHA_SEED.encode(), usuario.password_hash.encode()):
            continue
        bots.append(usuario)
    return bots


def posts_do_escopo(
    db: Session, escopo: str, bots: list[User], posts_reais: list[int] = ()
) -> list[int]:
    if escopo == "todos" and posts_reais:
        raise SystemExit("--posts-reais não pode ser usado com --escopo todos")
    if escopo == "todos":
        consulta = select(Post.id)
    elif escopo == "bots":
        ids = [u.id for u in bots]
        posts_reais = list(dict.fromkeys(posts_reais))
        if posts_reais:
            encontrados = list(db.execute(
                select(Post.id, Post.autor_id).where(Post.id.in_(posts_reais))
            ))
            bots_ids = {bot.id for bot in bots}
            existentes_validos = {post_id for post_id, autor_id in encontrados if autor_id not in bots_ids}
            invalidos = [post_id for post_id in posts_reais if post_id not in existentes_validos]
            if invalidos:
                raise SystemExit(f"ids inválidos em --posts-reais (inexistentes ou de bots): {invalidos}")
        consulta = select(Post.id).where(
            (Post.autor_id.in_(ids)) | (Post.id.in_(posts_reais))
        )
        if not ids and not posts_reais:
            consulta = select(Post.id).where(Post.id == -1)
    else:
        raise ValueError(f"escopo inválido: {escopo}")
    return list(db.scalars(consulta.order_by(Post.id)))


def _linhas(db: Session, modelo, post_ids: list[int]) -> list[dict]:
    if not post_ids:
        return []
    consulta = (
        select(modelo).where(modelo.id.in_(post_ids))
        if modelo is Post
        else select(modelo).where(modelo.post_id.in_(post_ids))
    )
    resultado = []
    for objeto in db.scalars(consulta):
        linha = {}
        for coluna in modelo.__table__.columns:
            valor = getattr(objeto, coluna.name)
            if modelo is ImagemPost and coluna.name == "conteudo":
                valor = base64.b64encode(valor).decode("ascii")
            elif isinstance(valor, (datetime, date)):
                valor = valor.isoformat()
            linha[coluna.name] = valor
        resultado.append(linha)
    return resultado


def fazer_backup(
    db: Session, escopo: str, bots: list[User], post_ids: list[int], caminho: Path,
    posts_reais: list[int] = (),
) -> dict:
    tabelas = {nome: _linhas(db, modelo, post_ids) for nome, modelo in MODELOS.items()}
    arquivo = {"versao": 1, "criado_em": datetime.now().astimezone().isoformat(), "escopo": escopo,
               "autores": None if escopo == "todos" else [u.id for u in bots],
               "posts_reais": list(posts_reais), "tabelas": tabelas}
    _publicar_json_exclusivo(caminho, arquivo)
    return {nome: len(linhas) for nome, linhas in tabelas.items()}


def _publicar_json_exclusivo(caminho: Path, dados: dict) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    descritor, nome_temporario = tempfile.mkstemp(
        dir=caminho.parent, prefix=caminho.name + ".", suffix=".tmp"
    )
    temporario = Path(nome_temporario)
    try:
        with os.fdopen(descritor, "w", encoding="utf-8") as destino:
            destino.write(json.dumps(dados, ensure_ascii=False, indent=1))
            destino.flush()
            os.fsync(destino.fileno())
        try:
            os.link(temporario, caminho)
        except FileExistsError as erro:
            raise SystemExit(f"o arquivo {caminho} já existe; escolha outro caminho") from erro
    finally:
        if temporario.exists():
            temporario.unlink()


def apagar_posts(db: Session, post_ids: list[int]) -> None:
    if not post_ids:
        return
    for modelo in (NotificacaoEntregue, ImagemPost, Comentario, Curtida, Post):
        db.execute(delete(modelo).where((modelo.id.in_(post_ids) if modelo is Post else modelo.post_id.in_(post_ids))))


def _dados_novos(db: Session, bots: list[User]):
    perfis = {u.id: (set(), set()) for u in bots}
    for uh in db.scalars(select(UserHabilidade).where(UserHabilidade.usuario_id.in_(perfis))):
        perfis[uh.usuario_id][0 if uh.tipo == "sei" else 1].add(uh.habilidade_id)
    nomes = {h.id: h.nome for h in db.scalars(select(Habilidade))}
    sorteio = random.Random(seed.SEMENTE)
    return sorteio, seed.gerar_posts(bots, perfis, nomes, sorteio)


def _travar_tabelas(db: Session) -> None:
    if db.bind.dialect.name == "sqlite":
        # O primeiro statement de escrita faz o SQLite reservar a escrita antes
        # das leituras do backup, impedindo que outro escritor altere o escopo.
        db.execute(text("UPDATE posts SET id = id WHERE 0 = 1"))
        return
    if db.bind.dialect.name != "postgresql":
        return
    try:
        db.execute(text("SET LOCAL lock_timeout = '30s'"))
        # Notificações leem e escrevem na mesma transação; a trava espera esse commit.
        db.execute(text(
            "LOCK TABLE posts, likes, comentarios, imagens_post, notificacoes_entregues "
            "IN ACCESS EXCLUSIVE MODE"
        ))
    except Exception as erro:
        origem = getattr(erro, "orig", None)
        sqlstate = getattr(origem, "sqlstate", None) or getattr(origem, "pgcode", None)
        if (
            "lock timeout" in str(erro).lower()
            or origem.__class__.__name__ == "LockNotAvailable"
            or sqlstate == "55P03"
        ):
            db.rollback()
            raise RuntimeError("tempo limite ao travar as tabelas; tente de novo (nada foi alterado)") from erro
        raise


def refazer(
    db: Session, escopo: str, caminho_backup: Path, posts_reais: list[int] = (),
    bots: list[User] | None = None,
) -> dict:
    caminho_novos = Path(str(caminho_backup) + ".novos.json")
    if caminho_backup.exists() or caminho_novos.exists():
        raise SystemExit(f"o backup {caminho_backup} ou {caminho_novos} já existe; escolha outro --backup")
    try:
        _travar_tabelas(db)
        bots = encontrar_bots(db) if bots is None else bots
        if not bots:
            raise SystemExit("nenhum usuário bot do seed foi encontrado; nada foi alterado")
        if escopo == "todos" and posts_reais:
            raise SystemExit("--posts-reais não pode ser usado com --escopo todos")
        ids = posts_do_escopo(db, escopo, bots, posts_reais)
        apagados = fazer_backup(db, escopo, bots, ids, caminho_backup, posts_reais)
        maior_id_post = db.scalar(select(func.max(Post.id))) or 0
        apagar_posts(db, ids)
        sorteio, novos = _dados_novos(db, bots)
        # IDs acima do banco atual evitam colisão com IDs removidos no SQLite.
        if db.bind.dialect.name == "sqlite":
            proximo_id = max(maior_id_post, 0) + 1
            for deslocamento, post in enumerate(novos):
                post.id = proximo_id + deslocamento
        db.add_all(novos)
        db.flush()
        _publicar_json_exclusivo(caminho_novos, {
            "backup": caminho_backup.name,
            "posts_novos": [_identidade(post) for post in novos],
        })
        if len(bots) >= 2 and len(novos) >= 25 and len(bots) * len(novos) > 120:
            seed.criar_curtidas_e_comentarios(db, bots, novos, sorteio)
        db.commit()
    except BaseException:
        db.rollback()
        raise
    return {"apagados": apagados, "posts_novos": len(novos), "com_foto": sum(p.imagem_url is not None for p in novos), "backup": str(caminho_backup)}


def _identidade(post: Post) -> dict:
    """O que identifica um post criado pelo aplicar: o id sozinho pode ser reaproveitado (SQLite),
    e o texto muda se o autor editar; id, autor e created_at a edição preserva."""
    return {"id": post.id, "autor_id": post.autor_id, "created_at": post.created_at.isoformat()}


def _ids_novos_que_ainda_existem(db: Session, novos: list[dict]) -> list[int]:
    if not novos:
        return []
    por_id = {item["id"]: item for item in novos}
    return [
        post.id
        for post in db.scalars(select(Post).where(Post.id.in_(por_id)))
        if _identidade(post) == por_id[post.id]
    ]


def restaurar(db: Session, caminho: Path) -> dict:
    caminho_novos = Path(str(caminho) + ".novos.json")
    if not caminho_novos.exists():
        raise SystemExit(f"não foi encontrado {caminho_novos}; restauração recusada sem a lista de posts criados (nada foi alterado)")
    try:
        _travar_tabelas(db)
        arquivo = json.loads(caminho.read_text(encoding="utf-8"))
        novos = json.loads(caminho_novos.read_text(encoding="utf-8"))["posts_novos"]
    except BaseException:
        db.rollback()
        raise
    ids_backup = [linha["id"] for linha in arquivo["tabelas"]["posts"]]
    ids_existentes = _ids_novos_que_ainda_existem(db, novos)
    colisoes = list(db.scalars(select(Post.id).where(Post.id.in_(ids_backup), Post.id.not_in(ids_existentes)))) if ids_backup else []
    if colisoes:
        db.rollback()
        raise SystemExit(f"ids do backup já pertencem a posts que não são posts_novos: {colisoes}")
    contagens = {nome: len(linhas) for nome, linhas in arquivo["tabelas"].items()}
    caminho_seguranca = caminho.with_name(
        f"{caminho.stem}.antes-de-restaurar-{datetime.now().strftime('%Y%m%d-%H%M%S')}{caminho.suffix}"
    )
    try:
        if ids_existentes:
            tabelas = {nome: _linhas(db, modelo, ids_existentes) for nome, modelo in MODELOS.items()}
            seguranca = {"versao": 1, "criado_em": datetime.now().astimezone().isoformat(),
                         "escopo": "todos", "autores": None, "posts_reais": [], "tabelas": tabelas}
            _publicar_json_exclusivo(caminho_seguranca, seguranca)
        apagar_posts(db, ids_existentes)
        for nome in ("posts", "likes", "comentarios", "imagens_post", "notificacoes_entregues"):
            modelo = MODELOS[nome]
            colunas = {c.name: c for c in modelo.__table__.columns}
            objetos = []
            for linha in arquivo["tabelas"][nome]:
                dados = {}
                for chave, valor in linha.items():
                    if nome in ("likes", "comentarios", "notificacoes_entregues") and chave == "id":
                        continue
                    if modelo is ImagemPost and chave == "conteudo":
                        valor = base64.b64decode(valor)
                    elif isinstance(valor, str) and colunas[chave].type.python_type in (datetime, date):
                        valor = colunas[chave].type.python_type.fromisoformat(valor)
                    dados[chave] = valor
                objetos.append(modelo(**dados))
            db.add_all(objetos)
            db.flush()
        if db.bind.dialect.name == "postgresql":
            for tabela in ("posts", "likes", "comentarios", "notificacoes_entregues"):
                db.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{tabela}', 'id'), "
                    f"GREATEST(COALESCE((SELECT MAX(id) FROM {tabela}), 1), "
                    f"COALESCE(pg_sequence_last_value(pg_get_serial_sequence('{tabela}', 'id')::regclass), 1)))"
                ))
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"restaurados": contagens, "backup": str(caminho),
            "backup_seguranca": str(caminho_seguranca) if ids_existentes else None}


def plano(
    db: Session, escopo: str, posts_reais: list[int] = (),
    bots: list[User] | None = None,
) -> dict:
    bots = encontrar_bots(db) if bots is None else bots
    ids = posts_do_escopo(db, escopo, bots, posts_reais)
    contagens = {nome: len(_linhas(db, modelo, ids)) for nome, modelo in MODELOS.items()}
    _, novos = _dados_novos(db, bots)
    autor_bots = {bot.id for bot in bots}
    reais = db.scalar(select(func.count(Post.id)).where(Post.id.in_(ids), Post.autor_id.not_in(autor_bots))) if ids and autor_bots else 0
    return {"banco": db.bind.url.render_as_string(hide_password=True), "bots": [u.username for u in bots],
            "posts_apagar": contagens, "posts_reais_apagar": reais or 0,
            "posts_novos": len(novos)}


def listar_reais(db: Session, bots: list[User] | None = None) -> list[dict]:
    bots = encontrar_bots(db) if bots is None else bots
    ids_bots = [bot.id for bot in bots]
    linhas = db.execute(
        select(
            Post, User.username,
            select(func.count(Curtida.id)).where(Curtida.post_id == Post.id).scalar_subquery().label("curtidas"),
            select(func.count(Comentario.id)).where(Comentario.post_id == Post.id).scalar_subquery().label("comentarios"),
        )
        .join(User, User.id == Post.autor_id)
        .where(Post.autor_id.not_in(ids_bots) if ids_bots else True)
        .order_by(Post.created_at, Post.id)
    )
    resultado = []
    for post, username, curtidas, comentarios in linhas:
        resultado.append({
            "id": post.id, "username": username, "created_at": post.created_at,
            "foto": post.imagem_url is not None, "texto": post.texto,
            "curtidas": curtidas, "comentarios": comentarios,
        })
    return resultado


def _ids_argumento(valor: str) -> list[int]:
    try:
        return [int(parte) for parte in valor.split(",") if parte]
    except ValueError as erro:
        raise argparse.ArgumentTypeError("use ids numéricos separados por vírgula") from erro


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(description="Refaz os posts dos usuários do seed com backup restaurável.")
    parser.add_argument("--escopo", choices=("bots", "todos"), default="bots")
    parser.add_argument("--aplicar", action="store_true")
    parser.add_argument("--backup", type=Path, default=Path(datetime.now().strftime("backup-posts-%Y%m%d-%H%M%S.json")))
    parser.add_argument("--restaurar", type=Path)
    parser.add_argument("--posts-reais", type=_ids_argumento, default=[])
    parser.add_argument("--listar-reais", action="store_true")
    args = parser.parse_args(argv)
    if args.escopo == "todos" and args.posts_reais:
        parser.error("--posts-reais não pode ser usado com --escopo todos")
    print(f"Banco alvo: {engine.url.render_as_string(hide_password=True)}")
    with SessionLocal() as db:
        bots = encontrar_bots(db)
        print(f"Bots encontrados: {', '.join(u.username for u in bots) or '(nenhum)'}")
        if args.listar_reais:
            for post in listar_reais(db, bots):
                horario = post["created_at"].strftime("%Y-%m-%d %H:%M")
                texto = " ".join(post["texto"].splitlines())[:70]
                foto = "foto" if post["foto"] else "sem foto"
                print(f"{post['id']} | @{post['username']} | {horario} | {foto} | {texto} | {post['curtidas']} curtidas | {post['comentarios']} comentários")
            print("nada foi alterado")
            return
        if args.restaurar:
            arquivo = json.loads(args.restaurar.read_text(encoding="utf-8"))
            resumo = {nome: len(linhas) for nome, linhas in arquivo["tabelas"].items()}
            caminho_novos = Path(str(args.restaurar) + ".novos.json")
            novos = json.loads(caminho_novos.read_text(encoding="utf-8"))["posts_novos"] if caminho_novos.exists() else []
            existentes = len(_ids_novos_que_ainda_existem(db, novos))
            if not args.aplicar:
                print(f"Linhas que voltariam: {resumo}")
                print(f"Posts novos a descartar: {existentes}; .novos.json existe: {'sim' if caminho_novos.exists() else 'não'}")
            else:
                print(restaurar(db, args.restaurar))
        else:
            nomes = usernames_do_seed()
            bios = bios_do_seed()
            candidatos = list(db.scalars(
                select(User)
                .where((User.username.in_(nomes)) | (User.bio.in_(bios)))
                .order_by(User.id)
            ))
            ids_bots = {u.id for u in bots}
            suspeitos = [u.username for u in candidatos if u.id not in ids_bots]
            if suspeitos:
                print(f"Correspondência de username/bio do seed com senha diferente (ignorados): {', '.join(suspeitos)}")
            resultado = plano(db, args.escopo, args.posts_reais, bots)
            if args.aplicar:
                print(refazer(db, args.escopo, args.backup, args.posts_reais, bots))
            else:
                print(resultado)
        if not args.aplicar:
            print("nada foi alterado: rode de novo com --aplicar")


if __name__ == "__main__":
    main()
