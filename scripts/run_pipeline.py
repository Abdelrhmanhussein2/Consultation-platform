import os
import re
import sys
import docx
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.text.paragraph import Paragraph
from docx.table import Table
from neo4j import GraphDatabase

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ==========================================
# 1. إعدادات الاتصال بـ Neo4j
# ==========================================
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "supersecretpassword2026")


# ==========================================
# 2. دوال تنظيف وتحليل النصوص
# ==========================================
def normalize_text(text: str) -> str:
    if not text:
        return ""
    eastern_digits = "٠١٢٣٤٥٦٧٨٩"
    western_digits = "0123456789"
    trans = str.maketrans(eastern_digits, western_digits)
    text = text.translate(trans)
    text = text.replace('\xa0', ' ').replace('\u200f', '').replace('\u200e', '')
    return re.sub(r'[ \t]+', ' ', text).strip()


def iter_document_blocks(doc):
    for child in doc.element.body.iterchildren():
        if isinstance(child, CT_P):
            p = Paragraph(child, doc)
            text = normalize_text(p.text)
            if text:
                yield {"type": "paragraph", "content": text}
        elif isinstance(child, CT_Tbl):
            t = Table(child, doc)
            table_rows = []
            for row in t.rows:
                cells = [normalize_text(cell.text) for cell in row.cells]
                if any(cells):
                    table_rows.append(cells)
            if table_rows:
                yield {"type": "table", "content": table_rows}


def parse_line_type(text: str):
    mat_art = re.match(r'^المادة\s*\(?(\d+)\)?(?:\s+(\d{2}-\d{2}-\d{4}|\d{4}-\d{2}-\d{2}))?(.*)', text)
    if mat_art:
        return "ARTICLE", mat_art.group(1), mat_art.group(2) or "", mat_art.group(3).strip()

    mat_clause = re.match(r'^(?:[\(\[]?([أ-ي])[\)\]\.\-\/])\s*(.*)', text)
    if mat_clause:
        return "CLAUSE", mat_clause.group(1), "", mat_clause.group(2).strip()

    mat_item = re.match(r'^(?:[\(\[]?(\d+)[\)\]\.\-\/])\s*(.*)', text)
    if mat_item:
        return "ITEM", mat_item.group(1), "", mat_item.group(2).strip()

    return "TEXT", None, "", text


