from alembic import op
import sqlalchemy as sa

# Revision identifiers
revision = "0224227db858"
down_revision = "8bea0082f52e"
branch_labels = None
depends_on = None

def upgrade():
    # Step 1: Drop ENUM if it already exists
    op.execute("DROP TYPE IF EXISTS notificationtype CASCADE")

    # Step 2: Create the ENUM type
    notification_type_enum = sa.Enum(
        "GENERAL", "COMMENT", "MESSAGE", "SYSTEM", "VIEW", "ALERT", "FOLLOW", "OTHER",
        name="notificationtype"
    )
    notification_type_enum.create(op.get_bind())

    # Step 3: Alter the column to use the ENUM
    op.add_column("notification", sa.Column("type", sa.String(), nullable=True))  # Add column first
    op.execute("ALTER TABLE notification ALTER COLUMN type TYPE notificationtype USING type::TEXT::notificationtype")


def downgrade():
    # Step 1: Convert ENUM column to TEXT before dropping ENUM
    op.execute("ALTER TABLE notification ALTER COLUMN type TYPE TEXT")

    # Step 2: Drop ENUM type
    op.execute("DROP TYPE IF EXISTS notificationtype CASCADE")
