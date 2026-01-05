"""add requirement_history table

Revision ID: 4fef06942c10
Revises: 249836e248c4
Create Date: 2026-01-06 00:00:26.897752

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fef06942c10'
down_revision: Union[str, None] = '249836e248c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 只创建 requirement_history 表
    op.create_table('requirement_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('requirement_id', sa.Integer(), nullable=False),
    sa.Column('field', sa.String(length=50), nullable=False),
    sa.Column('old_value', sa.String(length=255), nullable=True),
    sa.Column('new_value', sa.String(length=255), nullable=True),
    sa.Column('changed_by', sa.Integer(), nullable=False),
    sa.Column('changed_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_requirement_history_id'), 'requirement_history', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_requirement_history_id'), table_name='requirement_history')
    op.drop_table('requirement_history')
