"""add cert urls to consultant_profiles

Revision ID: e1f2a3b4c5d6
Revises: d1e2f3a4b5c6
Create Date: 2026-11-15 15:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd1e2f3a4b5c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'consultant_profiles',
        sa.Column('id_proof_url', sa.String(length=500), nullable=True)
    )
    op.add_column(
        'consultant_profiles',
        sa.Column('academic_certificates_url', sa.String(length=500), nullable=True)
    )
    op.add_column(
        'consultant_profiles',
        sa.Column('professional_licenses_url', sa.String(length=500), nullable=True)
    )
    op.add_column(
        'consultant_profiles',
        sa.Column('jcpa_cert_url', sa.String(length=500), nullable=True)
    )
    op.add_column(
        'consultant_profiles',
        sa.Column('experts_society_cert_url', sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('consultant_profiles', 'experts_society_cert_url')
    op.drop_column('consultant_profiles', 'jcpa_cert_url')
    op.drop_column('consultant_profiles', 'professional_licenses_url')
    op.drop_column('consultant_profiles', 'academic_certificates_url')
    op.drop_column('consultant_profiles', 'id_proof_url')

