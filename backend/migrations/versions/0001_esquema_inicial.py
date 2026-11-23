from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('habilidades',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nome', sa.String(length=60), nullable=False),
    sa.Column('categoria', sa.String(length=20), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('habilidades', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_habilidades_nome'), ['nome'], unique=True)

    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=30), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('bio', sa.String(length=280), nullable=False),
    sa.Column('avatar_url', sa.String(length=300), nullable=False),
    sa.Column('password_hash', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_username'), ['username'], unique=True)

    op.create_table('follows',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('seguidor_id', sa.Integer(), nullable=False),
    sa.Column('seguido_id', sa.Integer(), nullable=False),
    sa.Column('em', sa.DateTime(), nullable=False),
    sa.CheckConstraint('seguidor_id <> seguido_id', name='ck_follows_nao_si_mesmo'),
    sa.ForeignKeyConstraint(['seguido_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['seguidor_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('seguidor_id', 'seguido_id', name='uq_follows_par')
    )
    with op.batch_alter_table('follows', schema=None) as batch_op:
        batch_op.create_index('ix_follows_seguido_em', ['seguido_id', 'em'], unique=False)
        batch_op.create_index('ix_follows_seguidor_em', ['seguidor_id', 'em'], unique=False)

    op.create_table('mensagens',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('de_id', sa.Integer(), nullable=False),
    sa.Column('para_id', sa.Integer(), nullable=False),
    sa.Column('texto', sa.String(length=1000), nullable=False),
    sa.Column('em', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['de_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['para_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('mensagens', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_mensagens_de_id'), ['de_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_mensagens_em'), ['em'], unique=False)
        batch_op.create_index('ix_mensagens_par', ['de_id', 'para_id', 'id'], unique=False)
        batch_op.create_index(batch_op.f('ix_mensagens_para_id'), ['para_id'], unique=False)

    op.create_table('posts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('autor_id', sa.Integer(), nullable=False),
    sa.Column('texto', sa.String(length=1000), nullable=False),
    sa.Column('habilidade_id', sa.Integer(), nullable=True),
    sa.Column('minutos_estudados', sa.Integer(), nullable=True),
    sa.Column('imagem_url', sa.String(length=300), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['autor_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['habilidade_id'], ['habilidades.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_posts_autor_id'), ['autor_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_posts_created_at'), ['created_at'], unique=False)

    op.create_table('sessions',
    sa.Column('token', sa.String(length=64), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('token')
    )
    op.create_table('trocas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('proposta_por_id', sa.Integer(), nullable=False),
    sa.Column('com_id', sa.Integer(), nullable=False),
    sa.Column('data_hora', sa.DateTime(), nullable=False),
    sa.Column('link_meet', sa.String(length=300), nullable=False),
    sa.Column('habilidade_ensino_id', sa.Integer(), nullable=True),
    sa.Column('habilidade_aprendo_id', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('criada_em', sa.DateTime(), nullable=False),
    sa.Column('respondida_em', sa.DateTime(), nullable=True),
    sa.CheckConstraint("status IN ('proposta', 'confirmada', 'recusada')"),
    sa.CheckConstraint('habilidade_ensino_id IS NOT NULL OR habilidade_aprendo_id IS NOT NULL'),
    sa.ForeignKeyConstraint(['com_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['habilidade_aprendo_id'], ['habilidades.id'], ),
    sa.ForeignKeyConstraint(['habilidade_ensino_id'], ['habilidades.id'], ),
    sa.ForeignKeyConstraint(['proposta_por_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('trocas', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_trocas_com_id'), ['com_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_trocas_data_hora'), ['data_hora'], unique=False)
        batch_op.create_index(batch_op.f('ix_trocas_proposta_por_id'), ['proposta_por_id'], unique=False)

    op.create_table('user_habilidades',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('usuario_id', sa.Integer(), nullable=False),
    sa.Column('habilidade_id', sa.Integer(), nullable=False),
    sa.Column('tipo', sa.String(length=20), nullable=False),
    sa.Column('nivel', sa.Integer(), nullable=False),
    sa.CheckConstraint('nivel BETWEEN 1 AND 5'),
    sa.ForeignKeyConstraint(['habilidade_id'], ['habilidades.id'], ),
    sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('usuario_id', 'habilidade_id', 'tipo')
    )
    with op.batch_alter_table('user_habilidades', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_habilidades_habilidade_id'), ['habilidade_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_user_habilidades_usuario_id'), ['usuario_id'], unique=False)

    op.create_table('avaliacoes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('troca_id', sa.Integer(), nullable=False),
    sa.Column('de_id', sa.Integer(), nullable=False),
    sa.Column('para_id', sa.Integer(), nullable=False),
    sa.Column('estrelas', sa.Integer(), nullable=False),
    sa.Column('feedback', sa.String(length=500), nullable=False),
    sa.Column('em', sa.DateTime(), nullable=False),
    sa.CheckConstraint('estrelas BETWEEN 1 AND 5'),
    sa.ForeignKeyConstraint(['de_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['para_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['troca_id'], ['trocas.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('troca_id', 'de_id')
    )
    with op.batch_alter_table('avaliacoes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_avaliacoes_de_id'), ['de_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_avaliacoes_para_id'), ['para_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_avaliacoes_troca_id'), ['troca_id'], unique=False)

    op.create_table('comentarios',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('autor_id', sa.Integer(), nullable=False),
    sa.Column('texto', sa.String(length=500), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['autor_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('comentarios', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_comentarios_post_id'), ['post_id'], unique=False)

    op.create_table('likes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('usuario_id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
    sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('usuario_id', 'post_id')
    )
    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_likes_post_id'), ['post_id'], unique=False)



def downgrade() -> None:
    with op.batch_alter_table('likes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_likes_post_id'))

    op.drop_table('likes')
    with op.batch_alter_table('comentarios', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_comentarios_post_id'))

    op.drop_table('comentarios')
    with op.batch_alter_table('avaliacoes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_avaliacoes_troca_id'))
        batch_op.drop_index(batch_op.f('ix_avaliacoes_para_id'))
        batch_op.drop_index(batch_op.f('ix_avaliacoes_de_id'))

    op.drop_table('avaliacoes')
    with op.batch_alter_table('user_habilidades', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_habilidades_usuario_id'))
        batch_op.drop_index(batch_op.f('ix_user_habilidades_habilidade_id'))

    op.drop_table('user_habilidades')
    with op.batch_alter_table('trocas', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_trocas_proposta_por_id'))
        batch_op.drop_index(batch_op.f('ix_trocas_data_hora'))
        batch_op.drop_index(batch_op.f('ix_trocas_com_id'))

    op.drop_table('trocas')
    op.drop_table('sessions')
    with op.batch_alter_table('posts', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_posts_created_at'))
        batch_op.drop_index(batch_op.f('ix_posts_autor_id'))

    op.drop_table('posts')
    with op.batch_alter_table('mensagens', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_mensagens_para_id'))
        batch_op.drop_index('ix_mensagens_par')
        batch_op.drop_index(batch_op.f('ix_mensagens_em'))
        batch_op.drop_index(batch_op.f('ix_mensagens_de_id'))

    op.drop_table('mensagens')
    with op.batch_alter_table('follows', schema=None) as batch_op:
        batch_op.drop_index('ix_follows_seguidor_em')
        batch_op.drop_index('ix_follows_seguido_em')

    op.drop_table('follows')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_username'))

    op.drop_table('users')
    with op.batch_alter_table('habilidades', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_habilidades_nome'))

    op.drop_table('habilidades')
