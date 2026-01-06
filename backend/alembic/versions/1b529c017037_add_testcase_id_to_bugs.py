"""add_testcase_id_to_bugs

Revision ID: 1b529c017037
Revises: fefbc436c0dc
Create Date: 2026-01-06 06:17:54.664098

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b529c017037'
down_revision: Union[str, None] = 'fefbc436c0dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bugs', sa.Column('testcase_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_bugs_testcase_id'), 'bugs', ['testcase_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_bugs_testcase_id'), table_name='bugs')
    op.drop_column('bugs', 'testcase_id')
