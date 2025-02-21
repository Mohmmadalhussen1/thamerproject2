"""Make fields required in Company model

Revision ID: ab52c3782a83
Revises: 25e1025b1a65
Create Date: 2025-01-05 13:45:14.955748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab52c3782a83'
down_revision: Union[str, None] = '25e1025b1a65'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Set default values for existing NULL rows
    op.execute("UPDATE company SET last_year_local_score = 0.0 WHERE last_year_local_score IS NULL")
    op.execute("UPDATE company SET local_content_certificate = '' WHERE local_content_certificate IS NULL")
    
    # Alter columns to make them NOT NULL
    op.alter_column('company', 'last_year_local_score',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=False)
    op.alter_column('company', 'local_content_certificate',
               existing_type=sa.VARCHAR(),
               nullable=False)


def downgrade() -> None:
    # Revert NOT NULL constraints
    op.alter_column('company', 'local_content_certificate',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('company', 'last_year_local_score',
               existing_type=sa.DOUBLE_PRECISION(precision=53),
               nullable=True)