# ==========================================
# 3. معالج ملفات القوانين
# ==========================================
def parse_law_file(filepath: str) -> dict:
    doc = docx.Document(filepath)
    filename = os.path.basename(filepath)

    is_base = "النسخة" in filename or "الأصلية" in filename
    suffix = "الأصلية" if is_base else "وتعديلاته"

    law_data = {
        "اسم_الملف": filename,
        "العنوان": filename.replace(".docx", "").replace("_", " "),
        "رقم_القانون": "",
        "السنة": "",
        "النوع": "نسخة أصلية" if is_base else "نسخة معدلة",
        "الجريدة": "",
        "حل_محل": "",
        "المواد": [],
        "الديباجة": []
    }

    name_match = re.search(r'رقم[_\s]*(\d+)[_\s]*لسنة[_\s]*(\d{4})', filename)
    if name_match:
        law_data["رقم_القانون"] = name_match.group(1)
        law_data["السنة"] = name_match.group(2)

    law_data["معرف"] = f"قانون_{law_data['رقم_القانون']}_{law_data['السنة']}_{suffix}"
    law_data["اسم_العرض"] = f"قانون رقم {law_data['رقم_القانون']} لسنة {law_data['السنة']} ({suffix})"

    current_article = None
    current_clause = None

    for block in iter_document_blocks(doc):
        if block["type"] == "table":
            table_summary = [" : ".join([c for c in row if c]) for row in block["content"]]
            table_text = "\n".join(table_summary)
            if current_clause and current_clause.get("البنود") is not None:
                current_clause["البنود"].append({"رقم_البند": "جدول", "نص_البند": table_text})
            elif current_article:
                current_article["نص_المادة"] += "\n" + table_text
            else:
                law_data["الديباجة"].append(table_text)
            continue

        line = block["content"]

        if not current_article:
            if "الجريدة:" in line:
                law_data["الجريدة"] = line.replace("الجريدة:", "").strip()
                continue
            if "الرقم:" in line:
                law_data["رقم_القانون"] = re.sub(r'[^\d]', '', line)
                continue
            if "السنة:" in line:
                law_data["السنة"] = re.sub(r'[^\d]', '', line)
                continue
            if "حل محل:" in line or "يحل محل:" in line:
                law_data["حل_محل"] = line.split(":", 1)[1].strip()
                continue

        line_type, key, extra, rest = parse_line_type(line)

        if line_type == "ARTICLE":
            if current_clause and current_article:
                current_article["الفقرات"].append(current_clause)
                current_clause = None
            if current_article:
                law_data["المواد"].append(current_article)
            current_article = {"رقم_المادة": key, "تاريخ_السريان": extra, "نص_المادة": rest, "الفقرات": []}

        elif line_type == "CLAUSE":
            if current_article:
                if current_clause:
                    current_article["الفقرات"].append(current_clause)
                current_clause = {"حرف_الفقرة": key, "نص_الفقرة": rest, "البنود": []}
            else:
                law_data["الديباجة"].append(line)

        elif line_type == "ITEM":
            if current_clause:
                current_clause["البنود"].append({"رقم_البند": key, "نص_البند": rest})
            elif current_article:
                if "البنود" not in current_article:
                    current_article["البنود"] = []
                current_article["البنود"].append({"رقم_البند": key, "نص_البند": rest})
            else:
                law_data["الديباجة"].append(line)

        else:
            if current_clause and current_clause["البنود"]:
                current_clause["البنود"][-1]["نص_البند"] += "\n" + line
            elif current_clause:
                current_clause["نص_الفقرة"] += "\n" + line
            elif current_article:
                current_article["نص_المادة"] += "\n" + line
            else:
                law_data["الديباجة"].append(line)

    if current_clause and current_article:
        current_article["الفقرات"].append(current_clause)
    if current_article:
        law_data["المواد"].append(current_article)

    return law_data


# ==========================================
# 4. معالج ملفات الأحكام
# ==========================================
def parse_ruling_file(filepath: str) -> dict:
    doc = docx.Document(filepath)
    filename = os.path.basename(filepath)

    ruling_data = {
        "اسم_الملف": filename,
        "العنوان": filename.replace(".docx", "").replace("_", " "),
        "رقم_الحكم": "",
        "السنة": "",
        "المحكمة": "",
        "تاريخ_الفصل": "",
        "رقم_الدعوى": "",
        "نص_الحكم": "",
        "المواد_المستند_إليها": []
    }

    name_match = re.search(r'الحكم[_\s]*رقم[_\s]*(\d+)[_\s]*لسنة[_\s]*(\d{4})', filename)
    if name_match:
        ruling_data["رقم_الحكم"] = name_match.group(1)
        ruling_data["السنة"] = name_match.group(2)

    text_parts = []
    for block in iter_document_blocks(doc):
        if block["type"] == "table":
            text_parts.append("\n".join([" | ".join(row) for row in block["content"]]))
            continue
        line = block["content"]
        text_parts.append(line)

        if not ruling_data["تاريخ_الفصل"] and ("تاريخ الفصل:" in line or "بتاريخ" in line):
            d_match = re.search(r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})', line)
            if d_match:
                ruling_data["تاريخ_الفصل"] = d_match.group(1)

        if not ruling_data["رقم_الدعوى"] and ("رقم الدعوى" in line or "رقم القضية" in line):
            c_match = re.search(r'(\d+)\s*[/]\s*(\d{4})', line)
            if c_match:
                ruling_data["رقم_الدعوى"] = f"{c_match.group(1)}/{c_match.group(2)}"

        if not ruling_data["المحكمة"]:
            for court_name in ["المحكمة الإدارية العليا", "محكمة التمييز", "محكمة البداية الضريبية", "محكمة استئناف"]:
                if court_name in line:
                    ruling_data["المحكمة"] = court_name
                    break

    full_text = "\n".join(text_parts)
    ruling_data["نص_الحكم"] = full_text

    articles_found = set()
    art_matches = re.finditer(r'(?:المادة|مادة|المواد|المادتين)\s*\(?(\d+)(?:\s*/\s*([أ-ي]))?\)?', full_text)
    for m in art_matches:
        articles_found.add(m.group(1))

    ruling_data["المواد_المستند_إليها"] = sorted(list(articles_found), key=lambda x: int(x) if x.isdigit() else 999)
    ruling_data["معرف"] = f"حكم_{ruling_data['رقم_الحكم']}_{ruling_data['السنة']}"
    return ruling_data


