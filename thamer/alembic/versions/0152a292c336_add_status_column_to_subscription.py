"""Add status column to subscription

Revision ID: 0152a292c336
Revises: 0017e7df1218
Create Date: 2024-12-22 11:19:48.030359

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM


# revision identifiers, used by Alembic.
revision = '0152a292c336'
down_revision = '0017e7df1218'
branch_labels = None
depends_on = None


def upgrade():
    # Create the subscriptionstatus enum type
    subscription_status_enum = ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', name='subscriptionstatus', create_type=True)
    subscription_status_enum.create(op.get_bind())

    # Add the 'status' column to the 'subscription' table
    op.add_column(
        'subscription',
        sa.Column(
            'status',
            sa.Enum('ACTIVE', 'SUSPENDED', 'EXPIRED', name='subscriptionstatus'),
            nullable=False,
            server_default='ACTIVE'
        )
    )

    # Add 'is_active' column to the 'company' table with a default value
    op.add_column('company', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))

    # Remove the server default for 'is_active' after populating existing rows
    op.alter_column('company', 'is_active', server_default=None)


def downgrade():
    # Drop the 'status' column from the 'subscription' table
    op.drop_column('subscription', 'status')

    # Drop the 'is_active' column from the 'company' table
    op.drop_column('company', 'is_active')

    # Drop the subscriptionstatus enum type
    subscription_status_enum = ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', name='subscriptionstatus', create_type=True)
    subscription_status_enum.drop(op.get_bind())
