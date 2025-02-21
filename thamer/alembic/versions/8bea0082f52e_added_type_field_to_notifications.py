"""Added type field to notifications

Revision ID: 8bea0082f52e
Revises: cb6773efd020
Create Date: 2025-02-01 18:22:20.258028

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision: str = "8bea0082f52e"
down_revision: Union[str, None] = "cb6773efd020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1️⃣ Create ENUM type before using it in the table
    notification_type_enum = sa.Enum(
        "general", "comment", "message", "system", "view", "alert", "follow", "other",
        name="notificationtype"
    )
    notification_type_enum.create(op.get_bind())  # ✅ Explicitly create ENUM type

    # 2️⃣ Now add the column using the ENUM type
    op.add_column(
        "notification",
        sa.Column("type", notification_type_enum, nullable=False, server_default="general")
    )


def downgrade() -> None:
    # 1️⃣ Drop the column first
    op.drop_column("notification", "type")

    # 2️⃣ Drop the ENUM type after column removal
    sa.Enum(name="notificationtype").drop(op.get_bind())  # ✅ Safely removes ENUM type