# ==========================================
# 5. محرك التخزين في Neo4j
# ==========================================
class Neo4jPipeline:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def clear_database(self):
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")

    def init_schema(self):
        queries = [
            "CREATE CONSTRAINT qaid_qanun IF NOT EXISTS FOR (l:`قانون`) REQUIRE l.`معرف` IS UNIQUE",
            "CREATE CONSTRAINT qaid_mada IF NOT EXISTS FOR (a:`مادة`) REQUIRE a.`معرف` IS UNIQUE",
            "CREATE CONSTRAINT qaid_taadeel IF NOT EXISTS FOR (t:`تعديل`) REQUIRE t.`معرف` IS UNIQUE",
            "CREATE CONSTRAINT qaid_faqra IF NOT EXISTS FOR (c:`فقرة`) REQUIRE c.`معرف` IS UNIQUE",
            "CREATE CONSTRAINT qaid_band IF NOT EXISTS FOR (i:`بند`) REQUIRE i.`معرف` IS UNIQUE",
            "CREATE CONSTRAINT qaid_hokm IF NOT EXISTS FOR (r:`حكم_قضائي`) REQUIRE r.`معرف` IS UNIQUE",
            "CREATE INDEX fehres_mahkama IF NOT EXISTS FOR (c:`محكمة`) ON (c.`اسم_المحكمة`)"
        ]
        with self.driver.session() as session:
            for q in queries:
                try:
                    session.run(q)
                except Exception:
                    pass

    def save_law(self, law: dict):
        with self.driver.session() as session:
            # 1. إنشاء عقدة القانون
            session.run("""
                MERGE (l:`قانون` {`معرف`: $id})
                SET l.`name` = $dn, l.`اسم` = $dn, l.`العنوان` = $title,
                    l.`رقم_القانون` = $num, l.`السنة` = $year,
                    l.`النوع` = $typ, l.`الجريدة` = $gaz,
                    l.`اسم_الملف` = $fn, l.`حل_محل` = $rep
            """, id=law["معرف"], dn=law["اسم_العرض"], title=law["العنوان"],
                 num=law["رقم_القانون"], year=law["السنة"],
                 typ=law["النوع"], gaz=law["الجريدة"], fn=law["اسم_الملف"], rep=law["حل_محل"])

            # 2. إنشاء المواد والفقرات والبنود
            for art in law["المواد"]:
                art_id = f"{law['معرف']}_مادة_{art['رقم_المادة']}"
                art_dn = f"المادة {art['رقم_المادة']}"
                session.run("""
                    MATCH (l:`قانون` {`معرف`: $lid})
                    MERGE (a:`مادة` {`معرف`: $aid})
                    SET a.`name` = $dn, a.`اسم` = $dn, a.`رقم_المادة` = $num,
                        a.`تاريخ_السريان` = $eff, a.`نص_المادة` = $txt
                    MERGE (l)-[:`يتضمن_مادة`]->(a)
                """, lid=law["معرف"], aid=art_id, dn=art_dn,
                     num=art["رقم_المادة"], eff=art["تاريخ_السريان"], txt=art["نص_المادة"])

                for cl in art.get("الفقرات", []):
                    cl_id = f"{art_id}_فقرة_{cl['حرف_الفقرة']}"
                    cl_dn = f"فقرة ({cl['حرف_الفقرة']})"
                    session.run("""
                        MATCH (a:`مادة` {`معرف`: $aid})
                        MERGE (c:`فقرة` {`معرف`: $cid})
                        SET c.`name` = $dn, c.`اسم` = $dn,
                            c.`حرف_الفقرة` = $let, c.`نص_الفقرة` = $txt
                        MERGE (a)-[:`يتضمن_فقرة`]->(c)
                    """, aid=art_id, cid=cl_id, dn=cl_dn,
                         let=cl["حرف_الفقرة"], txt=cl["نص_الفقرة"])

                    for it in cl.get("البنود", []):
                        it_id = f"{cl_id}_بند_{it['رقم_البند']}"
                        it_dn = f"بند ({it['رقم_البند']})"
                        session.run("""
                            MATCH (c:`فقرة` {`معرف`: $cid})
                            MERGE (i:`بند` {`معرف`: $iid})
                            SET i.`name` = $dn, i.`اسم` = $dn,
                                i.`رقم_البند` = $num, i.`نص_البند` = $txt
                            MERGE (c)-[:`يتضمن_بند`]->(i)
                        """, cid=cl_id, iid=it_id, dn=it_dn,
                             num=it["رقم_البند"], txt=it["نص_البند"])

                for it in art.get("البنود", []):
                    it_id = f"{art_id}_بند_{it['رقم_البند']}"
                    it_dn = f"بند ({it['رقم_البند']})"
                    session.run("""
                        MATCH (a:`مادة` {`معرف`: $aid})
                        MERGE (i:`بند` {`معرف`: $iid})
                        SET i.`name` = $dn, i.`اسم` = $dn,
                            i.`رقم_البند` = $num, i.`نص_البند` = $txt
                        MERGE (a)-[:`يتضمن_بند`]->(i)
                    """, aid=art_id, iid=it_id, dn=it_dn,
                         num=it["رقم_البند"], txt=it["نص_البند"])

    def link_law_amendments(self, base_law: dict, amended_law: dict):
        with self.driver.session() as session:
            # ربط القانون المعدل بالقانون الأصلي بعلاقة [تعديل_على]
            session.run("""
                MATCH (l1:`قانون` {`معرف`: $id1})
                MATCH (l2:`قانون` {`معرف`: $id2})
                MERGE (l2)-[:`تعديل_على`]->(l1)
            """, id1=base_law["معرف"], id2=amended_law["معرف"])

            # ربط المواد المعدلة
            for art in amended_law["المواد"]:
                eff = art.get("تاريخ_السريان") or ""
                if eff and eff != "01-01-2015":
                    base_art_id = f"{base_law['معرف']}_مادة_{art['رقم_المادة']}"
                    mod_art_id = f"{amended_law['معرف']}_مادة_{art['رقم_المادة']}"
                    # ربط المادة الأصلية بالمادة المعدلة بعلاقة [له_تعديل] وتسميتها كتعديل
                    session.run("""
                        MATCH (a1:`مادة` {`معرف`: $aid1})
                        MATCH (a2:`مادة` {`معرف`: $aid2})
                        SET a2:تعديل
                        MERGE (a1)-[:`له_تعديل`]->(a2)
                    """, aid1=base_art_id, aid2=mod_art_id)

    def save_ruling(self, ruling: dict, law_ids: list):
        r_dn = f"حكم {ruling['رقم_الحكم']} لسنة {ruling['السنة']}"
        with self.driver.session() as session:
            session.run("""
                MERGE (r:`حكم_قضائي` {`معرف`: $id})
                SET r.`name` = $dn, r.`اسم` = $dn, r.`العنوان` = $title,
                    r.`رقم_الحكم` = $num, r.`السنة` = $year,
                    r.`رقم_الدعوى` = $case, r.`تاريخ_الفصل` = $date,
                    r.`اسم_الملف` = $fn, r.`مقتطف_الحكم` = $snip
            """, id=ruling["معرف"], dn=r_dn, title=ruling["العنوان"],
                 num=ruling["رقم_الحكم"], year=ruling["السنة"],
                 case=ruling["رقم_الدعوى"], date=ruling["تاريخ_الفصل"],
                 fn=ruling["اسم_الملف"], snip=ruling["نص_الحكم"][:1000])

            if ruling["المحكمة"]:
                session.run("""
                    MATCH (r:`حكم_قضائي` {`معرف`: $rid})
                    MERGE (c:`محكمة` {`اسم_المحكمة`: $cn})
                    SET c.`name` = $cn, c.`اسم` = $cn
                    MERGE (r)-[:`صادر_عن`]->(c)
                """, rid=ruling["معرف"], cn=ruling["المحكمة"])

            # الربط بالقوانين الموجودة
            for lid in law_ids:
                session.run("""
                    MATCH (r:`حكم_قضائي` {`معرف`: $rid})
                    MATCH (l:`قانون` {`معرف`: $lid})
                    MERGE (r)-[:`استند_إلى_قانون`]->(l)
                """, rid=ruling["معرف"], lid=lid)

                # الربط بالمواد
                for art_num in ruling["المواد_المستند_إليها"]:
                    art_id = f"{lid}_مادة_{art_num}"
                    session.run("""
                        MATCH (r:`حكم_قضائي` {`معرف`: $rid})
                        MATCH (a:`مادة` {`معرف`: $aid})
                        MERGE (r)-[:`استند_إلى_مادة`]->(a)
                    """, rid=ruling["معرف"], aid=art_id)


