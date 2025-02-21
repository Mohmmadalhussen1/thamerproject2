"""Fix relationships - Add plan_id to subscription"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime

# Revision identifiers, used by Alembic
revision = 'da7406e453f1'
down_revision = '8e8f16f50108'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Step 1: Ensure there is at least one valid subscription plan
    op.execute(f"""
        INSERT INTO subscriptionplan (id, name, description, price, duration_days, is_active, created_at, updated_at)
        VALUES (1, 'Default Plan', 'Fallback plan for existing subscriptions', 10.0, 30, TRUE, '{datetime.utcnow().isoformat()}', '{datetime.utcnow().isoformat()}')
        ON CONFLICT (id) DO NOTHING;
    """)

    # Step 2: Add 'plan_id' column as NULLABLE first
    op.add_column('subscription', sa.Column('plan_id', sa.Integer(), nullable=True))

    # Step 3: Populate existing subscriptions with default plan_id=1
    op.execute("UPDATE subscription SET plan_id = 1 WHERE plan_id IS NULL;")

    # Step 4: Alter column to make it NOT NULL
    op.alter_column('subscription', 'plan_id', nullable=False)

    # Step 5: Add foreign key constraint
    op.create_foreign_key(
        "fk_subscription_plan", "subscription", "subscriptionplan",
        ["plan_id"], ["id"], ondelete="CASCADE"
    )


def downgrade() -> None:
    # Reverse the operations in case of rollback
    op.drop_constraint("fk_subscription_plan", "subscription", type_="foreignkey")
    op.drop_column("subscription", "plan_id")
