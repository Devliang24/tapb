"""add bug environment defect_cause version fields

Revision ID: d3ada0717cc5
Revises: 5a8db9d4d5f8
Create Date: 2026-01-04 22:19:47.903013

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3ada0717cc5'
down_revision: Union[str, None] = '5a8db9d4d5f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Only add new columns - skip SQLite-incompatible operations
    op.add_column('bugs', sa.Column('environment', sa.String(length=20), nullable=True))
    op.add_column('bugs', sa.Column('defect_cause', sa.String(length=30), nullable=True))
    op.add_column('bugs', sa.Column('version', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('bugs', 'version')
    op.drop_column('bugs', 'defect_cause')
    op.drop_column('bugs', 'environment')
