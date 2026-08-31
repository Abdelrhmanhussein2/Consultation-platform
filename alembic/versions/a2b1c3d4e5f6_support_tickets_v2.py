"""support_tickets_v2

Revision ID: a2b1c3d4e5f6
Revises: 9a3d2449cff1
Create Date: 2026-08-31 15:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a2b1c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9a3d2449cff1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Update ticket_category and ticket_status ENUMs
    # PostgreSQL ENUM alter requires autocommit block
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE ticket_category ADD VALUE IF NOT EXISTS 'ai_assistant'")
        op.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'draft'")
        op.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'new'")
        op.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'received'")
        op.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'reviewing'")
        op.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'waiting_user'")
        op.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'escalated'")
        op.execute("ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'reopened'")

    # 2. Add columns to support_tickets table if they don't exist
    columns = [col['name'] for col in inspector.get_columns('support_tickets')]
    
    if 'ticket_number' not in columns:
        op.add_column('support_tickets', sa.Column('ticket_number', sa.String(length=20), nullable=True))
        op.create_unique_constraint('uq_support_tickets_ticket_number', 'support_tickets', ['ticket_number'])
    
    if 'sub_category' not in columns:
        op.add_column('support_tickets', sa.Column('sub_category', sa.String(length=100), nullable=True))
        
    if 'extra_fields' not in columns:
        op.add_column('support_tickets', sa.Column('extra_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # 3. Create ticket_attachments table if it doesn't exist
    tables = inspector.get_table_names()
    if 'ticket_attachments' not in tables:
        op.create_table('ticket_attachments',
            sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
            sa.Column('ticket_id', sa.UUID(), nullable=False),
            sa.Column('uploaded_by', sa.UUID(), nullable=False),
            sa.Column('filename', sa.String(length=255), nullable=False),
            sa.Column('file_path', sa.String(length=500), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('content_type', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['ticket_id'], ['support_tickets.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    
    if 'ticket_attachments' in tables:
        op.drop_table('ticket_attachments')
        
    if 'support_tickets' in tables:
        columns = [col['name'] for col in inspector.get_columns('support_tickets')]
        # Drop constraints and columns if they exist
        if 'ticket_number' in columns:
            try:
                op.drop_constraint('uq_support_tickets_ticket_number', 'support_tickets', type_='unique')
            except Exception:
                pass
            op.drop_column('support_tickets', 'ticket_number')
        if 'extra_fields' in columns:
            op.drop_column('support_tickets', 'extra_fields')
        if 'sub_category' in columns:
            op.drop_column('support_tickets', 'sub_category')
