"""create_subscription_and_plan_tables

Revision ID: e7f8a9b0c1d2
Revises: a2b1c3d4e5f6
Create Date: 2026-09-03 16:36:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, Sequence[str], None] = 'a2b1c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. subscription_plans
    if 'subscription_plans' not in existing_tables:
        op.create_table(
            'subscription_plans',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('name', sa.String(100), nullable=False, unique=True),
            sa.Column('target_audience', sa.String(50), nullable=False, server_default='all'),
            sa.Column('category', sa.String(50), nullable=False, server_default='عام'),
            sa.Column('status', sa.String(20), nullable=False, server_default='active'),
            sa.Column('badge', sa.String(50), nullable=True),
            sa.Column('badge_color', sa.String(30), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('features', postgresql.JSON(as_json_content=True), nullable=True),
            sa.Column('quotas', postgresql.JSON(as_json_content=True), nullable=True),
            sa.Column('current_version', sa.String(20), nullable=False, server_default='v1.0'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'))
        )

    # 2. subscription_plan_cycles
    if 'subscription_plan_cycles' not in existing_tables:
        op.create_table(
            'subscription_plan_cycles',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscription_plans.id', ondelete='CASCADE'), nullable=False),
            sa.Column('cycle_name', sa.String(50), nullable=False),
            sa.Column('price', sa.Numeric(10, 2), nullable=False),
            sa.Column('discount_percent', sa.Integer(), server_default='0'),
            sa.Column('duration_days', sa.Integer(), nullable=False, server_default='30'),
            sa.Column('is_popular', sa.Boolean(), server_default='false'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'))
        )

    # 3. subscription_plan_versions
    if 'subscription_plan_versions' not in existing_tables:
        op.create_table(
            'subscription_plan_versions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscription_plans.id', ondelete='CASCADE'), nullable=False),
            sa.Column('version_code', sa.String(20), nullable=False),
            sa.Column('snapshot_data', postgresql.JSON(as_json_content=True), nullable=False),
            sa.Column('change_log', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'))
        )

    # 4. user_subscriptions
    if 'user_subscriptions' not in existing_tables:
        op.create_table(
            'user_subscriptions',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscription_plans.id', ondelete='SET NULL'), nullable=True),
            sa.Column('cycle', sa.String(50), nullable=False, server_default='شهري'),
            sa.Column('status', sa.String(30), nullable=False, server_default='active'),
            sa.Column('start_date', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('end_date', sa.DateTime(), nullable=False),
            sa.Column('auto_renew', sa.Boolean(), server_default='true'),
            sa.Column('applied_version', sa.String(20), server_default='v1.0'),
            sa.Column('consultations_quota', sa.Integer(), server_default='0'),
            sa.Column('consultations_used', sa.Integer(), server_default='0'),
            sa.Column('ai_quota', sa.Integer(), server_default='0'),
            sa.Column('ai_used', sa.Integer(), server_default='0'),
            sa.Column('tax_forms_quota', sa.Integer(), server_default='0'),
            sa.Column('tax_forms_used', sa.Integer(), server_default='0'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'))
        )

    # 5. subscription_usage_logs
    if 'subscription_usage_logs' not in existing_tables:
        op.create_table(
            'subscription_usage_logs',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('subscription_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_subscriptions.id', ondelete='CASCADE'), nullable=False),
            sa.Column('quota_type', sa.String(50), nullable=False),
            sa.Column('amount_used', sa.Integer(), server_default='1'),
            sa.Column('note', sa.String(255), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'))
        )

    # 6. subscription_timelines
    if 'subscription_timelines' not in existing_tables:
        op.create_table(
            'subscription_timelines',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('subscription_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_subscriptions.id', ondelete='CASCADE'), nullable=False),
            sa.Column('event_type', sa.String(50), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('performed_by', sa.String(100), server_default='النظام'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'))
        )

    # 7. subscription_requests
    if 'subscription_requests' not in existing_tables:
        op.create_table(
            'subscription_requests',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('target_plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscription_plans.id', ondelete='CASCADE'), nullable=False),
            sa.Column('cycle', sa.String(50), nullable=False, server_default='شهري'),
            sa.Column('request_type', sa.String(50), nullable=False, server_default='upgrade'),
            sa.Column('status', sa.String(30), nullable=False, server_default='pending'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('reviewed_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'))
        )

    # 8. subscription_orders
    if 'subscription_orders' not in existing_tables:
        op.create_table(
            'subscription_orders',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscription_plans.id', ondelete='CASCADE'), nullable=False),
            sa.Column('order_number', sa.String(50), nullable=False, unique=True),
            sa.Column('amount', sa.Numeric(10, 2), nullable=False),
            sa.Column('cycle', sa.String(50), nullable=False, server_default='شهري'),
            sa.Column('payment_method', sa.String(50), server_default='بطاقة بنكية'),
            sa.Column('payment_status', sa.String(30), server_default='paid'),
            sa.Column('invoice_id', sa.String(100), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'))
        )


def downgrade() -> None:
    op.drop_table('subscription_orders')
    op.drop_table('subscription_requests')
    op.drop_table('subscription_timelines')
    op.drop_table('subscription_usage_logs')
    op.drop_table('user_subscriptions')
    op.drop_table('subscription_plan_versions')
    op.drop_table('subscription_plan_cycles')
    op.drop_table('subscription_plans')
