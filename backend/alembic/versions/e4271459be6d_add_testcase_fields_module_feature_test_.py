"""add testcase fields module feature test_data actual_result

Revision ID: e4271459be6d
Revises: 99f7eb4f5699
Create Date: 2026-01-08 15:52:28.486730

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4271459be6d'
down_revision: Union[str, None] = '99f7eb4f5699'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Only add the new testcase columns (SQLite compatible)
    op.add_column('testcases', sa.Column('module', sa.String(length=200), nullable=True))
    op.add_column('testcases', sa.Column('feature', sa.String(length=200), nullable=True))
    op.add_column('testcases', sa.Column('test_data', sa.Text(), nullable=True))
    op.add_column('testcases', sa.Column('actual_result', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('testcases', 'actual_result')
    op.drop_column('testcases', 'test_data')
    op.drop_column('testcases', 'feature')
    op.drop_column('testcases', 'module')
