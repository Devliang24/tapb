"""update_testcase_status_enum

Revision ID: 44cb0829a250
Revises: d7ed7b7f4d39
Create Date: 2026-01-05 11:50:32.250806

This migration updates TestCase status enum:
- Old values: normal, deprecated, draft, NORMAL, DEPRECATED, DRAFT
- New values: PASSED, FAILED, NOT_EXECUTED

Mapping:
- normal/NORMAL -> NOT_EXECUTED (reset to not executed)
- deprecated/DEPRECATED -> NOT_EXECUTED
- draft/DRAFT -> NOT_EXECUTED
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44cb0829a250'
down_revision: Union[str, None] = 'd7ed7b7f4d39'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update existing testcase statuses to new enum values
    # All old statuses map to 'NOT_EXECUTED' as a safe default
    conn = op.get_bind()
    
    # Map old values to new values (both lowercase and uppercase)
    conn.execute(sa.text("""
        UPDATE testcases 
        SET status = 'NOT_EXECUTED' 
        WHERE status IN ('normal', 'deprecated', 'draft', 'NORMAL', 'DEPRECATED', 'DRAFT', 'not_executed', 'passed', 'failed')
    """))


def downgrade() -> None:
    # Revert new statuses back to old values
    conn = op.get_bind()
    
    # Map new values back to old values
    conn.execute(sa.text("""
        UPDATE testcases 
        SET status = 'NORMAL' 
        WHERE status IN ('PASSED', 'FAILED', 'NOT_EXECUTED')
    """))
