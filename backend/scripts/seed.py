import random
import re
import sys
import unicodedata
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bcrypt
from faker import Faker
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc
from app.db import Base, SessionLocal, engine
import app.models  # noqa: F401
from app.models.avaliacao import Avaliacao
from app.models.comentario import Comentario
from app.models.curtida import Curtida
from app.models.follow import Follow
from app.models.habilidade import Habilidade
from app.models.mensagem import Mensagem
from app.models.post import Post
from app.models.troca import Troca
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.services.habilidades import garantir_catalogo

SENHA_SEED = "senha-forte-123"
SEMENTE = 42
TOTAL_PARES = 16

CONTAS_FIXAS = [
    ("ada", "Ada Lovelace", "a primeira a programar"),
    ("linus", "Linus Torvalds", "just for fun"),
    ("grace", "Grace Hopper", "caçadora de bugs literais"),
]

PARES_DE_TROCA = [
    ("Python", "React"),
    ("Cálculo 1", "JavaScript"),
    ("SQL", "Figma"),
    ("Git", "Álgebra Linear"),
    ("Estrutura de Dados", "CSS"),
    ("Java", "Docker"),
    ("HTML", "Algoritmos"),
    ("Linux", "TypeScript"),
    ("Física 1", "Python"),
    ("Banco de Dados", "Node.js"),
    ("React", "Cálculo 2"),
    ("Programação Orientada a Objetos", "Git"),
    ("Probabilidade e Estatística", "Pandas"),
    ("C", "Redes de Computadores"),
    ("Django", "Matemática Discreta"),
    ("Machine Learning", "Sistemas Operacionais"),
]

BIOS = [
    "no primeiro período e tentando sobreviver",
    "estudando um pouco todo dia",
    "migrando de área, aprendendo do zero",
    "monitor nas horas vagas",
    "quero montar meu primeiro projeto",
    "café, código e lista de exercícios",
    "aprendo melhor explicando para alguém",
    "foco no estágio até o fim do ano",
]

ROTINAS = [
    "Fiz {min} minutos de {hab} hoje. Travei num exercício, mas saiu.",
    "Revisão de {hab}: {min} minutos e um resumo de uma página.",
    "Primeira vez que entendi de verdade uma parte de {hab}. Foram {min} min.",
    "{min} minutos de {hab} antes da aula. Pouco, mas todo dia conta.",
    "Lista de {hab} feita ({min} min). Alguém quer comparar as respostas?",
    "Assisti uma aula de {hab} e refiz os exemplos por conta própria, {min} minutos.",
    "Hoje o {hab} venceu: {min} minutos e ainda não entendi. Amanhã eu volto.",
]

COMENTARIOS = [
    "Boa! Continua assim.",
    "Também travei nessa parte, depois me conta como resolveu.",
    "Se quiser, a gente estuda junto essa semana.",
    "Que constância!",
    "Esse resumo ajudou demais, valeu.",
]

MENSAGENS = [
    "Oi! Vi que você sabe {ensina}. Topa trocar por {aprende}?",
    "Topo sim! Quando fica bom para você?",
    "Quinta à noite? Uma hora de cada.",
    "Fechado, mando o link da chamada.",
]

FEEDBACKS = [
    "Explicou com muita paciência, recomendo.",
    "Ótima troca, aprendi mais em uma hora do que na semana.",
    "Muito didático e chegou preparado.",
    "Foi bom, mas a gente podia ter focado mais nos exercícios.",
]


