from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0003'
down_revision: Union[str, Sequence[str], None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('leitura_conversas',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('com_id', sa.Integer(), nullable=False),
    sa.Column('lida_em', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['com_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'com_id')
    )
    with op.batch_alter_table('mensagens', schema=None) as batch_op:
        batch_op.add_column(sa.Column('entregue_em', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('lida_em', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('cliente_id', sa.String(length=64), nullable=True))
        batch_op.create_index('uq_mensagens_de_cliente_id', ['de_id', 'cliente_id'], unique=True)



def downgrade() -> None:
    with op.batch_alter_table('mensagens', schema=None) as batch_op:
        batch_op.drop_index('uq_mensagens_de_cliente_id')
        batch_op.drop_column('cliente_id')
        batch_op.drop_column('lida_em')
        batch_op.drop_column('entregue_em')

    op.drop_table('leitura_conversas')
