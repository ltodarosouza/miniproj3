from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0006'
down_revision: Union[str, Sequence[str], None] = '0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('notificacoes_entregues',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('usuario_id', sa.Integer(), nullable=False),
    sa.Column('sequencia', sa.String(length=32), nullable=False),
    sa.Column('recorte', sa.DateTime(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('dia', sa.Date(), nullable=False),
    sa.Column('em', sa.DateTime(), nullable=False),
    sa.Column('ator_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('usuario_id', 'sequencia', 'post_id', 'dia')
    )
    op.create_index('ix_notificacoes_entregues_usuario_id', 'notificacoes_entregues', ['usuario_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_notificacoes_entregues_usuario_id', table_name='notificacoes_entregues')
    op.drop_table('notificacoes_entregues')
