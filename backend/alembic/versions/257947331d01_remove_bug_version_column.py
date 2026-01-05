"""remove_bug_version_column

Revision ID: 257947331d01
Revises: d3ada0717cc5
Create Date: 2026-01-04 22:27:34.919529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '257947331d01'
down_revision: Union[str, None] = 'd3ada0717cc5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite doesn't support DROP COLUMN directly, use batch mode
    with op.batch_alter_table('bugs') as batch_op:
        batch_op.drop_column('version')


def downgrade() -> None:
    with op.batch_alter_table('bugs') as batch_op:
        batch_op.add_column(sa.Column('version', sa.VARCHAR(length=50), nullable=True))
