"""add_requirement_categories

Revision ID: 249836e248c4
Revises: 44cb0829a250
Create Date: 2026-01-05 16:13:53.955007

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '249836e248c4'
down_revision: Union[str, None] = '44cb0829a250'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create requirement_categories table
    op.create_table('requirement_categories',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('order', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['parent_id'], ['requirement_categories.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_requirement_categories_id'), 'requirement_categories', ['id'], unique=False)
    
    # Add category_id to requirements
    op.add_column('requirements', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_requirements_category_id'), 'requirements', ['category_id'], unique=False)


def downgrade() -> None:
    # Drop category_id from requirements
    op.drop_index(op.f('ix_requirements_category_id'), table_name='requirements')
    op.drop_column('requirements', 'category_id')
    
    # Drop requirement_categories table
    op.drop_index(op.f('ix_requirement_categories_id'), table_name='requirement_categories')
    op.drop_table('requirement_categories')