# ==========================================
# 6. نقطة الانطلاق الرئيسية
# ==========================================
def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "data"
    print("[*] تشغيل الـ Pipeline على: " + os.path.abspath(target_dir))

    pipeline = Neo4jPipeline(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    try:
        print("[*] مسح قاعدة البيانات وبناء الفهارس والقيود...")
        pipeline.clear_database()
        pipeline.init_schema()

        files = [f for f in os.listdir(target_dir) if f.endswith(".docx") and not f.startswith("~$")]
        print(f"[*] تم العثور على {len(files)} ملفات في المجلد:\n" + "\n".join([f"  - {f}" for f in files]))

        law_files = [f for f in files if "قانون" in f]
        ruling_files = [f for f in files if "الحكم" in f or "حكم" in f]

        parsed_laws = []
        base_law = None
        amended_law = None

        # معالجة وتخزين كل ملف قانون كعقدة قانون ومواده وفقراته وبنوده
        for lf in law_files:
            filepath = os.path.join(target_dir, lf)
            print(f"\n[+] معالجة قانون: {lf}")
            ldata = parse_law_file(filepath)
            pipeline.save_law(ldata)
            parsed_laws.append(ldata)
            if "النسخة" in lf or "الأصلية" in lf:
                base_law = ldata
            else:
                amended_law = ldata
            print(f"    - المعرف: {ldata['معرف']}")
            print(f"    - الاسم: {ldata['اسم_العرض']}")
            print(f"    - عدد المواد: {len(ldata['المواد'])}")

        # ربط القانونين ببعضهما وربط المواد المعدلة بالأصلية
        if base_law and amended_law:
            print("\n[+] ربط النسخة المعدلة بالنسخة الأصلية ومواد التعديل...")
            pipeline.link_law_amendments(base_law, amended_law)

        # معالجة الأحكام وربطها بالقوانين والمواد
        all_law_ids = [l["معرف"] for l in parsed_laws]
        for rf in ruling_files:
            filepath = os.path.join(target_dir, rf)
            print(f"\n[+] معالجة حكم قضائي: {rf}")
            ruling_data = parse_ruling_file(filepath)
            print(f"    - المحكمة: {ruling_data['المحكمة']}")
            print(f"    - رقم الحكم: {ruling_data['رقم_الحكم']} لسنة {ruling_data['السنة']}")
            print(f"    - المواد المستند إليها: {ruling_data['المواد_المستند_إليها']}")
            pipeline.save_ruling(ruling_data, all_law_ids)

        print("\n✨ تم تنفيذ الـ Pipeline بنجاح وتخزين القانونين وكافة موادهما والأحكام في Neo4j!")

    finally:
        pipeline.close()


if __name__ == "__main__":
    main()
