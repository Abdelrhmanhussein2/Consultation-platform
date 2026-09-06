"""add_full_create_invoice_fields

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-09-07 00:16:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('invoices')]
        
        new_cols = [
            ('payment_terms', sa.String(100)),
            ('due_date', sa.DateTime(timezone=True)),
            ('invoice_class', sa.String(100)),
            ('customer_type', sa.String(100)),
            ('tax_treatment', sa.String(100)),
            ('tax_enabled', sa.Boolean()),
            ('logo_url', sa.String(500)),
            ('seller_name', sa.String(255)),
            ('customer_name', sa.String(255)),
            ('customer_address', sa.Text()),
            ('customer_tax_number', sa.String(100)),
            ('operation_type', sa.String(100)),
            ('operation_details', postgresql.JSON(astext_type=sa.Text())),
            ('line_items', postgresql.JSON(astext_type=sa.Text())),
            ('subtotal', sa.Numeric(10, 2)),
            ('discount_total', sa.Numeric(10, 2)),
            ('tax_total', sa.Numeric(10, 2)),
            ('grand_total', sa.Numeric(10, 2)),
            ('total_words', sa.String(255)),
            ('terms_and_conditions', sa.Text()),
            ('collection_account', sa.String(100)),
            ('responsible_dept', sa.String(100)),
            ('e_invoice_id', sa.String(100)),
            ('e_invoice_status', sa.String(50)),
            ('signer_name', sa.String(255)),
            ('signature_url', sa.String(500)),
            ('is_recurring', sa.Boolean()),
            ('recurring_cycle', sa.String(50)),
            ('recurring_start_date', sa.DateTime(timezone=True)),
            ('recurring_next_date', sa.DateTime(timezone=True)),
            ('recurring_state', sa.String(50)),
        ]

        for col_name, col_type in new_cols:
            if col_name not in columns:
                kwargs = {}
                if col_name in ['tax_enabled']:
                    kwargs['server_default'] = sa.text('true')
                elif col_name in ['is_recurring']:
                    kwargs['server_default'] = sa.text('false')
                op.add_column('invoices', sa.Column(col_name, col_type, nullable=True, **kwargs))

def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if 'invoices' in inspector.get_table_names():
        columns = [c['name'] for c in inspector.get_columns('invoices')]
        cols_to_drop = [
            'payment_terms', 'due_date', 'invoice_class', 'customer_type', 'tax_treatment',
            'tax_enabled', 'logo_url', 'seller_name', 'customer_name', 'customer_address',
            'customer_tax_number', 'operation_type', 'operation_details', 'line_items',
            'subtotal', 'discount_total', 'tax_total', 'grand_total', 'total_words',
            'terms_and_conditions', 'collection_account', 'responsible_dept', 'e_invoice_id',
            'e_invoice_status', 'signer_name', 'signature_url', 'is_recurring',
            'recurring_cycle', 'recurring_start_date', 'recurring_next_date', 'recurring_state'
        ]
        for col_name in cols_to_drop:
            if col_name in columns:
                op.drop_column('invoices', col_name)
