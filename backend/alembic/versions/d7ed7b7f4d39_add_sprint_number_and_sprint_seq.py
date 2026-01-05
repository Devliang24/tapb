"""add_sprint_number_and_sprint_seq

Revision ID: d7ed7b7f4d39
Revises: 0df275bcfd1b
Create Date: 2026-01-05 11:27:09.008147

This migration:
1. Adds sprint_seq to projects table
2. Adds sprint_number to sprints table
3. Migrates existing entity IDs to new format:
   - Bug: B{seq}
   - Requirement: R{seq}
   - Task: T{seq}
   - TestCase: TC{seq}
   - Sprint: S{seq}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7ed7b7f4d39'
down_revision: Union[str, None] = '0df275bcfd1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(conn, table, column):
    """Check if a column exists in a table (SQLite compatible)"""
    result = conn.execute(sa.text(f"PRAGMA table_info({table})"))
    columns = [row[1] for row in result.fetchall()]
    return column in columns


def index_exists(conn, index_name):
    """Check if an index exists (SQLite compatible)"""
    result = conn.execute(sa.text(f"SELECT name FROM sqlite_master WHERE type='index' AND name='{index_name}'"))
    return result.fetchone() is not None


def upgrade() -> None:
    conn = op.get_bind()
    
    # 1. Add sprint_seq column to projects (with default 0) - skip if exists
    if not column_exists(conn, 'projects', 'sprint_seq'):
        op.add_column('projects', sa.Column('sprint_seq', sa.Integer(), nullable=False, server_default='0'))
    
    # 2. Add sprint_number column to sprints - skip if exists
    if not column_exists(conn, 'sprints', 'sprint_number'):
        op.add_column('sprints', sa.Column('sprint_number', sa.String(length=50), nullable=True))
    
    # Create index if not exists
    if not index_exists(conn, 'ix_sprints_sprint_number'):
        op.create_index(op.f('ix_sprints_sprint_number'), 'sprints', ['sprint_number'], unique=True)
    
    # 3. Migrate existing data to new ID format (using database ID for global uniqueness)
    
    # Migrate all bugs globally: B{id}
    bugs = conn.execute(sa.text('SELECT id FROM bugs ORDER BY id')).fetchall()
    for (bug_id,) in bugs:
        conn.execute(
            sa.text('UPDATE bugs SET bug_number = :num WHERE id = :id'),
            {'num': f'B{bug_id}', 'id': bug_id}
        )
    
    # Migrate all requirements globally: R{id}
    requirements = conn.execute(sa.text('SELECT id FROM requirements ORDER BY id')).fetchall()
    for (req_id,) in requirements:
        conn.execute(
            sa.text('UPDATE requirements SET requirement_number = :num WHERE id = :id'),
            {'num': f'R{req_id}', 'id': req_id}
        )
    
    # Migrate all tasks globally: T{id}
    tasks = conn.execute(sa.text('SELECT id FROM tasks ORDER BY id')).fetchall()
    for (task_id,) in tasks:
        conn.execute(
            sa.text('UPDATE tasks SET task_number = :num WHERE id = :id'),
            {'num': f'T{task_id}', 'id': task_id}
        )
    
    # Migrate all testcases globally: TC{id}
    testcases = conn.execute(sa.text('SELECT id FROM testcases ORDER BY id')).fetchall()
    for (tc_id,) in testcases:
        conn.execute(
            sa.text('UPDATE testcases SET case_number = :num WHERE id = :id'),
            {'num': f'TC{tc_id}', 'id': tc_id}
        )
    
    # Migrate all sprints globally: S{id}
    sprints = conn.execute(sa.text('SELECT id FROM sprints ORDER BY id')).fetchall()
    for (sprint_id,) in sprints:
        conn.execute(
            sa.text('UPDATE sprints SET sprint_number = :num WHERE id = :id'),
            {'num': f'S{sprint_id}', 'id': sprint_id}
        )
    
    # Update project seq counters based on max IDs
    # Get max IDs for each entity type per project
    projects = conn.execute(sa.text('SELECT id FROM projects')).fetchall()
    for (project_id,) in projects:
        # Bug seq
        max_bug = conn.execute(
            sa.text('SELECT COALESCE(MAX(id), 0) FROM bugs WHERE project_id = :pid'),
            {'pid': project_id}
        ).scalar()
        
        # Requirement seq
        max_req = conn.execute(
            sa.text('SELECT COALESCE(MAX(id), 0) FROM requirements WHERE project_id = :pid'),
            {'pid': project_id}
        ).scalar()
        
        # Task seq (through requirements)
        max_task = conn.execute(
            sa.text('''
                SELECT COALESCE(MAX(t.id), 0) FROM tasks t
                JOIN requirements r ON t.requirement_id = r.id
                WHERE r.project_id = :pid
            '''),
            {'pid': project_id}
        ).scalar()
        
        # TestCase seq
        max_tc = conn.execute(
            sa.text('SELECT COALESCE(MAX(id), 0) FROM testcases WHERE project_id = :pid'),
            {'pid': project_id}
        ).scalar()
        
        # Sprint seq
        max_sprint = conn.execute(
            sa.text('SELECT COALESCE(MAX(id), 0) FROM sprints WHERE project_id = :pid'),
            {'pid': project_id}
        ).scalar()
        
        conn.execute(
            sa.text('''
                UPDATE projects SET 
                    bug_seq = :bug_seq,
                    requirement_seq = :req_seq,
                    task_seq = :task_seq,
                    testcase_seq = :tc_seq,
                    sprint_seq = :sprint_seq
                WHERE id = :pid
            '''),
            {
                'bug_seq': max_bug,
                'req_seq': max_req,
                'task_seq': max_task,
                'tc_seq': max_tc,
                'sprint_seq': max_sprint,
                'pid': project_id
            }
        )


def downgrade() -> None:
    # Remove sprint_number index and column
    op.drop_index(op.f('ix_sprints_sprint_number'), table_name='sprints')
    op.drop_column('sprints', 'sprint_number')
    
    # Remove sprint_seq column
    op.drop_column('projects', 'sprint_seq')
    
    # Note: The ID format changes are not reversed as they are data migrations
