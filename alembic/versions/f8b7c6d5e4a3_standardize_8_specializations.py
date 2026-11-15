"""standardize exact 8 specializations and delete extras

Revision ID: f8b7c6d5e4a3
Revises: e1f2a3b4c5d6
Create Date: 2026-11-15 16:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f8b7c6d5e4a3'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OFFICIAL_8 = [
    (1, "ضريبي", "استشارات وتخطيط ضريبي عام"),
    (2, "ضريبة المبيعات", "استشارات ضريبة المبيعات العامة والخاصة والامتثال"),
    (3, "ضريبة الدخل", "إقرارات واستشارات وتدقيق ضريبة الدخل للأفراد والشركات"),
    (4, "جمارك", "التعريفات الجمركية، التخليص، وقوانين الجمارك"),
    (5, "مناطق حرة", "الحوافز الضريبية والأنظمة الخاصة بالمناطق الحرة والتنموية"),
    (6, "تسعير تحويلي", "سياسات التسعير التحويلي والملفات المحلية والمركزية"),
    (7, "قانوني", "الاستشارات القانونية والاعتراضات والنزاعات الضريبية"),
    (8, "تدقيق ومراجعة", "تدقيق الحسابات والتدقيق الداخلي والمراجعة المالية"),
]


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Upsert official 8 specializations
    for s_id, s_name, s_desc in OFFICIAL_8:
        existing = conn.execute(
            sa.text("SELECT id FROM specializations WHERE id = :id"),
            {"id": s_id}
        ).fetchone()

        if existing:
            conn.execute(
                sa.text("UPDATE specializations SET name = :name, description = :desc WHERE id = :id"),
                {"id": s_id, "name": s_name, "desc": s_desc}
            )
        else:
            conn.execute(
                sa.text("INSERT INTO specializations (id, name, description) VALUES (:id, :name, :desc)"),
                {"id": s_id, "name": s_name, "desc": s_desc}
            )

    # 2. Remap foreign keys pointing to specializations with id > 8 to id 1
    # Check if tables exist before updating
    inspector = sa.inspect(conn)
    existing_tables = set(inspector.get_table_names())

    tables_and_columns = [
        ("consultant_profiles", "main_specialization_id"),
        ("consultant_services", "specialization_id"),
        ("consultant_credentials", "specialization_id"),
        ("service_expansion_requests", "requested_specialization_id"),
    ]

    for table, col in tables_and_columns:
        if table in existing_tables:
            conn.execute(
                sa.text(f"UPDATE {table} SET {col} = 1 WHERE {col} IS NOT NULL AND {col} > 8")
            )

    # 3. Delete any specializations with id > 8
    conn.execute(
        sa.text("DELETE FROM specializations WHERE id > 8")
    )

    # 4. Sync sequence
    try:
        conn.execute(
            sa.text("SELECT setval('specializations_id_seq', 8, true)")
        )
    except Exception:
        pass


def downgrade() -> None:
    pass

