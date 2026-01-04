"""add_is_public_to_projects

Revision ID: 29cb5453617e
Revises: 750c5a29ec08
Create Date: 2026-01-04 16:57:44.826792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '29cb5453617e'
down_revision: Union[str, None] = '750c5a29ec08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_public column to projects table
    op.add_column('projects', sa.Column('is_public', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('projects', 'is_public')
