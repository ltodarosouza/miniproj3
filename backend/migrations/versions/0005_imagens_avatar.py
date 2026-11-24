from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('imagens_avatar',
    sa.Column('nome', sa.String(length=40), nullable=False),
    sa.Column('usuario_id', sa.Integer(), nullable=False),
    sa.Column('tipo', sa.String(length=20), nullable=False),
    sa.Column('conteudo', sa.LargeBinary(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['usuario_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('nome')
    )
    with op.batch_alter_table('imagens_avatar', schema=None) as batch_op:
        batch_op.create_index('ix_imagens_avatar_usuario_id', ['usuario_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('imagens_avatar', schema=None) as batch_op:
        batch_op.drop_index('ix_imagens_avatar_usuario_id')

    op.drop_table('imagens_avatar')
