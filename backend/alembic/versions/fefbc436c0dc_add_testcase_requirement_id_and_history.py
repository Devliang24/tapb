"""add testcase requirement_id and history

Revision ID: fefbc436c0dc
Revises: 60d654665d77
Create Date: 2026-01-06 00:43:14.924824

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fefbc436c0dc'
down_revision: Union[str, None] = '60d654665d77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('testcase_history',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('testcase_id', sa.Integer(), nullable=False),
    sa.Column('field', sa.String(length=50), nullable=False),
    sa.Column('old_value', sa.String(length=255), nullable=True),
    sa.Column('new_value', sa.String(length=255), nullable=True),
    sa.Column('changed_by', sa.Integer(), nullable=False),
    sa.Column('changed_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['changed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['testcase_id'], ['testcases.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_testcase_history_id'), 'testcase_history', ['id'], unique=False)
    op.add_column('testcases', sa.Column('requirement_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_testcases_requirement_id'), 'testcases', ['requirement_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_testcases_requirement_id'), table_name='testcases')
    op.drop_column('testcases', 'requirement_id')
    op.drop_index(op.f('ix_testcase_history_id'), table_name='testcase_history')
    op.drop_table('testcase_history')
