"""add sprint_id to testcases

Revision ID: 99f7eb4f5699
Revises: 1b529c017037
Create Date: 2026-01-06 07:48:25.119366

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99f7eb4f5699'
down_revision: Union[str, None] = '1b529c017037'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add sprint_id column to testcases
    op.add_column('testcases', sa.Column('sprint_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_testcases_sprint_id'), 'testcases', ['sprint_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_testcases_sprint_id'), table_name='testcases')
    op.drop_column('testcases', 'sprint_id')
