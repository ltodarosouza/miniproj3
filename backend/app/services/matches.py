import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.matches import indice_matches
from app.models.habilidade import Habilidade
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.schemas.match import HabilidadeComNivel, Matches, MatchOut
from app.schemas.user import UserOut


def _habilidades(
    db: Session, usuario_ids: set[int], tipo: str, filtro: set[int]
) -> dict[int, list[HabilidadeComNivel]]:
    por_usuario: dict[int, list[HabilidadeComNivel]] = {u: [] for u in usuario_ids}
    if not usuario_ids or not filtro:
        return por_usuario
    linhas = db.execute(
        select(UserHabilidade.usuario_id, Habilidade.id, Habilidade.nome, UserHabilidade.nivel)
        .join(Habilidade, Habilidade.id == UserHabilidade.habilidade_id)
        .where(
            UserHabilidade.usuario_id.in_(usuario_ids),
            UserHabilidade.tipo == tipo,
            UserHabilidade.habilidade_id.in_(filtro),
        )
        .order_by(UserHabilidade.nivel.desc(), Habilidade.nome)
    )
    for usuario_id, habilidade_id, nome, nivel in linhas:
        por_usuario[usuario_id].append(HabilidadeComNivel(id=habilidade_id, nome=nome, nivel=nivel))
    return por_usuario


def _nivel_do_meu_lado(
    db: Session, eu: int, ensinaveis: dict[int, list[HabilidadeComNivel]]
) -> dict[int, list[HabilidadeComNivel]]:
    ids = {h.id for itens in ensinaveis.values() for h in itens}
    if not ids:
        return ensinaveis
    meus_niveis = dict(
        db.execute(
            select(UserHabilidade.habilidade_id, UserHabilidade.nivel).where(
                UserHabilidade.usuario_id == eu,
                UserHabilidade.tipo == "sei",
                UserHabilidade.habilidade_id.in_(ids),
            )
        ).all()
    )
    return {
        usuario_id: sorted(
            (
                h.model_copy(update={"nivel": meus_niveis[h.id]})
                for h in itens
                if h.id in meus_niveis
            ),
            key=lambda h: (-h.nivel, h.nome),
        )
        for usuario_id, itens in ensinaveis.items()
    }


def _chave_alfabetica(nome: str) -> str:
    decomposto = unicodedata.normalize("NFKD", nome)
    return "".join(c for c in decomposto if not unicodedata.combining(c)).casefold()


def _ordenar(itens: list[MatchOut]) -> list[MatchOut]:
    return sorted(
        itens,
        key=lambda m: (-(len(m.me_ensina) + len(m.eu_ensino)), _chave_alfabetica(m.usuario.name), m.usuario.id),
    )


def listar(db: Session, eu: User) -> Matches:
    candidatos = indice_matches.pode_me_ensinar(eu.id)
    if not candidatos:
        return Matches(troca=[], pode_te_ensinar=[])
    troca_ids = indice_matches.match_de_troca(eu.id)

    usuarios = {u.id: u for u in db.scalars(select(User).where(User.id.in_(candidatos)))}
    me_ensinam = _habilidades(db, set(usuarios), "sei", indice_matches.habilidades_que_quero(eu.id))
    querem_de_mim = _nivel_do_meu_lado(
        db,
        eu.id,
        _habilidades(
            db, troca_ids & set(usuarios), "quero_aprender", indice_matches.habilidades_que_sei(eu.id)
        ),
    )

    troca: list[MatchOut] = []
    pode_te_ensinar: list[MatchOut] = []
    for usuario_id, usuario in usuarios.items():
        if not me_ensinam[usuario_id]:
            continue
        item = MatchOut(
            usuario=UserOut.model_validate(usuario),
            me_ensina=me_ensinam[usuario_id],
            eu_ensino=querem_de_mim.get(usuario_id, []),
        )
        (troca if item.eu_ensino else pode_te_ensinar).append(item)
    return Matches(troca=_ordenar(troca), pode_te_ensinar=_ordenar(pode_te_ensinar))
