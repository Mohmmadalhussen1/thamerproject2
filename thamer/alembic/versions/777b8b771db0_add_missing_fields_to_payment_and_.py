"""Add missing fields to Payment and Subscription models

Revision ID: 777b8b771db0
Revises: 9653d04f0113
Create Date: 2025-02-03 13:04:01.274817

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# Revision identifiers, used by Alembic.
revision: str = '777b8b771db0'
down_revision: Union[str, None] = '9653d04f0113'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add columns with nullable=True
    op.add_column('payment', sa.Column('trans_date', sa.DateTime(), nullable=True))
    op.add_column('payment', sa.Column('failure_reason', sa.String(), nullable=True))
    op.add_column('payment', sa.Column('redirect_url', sa.String(), nullable=True))
    op.add_column('payment', sa.Column('updated_at', sa.DateTime(), nullable=True))  # Initially nullable
    op.add_column('subscription', sa.Column('updated_at', sa.DateTime(), nullable=True))  # Initially nullable

    # Step 2: Populate existing rows with a default timestamp
    now = datetime.utcnow().isoformat()  # Use UTC timestamp
    op.execute(f"UPDATE payment SET updated_at = '{now}'")
    op.execute(f"UPDATE subscription SET updated_at = '{now}'")

    # Step 3: Alter column to be NOT NULL
    op.alter_column('payment', 'updated_at', nullable=False)
    op.alter_column('subscription', 'updated_at', nullable=False)


def downgrade() -> None:
    # Remove columns in downgrade
    op.drop_column('subscription', 'updated_at')
    op.drop_column('payment', 'updated_at')
    op.drop_column('payment', 'redirect_url')
    op.drop_column('payment', 'failure_reason')
    op.drop_column('payment', 'trans_date')
