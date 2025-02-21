"""Fix notification ENUM to uppercase values

Revision ID: a5e0a0655407
Revises: 0224227db858
Create Date: 2025-02-01 19:29:06.596220

"""
from alembic import op
import sqlalchemy as sa


# Revision identifiers, used by Alembic.
revision = "a5e0a0655407"
down_revision = "0224227db858"
branch_labels = None
depends_on = None


def upgrade():
    # Step 1️⃣: Temporarily change column type to TEXT
    op.execute("ALTER TABLE notification ALTER COLUMN type TYPE TEXT;")

    # Step 2️⃣: Convert lowercase values to uppercase (Safe Conversion)
    op.execute("""
        UPDATE notification
        SET type = 
            CASE 
                WHEN type = 'general' THEN 'GENERAL'
                WHEN type = 'comment' THEN 'COMMENT'
                WHEN type = 'message' THEN 'MESSAGE'
                WHEN type = 'system' THEN 'SYSTEM'
                WHEN type = 'view' THEN 'VIEW'
                WHEN type = 'alert' THEN 'ALERT'
                WHEN type = 'follow' THEN 'FOLLOW'
                WHEN type = 'other' THEN 'OTHER'
                ELSE type
            END;
    """)

    # Step 3️⃣: Drop the old ENUM type
    op.execute("DROP TYPE IF EXISTS notificationtype CASCADE;")

    # Step 4️⃣: Create a new ENUM type with uppercase values
    op.execute("""
        CREATE TYPE notificationtype AS ENUM ('GENERAL', 'COMMENT', 'MESSAGE', 'SYSTEM', 'VIEW', 'ALERT', 'FOLLOW', 'OTHER');
    """)

    # Step 5️⃣: Reapply the ENUM type to the column
    op.execute("""
        ALTER TABLE notification ALTER COLUMN type TYPE notificationtype USING type::notificationtype;
    """)

    # Step 6️⃣: Set default ENUM value
    op.execute("""
        ALTER TABLE notification ALTER COLUMN type SET DEFAULT 'GENERAL'::notificationtype;
    """)


def downgrade():
    # Step 1️⃣: Change column type back to TEXT temporarily
    op.execute("ALTER TABLE notification ALTER COLUMN type TYPE TEXT;")

    # Step 2️⃣: Drop the new ENUM type
    op.execute("DROP TYPE IF EXISTS notificationtype CASCADE;")

    # Step 3️⃣: Recreate old ENUM type with lowercase values
    op.execute("""
        CREATE TYPE notificationtype AS ENUM ('general', 'comment', 'message', 'system', 'view', 'alert', 'follow', 'other');
    """)

    # Step 4️⃣: Reapply the ENUM type to the column
    op.execute("""
        ALTER TABLE notification ALTER COLUMN type TYPE notificationtype USING type::notificationtype;
    """)

    # Step 5️⃣: Set default ENUM value
    op.execute("""
        ALTER TABLE notification ALTER COLUMN type SET DEFAULT 'general'::notificationtype;
    """)
