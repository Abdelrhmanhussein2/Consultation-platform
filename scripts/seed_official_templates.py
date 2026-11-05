import os
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from helpers.database import SessionLocal, engine
from models.users.official_template import OfficialTemplate

INITIAL_TEMPLATES = [
    {
        "code": "F-IT-IND-24",
        "title": "نموذج إقرار ضريبة الدخل للأفراد — 2024",
        "category": "ضريبة الدخل",
        "description": "النموذج الرسمي المعتمد لتقديم الإقرار السنوي لضريبة الدخل للأفراد والموظفين والمهنيين.",
        "language": "AR/EN",
        "file_type": "PDF",
        "file_size": 1258291,
        "downloads_count": 1420
    },
    {
        "code": "F-IT-CORP-24",
        "title": "نموذج إقرار ضريبة الدخل للشركات",
        "category": "ضريبة الدخل",
        "description": "الإقرار الضريبي السنوي للشركات المساهمة العامة والخاصة والشركات ذات المسؤولية المحدودة.",
        "language": "AR",
        "file_type": "PDF",
        "file_size": 2516582,
        "downloads_count": 980
    },
    {
        "code": "F-GST-M-24",
        "title": "نموذج إقرار ضريبة المبيعات الشهري",
        "category": "ضريبة المبيعات",
        "description": "نموذج الإقرار الدوري لضريبة المبيعات العامة والخاصة وجدول المخرجات والمدخلات.",
        "language": "AR",
        "file_type": "XLSX",
        "file_size": 870400,
        "downloads_count": 2150
    },
    {
        "code": "F-GST-REF",
        "title": "طلب استرداد رديات ضريبة المبيعات",
        "category": "ضريبة المبيعات",
        "description": "نموذج طلب استرداد رصيد ضريبة المبيعات الدائنة القابلة للرد قانوناً.",
        "language": "AR",
        "file_type": "PDF",
        "file_size": 1153433,
        "downloads_count": 640
    },
    {
        "code": "C-SUP-01",
        "title": "عقد توريد سلع وخدمات نموذجي",
        "category": "العقود",
        "description": "صيغة عقد توريد متكاملة ومعدّة للاستخدام المباشر وفق أحكام القانون المدني والتجاري.",
        "language": "AR",
        "file_type": "DOCX",
        "file_size": 327680,
        "downloads_count": 1890
    },
    {
        "code": "C-EMP-02",
        "title": "عقد عمل فردي غير محدد المدة",
        "category": "العقود",
        "description": "نموذج عقد عمل متوافق بالكامل مع أحكام قانون العمل الأردني وأنظمة الأجور.",
        "language": "AR",
        "file_type": "DOCX",
        "file_size": 296960,
        "downloads_count": 3120
    },
    {
        "code": "F-COMP-LLC",
        "title": "عقد تأسيس شركة ذات مسؤولية محدودة",
        "category": "الشركات",
        "description": "النموذج الرسمي المعتمد من دائرة مراقبة الشركات لتأسيس وتسجيل الشركات ذات المسؤولية المحدودة.",
        "language": "AR",
        "file_type": "PDF",
        "file_size": 1887436,
        "downloads_count": 750
    },
    {
        "code": "F-SSC-NEW",
        "title": "نموذج إشراك مؤمن عليه بالضمان الاجتماعي",
        "category": "العمل والضمان",
        "description": "نموذج تسجيل العاملين الجدد في المؤسسة العامة للضمان الاجتماعي واحتساب الأجور الخاضعة.",
        "language": "AR",
        "file_type": "PDF",
        "file_size": 972800,
        "downloads_count": 1680
    }
]

# Minimal valid dummy PDF & DOCX byte headers to prevent corruption on download
MINIMAL_PDF = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n188\n%%EOF"
MINIMAL_ZIP = b"PK\x03\x04\x14\x00\x00\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00[Content_Types].xmlPK\x05\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"

def seed_official_templates(quiet: bool = False):
    """Creates the template files and seeds initial official tax templates if table is empty."""
    os.makedirs(os.path.join("static", "templates"), exist_ok=True)
    
    # 1. Ensure table and columns exist in DB
    try:
        with engine.connect() as conn:
            conn.execute(text("COMMIT"))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS official_templates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    code VARCHAR(50),
                    title VARCHAR(255) NOT NULL,
                    description VARCHAR(500),
                    category VARCHAR(100) NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    file_size INTEGER,
                    file_type VARCHAR(50),
                    language VARCHAR(50),
                    downloads_count INTEGER NOT NULL DEFAULT 0,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    updated_by UUID,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            """))
            conn.execute(text("ALTER TABLE official_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
            conn.execute(text("ALTER TABLE official_templates ADD COLUMN IF NOT EXISTS updated_by UUID;"))
            conn.commit()
    except Exception as e:
        if not quiet:
            print(f"Warning: Could not verify official_templates table: {e}")

    # 2. Check existing count and seed if empty
    db = SessionLocal()
    try:
        count = db.query(OfficialTemplate).count()
        if count > 0:
            if not quiet:
                print(f"Official templates already seeded ({count} templates).")
            return

        for item in INITIAL_TEMPLATES:
            ext = ".pdf" if item["file_type"] == "PDF" else ".xlsx" if item["file_type"] == "XLSX" else ".docx"
            file_name = f"{item['code'].lower()}{ext}"
            rel_path = f"/static/templates/{file_name}"
            abs_path = os.path.join("static", "templates", file_name)
            
            if not os.path.exists(abs_path):
                content = MINIMAL_PDF if ext == ".pdf" else MINIMAL_ZIP
                with open(abs_path, "wb") as f:
                    f.write(content)

            tmpl = OfficialTemplate(
                id=uuid.uuid4(),
                code=item["code"],
                title=item["title"],
                description=item["description"],
                category=item["category"],
                file_path=rel_path,
                file_size=item["file_size"],
                file_type=item["file_type"],
                language=item["language"],
                downloads_count=item["downloads_count"],
                is_active=True
            )
            db.add(tmpl)
        db.commit()
        if not quiet:
            print(f"Successfully seeded {len(INITIAL_TEMPLATES)} official tax templates.")
    except Exception as e:
        db.rollback()
        if not quiet:
            print(f"Error seeding official templates: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_official_templates(quiet=False)