def _hash(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _username(nome: str, usados: set[str]) -> str:
    sem_acento = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    partes = re.sub(r"[^a-z ]", "", sem_acento.lower()).split()
    base = "_".join([partes[0], partes[-1]])[:26] if len(partes) > 1 else partes[0]
    candidato, n = base, 2
    while candidato in usados or len(candidato) < 3:
        candidato, n = f"{base}{n}", n + 1
    usados.add(candidato)
    return candidato


def _criar_usuarios(db: Session, fake: Faker, sorteio: random.Random) -> list[User]:
    senha = _hash(SENHA_SEED)
    usados = {username for username, _, _ in CONTAS_FIXAS}
    usuarios = [
        User(username=username, name=nome, bio=bio, password_hash=senha)
        for username, nome, bio in CONTAS_FIXAS
    ]
    while len(usuarios) < TOTAL_PARES * 2:
        nome = fake.unique.first_name() + " " + fake.last_name()
        usuarios.append(
            User(
                username=_username(nome, usados),
                name=nome,
                bio=sorteio.choice(BIOS),
                password_hash=senha,
            )
        )
    db.add_all(usuarios)
    db.flush()
    return usuarios


def _marcar_habilidades(
    db: Session, usuarios: list[User], ids: dict[str, int], sorteio: random.Random
) -> dict[int, tuple[set[int], set[int]]]:
    perfis: dict[int, tuple[set[int], set[int]]] = {u.id: (set(), set()) for u in usuarios}
    for i, (sabe, quer) in enumerate(PARES_DE_TROCA):
        a, b = usuarios[2 * i], usuarios[2 * i + 1]
        perfis[a.id][0].add(ids[sabe])
        perfis[a.id][1].add(ids[quer])
        perfis[b.id][0].add(ids[quer])
        perfis[b.id][1].add(ids[sabe])

    todas = sorted(ids.values())
    for sei, quero in perfis.values():
        for _ in range(sorteio.randint(0, 2)):
            extra = sorteio.choice(todas)
            if extra not in quero:
                sei.add(extra)
        for _ in range(sorteio.randint(0, 2)):
            extra = sorteio.choice(todas)
            if extra not in sei:
                quero.add(extra)

    for usuario_id, (sei, quero) in perfis.items():
        db.add_all(
            UserHabilidade(
                usuario_id=usuario_id, habilidade_id=h, tipo="sei", nivel=sorteio.randint(2, 5)
            )
            for h in sei
        )
        db.add_all(
            UserHabilidade(usuario_id=usuario_id, habilidade_id=h, tipo="quero_aprender")
            for h in quero
        )
    return perfis


def _criar_follows(db: Session, usuarios: list[User], sorteio: random.Random) -> None:
    pares: set[tuple[int, int]] = set()
    for i in range(0, len(usuarios), 2):
        a, b = usuarios[i].id, usuarios[i + 1].id
        pares |= {(a, b), (b, a)}
    while len(pares) < 60:
        a, b = sorteio.sample(usuarios, 2)
        pares.add((a.id, b.id))
    agora = agora_utc()
    db.add_all(
        Follow(seguidor_id=a, seguido_id=b, em=agora - timedelta(hours=sorteio.randint(1, 500)))
        for a, b in sorted(pares)
    )


def _momento_do_dia(dia: int, sorteio: random.Random) -> datetime:
    agora = agora_utc()
    meia_noite = agora.replace(hour=0, minute=0, second=0, microsecond=0)
    if dia == 0:
        return meia_noite + (agora - meia_noite) / 2
    return meia_noite - timedelta(days=dia) + timedelta(hours=sorteio.randint(8, 20))


def _criar_posts(
    db: Session,
    usuarios: list[User],
    perfis: dict[int, tuple[set[int], set[int]]],
    nomes: dict[int, str],
    sorteio: random.Random,
) -> list[Post]:
    posts: list[Post] = []
    for indice, usuario in enumerate(usuarios):
        sei, quero = perfis[usuario.id]
        estudando = sorted(quero | sei)
        dias = range(sorteio.randint(4, 7)) if indice % 3 == 0 else sorted(
            sorteio.sample(range(14), sorteio.randint(1, 3))
        )
        for dia in dias:
            habilidade_id = sorteio.choice(estudando)
            minutos = sorteio.choice([15, 20, 25, 30, 45, 60, 90])
            posts.append(
                Post(
                    autor_id=usuario.id,
                    texto=sorteio.choice(ROTINAS).format(min=minutos, hab=nomes[habilidade_id]),
                    habilidade_id=habilidade_id,
                    minutos_estudados=minutos,
                    created_at=_momento_do_dia(dia, sorteio),
                )
            )
    db.add_all(posts)
    db.flush()
    return posts


def _criar_curtidas_e_comentarios(
    db: Session, usuarios: list[User], posts: list[Post], sorteio: random.Random
) -> None:
    agora = agora_utc()
    curtidas: set[tuple[int, int]] = set()
    while len(curtidas) < 120:
        usuario, post = sorteio.choice(usuarios), sorteio.choice(posts)
        if usuario.id != post.autor_id:
            curtidas.add((usuario.id, post.id))
    por_id = {p.id: p for p in posts}
    db.add_all(
        Curtida(
            usuario_id=u,
            post_id=p,
            created_at=min(por_id[p].created_at + timedelta(minutes=30), agora),
        )
        for u, p in sorted(curtidas)
    )
    for post in sorteio.sample(posts, 25):
        autor = sorteio.choice([u for u in usuarios if u.id != post.autor_id])
        db.add(
            Comentario(
                post_id=post.id,
                autor_id=autor.id,
                texto=sorteio.choice(COMENTARIOS),
                created_at=min(post.created_at + timedelta(hours=1), agora),
            )
        )


def _criar_conversas_e_trocas(
    db: Session, usuarios: list[User], ids: dict[str, int], sorteio: random.Random
) -> None:
    agora = agora_utc()
    for i, (sabe, quer) in enumerate(PARES_DE_TROCA[:8]):
        a, b = usuarios[2 * i], usuarios[2 * i + 1]
        inicio = agora - timedelta(days=10 - i)
        for n, modelo in enumerate(MENSAGENS):
            de, para = (a, b) if n % 2 == 0 else (b, a)
            db.add(
                Mensagem(
                    de_id=de.id,
                    para_id=para.id,
                    texto=modelo.format(ensina=quer, aprende=sabe),
                    em=inicio + timedelta(minutes=5 * n),
                )
            )

        ja_aconteceu = i < 5
        troca = Troca(
            proposta_por_id=a.id,
            com_id=b.id,
            data_hora=inicio + timedelta(days=2) if ja_aconteceu else agora + timedelta(days=i - 3),
            link_meet=f"https://meet.google.com/trl-{i:04d}-dmo",
            habilidade_ensino_id=ids[sabe],
            habilidade_aprendo_id=ids[quer],
            status="confirmada" if i != 7 else "proposta",
            criada_em=inicio + timedelta(minutes=20),
            respondida_em=inicio + timedelta(hours=2) if i != 7 else None,
        )
        db.add(troca)
        db.flush()
        if ja_aconteceu:
            db.add_all(
                Avaliacao(
                    troca_id=troca.id,
                    de_id=de.id,
                    para_id=para.id,
                    estrelas=sorteio.choice([4, 5, 5]),
                    feedback=sorteio.choice(FEEDBACKS),
                    em=troca.data_hora + timedelta(hours=3),
                )
                for de, para in ((a, b), (b, a))
            )


def seed_fake(db: Session) -> None:
    sorteio = random.Random(SEMENTE)
    fake = Faker("pt_BR")
    fake.seed_instance(SEMENTE)

    garantir_catalogo(db)
    habilidades = list(db.scalars(select(Habilidade)))
    ids = {h.nome: h.id for h in habilidades}
    nomes = {h.id: h.nome for h in habilidades}

    usuarios = _criar_usuarios(db, fake, sorteio)
    perfis = _marcar_habilidades(db, usuarios, ids, sorteio)
    _criar_follows(db, usuarios, sorteio)
    posts = _criar_posts(db, usuarios, perfis, nomes, sorteio)
    _criar_curtidas_e_comentarios(db, usuarios, posts, sorteio)
    _criar_conversas_e_trocas(db, usuarios, ids, sorteio)
    db.commit()


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(User).limit(1)):
            print("banco já tem dados: apague backend/app.db e rode de novo")
            return
        seed_fake(db)
        total = len(list(db.scalars(select(User.id))))
        print(f"seed ok: {total} usuários; senha de todos: {SENHA_SEED}")
        print("reinicie o backend para o índice de matches ler o seed")


if __name__ == "__main__":
    main()
