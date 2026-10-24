"""
tests/test_legal_terms_availability.py
======================================
Automated test suite verifying the required cases against real PostgreSQL,
real Neo4j graph, and FastAPI TestClient endpoints.
"""
import sys
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from main import app
from controllers.legal_terms_controller import LegalTermsController, full_norm, verify_article_in_neo4j
from helpers.database import SessionLocal
from helpers.neo4j_db import neo4j_db
from models.ai.legal_term import LegalTerm


class TestLegalSourceAvailability(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    # 1. Valid source returned and opens the correct law, version, article
    def test_01_valid_source_returned_and_opens(self):
        res = LegalTermsController.suggest("صافي الدخل")
        self.assertTrue(res["matched"])
        self.assertTrue(res["is_direct_banner"])
        self.assertGreater(len(res["options"]), 0)
        opt = res["options"][0]
        self.assertEqual(opt["title"], "الدخل الصافي")
        self.assertEqual(opt["law_id"], "قانون_34_2014_وتعديلاته")
        self.assertEqual(opt["version_id"], "قانون_34_2014_وتعديلاته")
        self.assertEqual(opt["article_number"], 2)
        self.assertEqual(opt["source_id"], "قانون_34_2014_وتعديلاته_مادة_2")
        self.assertTrue(opt["is_openable"])
        self.assertEqual(opt["version_status"], "ساري")
        # Confirms open_url uses full stable article identifier
        self.assertIn("/regulations/law/قانون_34_2014_وتعديلاته?article=قانون_34_2014_وتعديلاته_مادة_2", opt["open_url"])

    # 2. Missing source: not returned
    def test_02_missing_source_not_returned(self):
        res = LegalTermsController.suggest("كلمة غير موجودة بتاتا في القاموس 999")
        self.assertFalse(res["matched"])
        self.assertFalse(res["is_direct_banner"])
        self.assertEqual(len(res["options"]), 0)

    # 3. Missing article: not returned
    def test_03_missing_article_not_returned(self):
        # Insert or verify an unopenable term in database
        unopenable = self.db.query(LegalTerm).filter(
            LegalTerm.is_openable == False
        ).first()
        if unopenable:
            res = LegalTermsController.suggest(unopenable.popular_term)
            returned_ids = [opt["id"] for opt in res.get("options", [])]
            self.assertNotIn(unopenable.id, returned_ids)

    # 4. Ambiguous version: not returned
    def test_04_ambiguous_version_not_returned(self):
        # Create a temporary ambiguous test record if none exists
        test_term = LegalTerm(
            popular_term="مصطلح_اختبار_ملتبس_فريد",
            legislative_term="مصطلح_تشريعي_ملتبس",
            law_name="قانون_اختبار",
            match_status="ambiguous",
            is_openable=False,
            review_status="pending",
            row_hash="test_ambiguous_hash_999",
            is_active=True
        )
        self.db.add(test_term)
        self.db.commit()

        try:
            res = LegalTermsController.suggest("مصطلح_اختبار_ملتبس_فريد")
            self.assertFalse(res["matched"])
            self.assertEqual(len(res["options"]), 0)
        finally:
            self.db.delete(test_term)
            self.db.commit()

    # 5. Review status policy: API accepts 'pending' (review_status != 'rejected') and blocks 'rejected'
    def test_05_review_status_policy_pending_allowed_rejected_blocked(self):
        # A. Confirm in database that all terms are 'pending' (no script ever wrote 'approved')
        approved_count = self.db.query(LegalTerm).filter(LegalTerm.review_status == "approved").count()
        self.assertEqual(approved_count, 0, "No terms should have review_status='approved'")

        # Confirm reviewed_by and reviewed_at are NULL for all terms
        reviewed_by_count = self.db.query(LegalTerm).filter(LegalTerm.reviewed_by.isnot(None)).count()
        self.assertEqual(reviewed_by_count, 0, "reviewed_by must be NULL")
        reviewed_at_count = self.db.query(LegalTerm).filter(LegalTerm.reviewed_at.isnot(None)).count()
        self.assertEqual(reviewed_at_count, 0, "reviewed_at must be NULL")

        # B. Confirm that valid openable 'pending' terms ARE returned by suggest
        res_pending = LegalTermsController.suggest("صافي الدخل")
        self.assertTrue(res_pending["matched"])
        self.assertGreater(len(res_pending["options"]), 0)

        # C. Confirm that setting review_status = 'rejected' blocks the suggestion
        test_rejected = LegalTerm(
            popular_term="مصطلح_اختبار_مرفوض_فريد",
            legislative_term="مصطلح_تشريعي_مرفوض",
            law_name="قانون ضريبة الدخل",
            law_id="قانون_34_2014_وتعديلاته",
            version_id="قانون_34_2014_وتعديلاته",
            neo4j_article_id="قانون_34_2014_وتعديلاته_مادة_2",
            match_status="verified",
            review_status="rejected",
            is_openable=True,  # Even if flag was true, review_status='rejected' blocks it
            row_hash="test_rejected_hash_999",
            is_active=True
        )
        self.db.add(test_rejected)
        self.db.commit()

        try:
            res = LegalTermsController.suggest("مصطلح_اختبار_مرفوض_فريد")
            returned_ids = [o["id"] for o in res.get("options", [])]
            self.assertNotIn(test_rejected.id, returned_ids)
        finally:
            self.db.delete(test_rejected)
            self.db.commit()

    # 6. The 7 'different' quotation rows: all marked pending and not openable
    def test_06_seven_different_rows_excluded(self):
        diff_ids = [67, 368, 369, 370, 371, 374, 375]
        diff_terms = self.db.query(LegalTerm).filter(LegalTerm.id.in_(diff_ids)).all()
        self.assertEqual(len(diff_terms), 7)
        for dt in diff_terms:
            self.assertFalse(dt.is_openable)
            self.assertEqual(dt.review_status, "pending")
            self.assertEqual(dt.text_match_status, "different")
            res = LegalTermsController.suggest(dt.popular_term)
            returned_ids = [o["id"] for o in res.get("options", [])]
            self.assertNotIn(dt.id, returned_ids)

    # 7. Valid term whose document is not in Diwan (e.g. "سكراب"): suppressed
    def test_07_not_in_diwan_suppressed(self):
        res = LegalTermsController.suggest("سكراب")
        self.assertFalse(res["matched"])
        self.assertFalse(res["is_direct_banner"])
        self.assertEqual(len(res["options"]), 0)

    # 8. Same article number in a different version: resolved only to recorded version
    def test_08_resolved_only_to_recorded_version(self):
        res = LegalTermsController.suggest("صافي الدخل")
        self.assertTrue(res["matched"])
        for opt in res["options"]:
            self.assertEqual(opt["version_id"], "قانون_34_2014_وتعديلاته")
            self.assertEqual(opt["version_status"], "ساري")

    # 9. The "34 vs 2" identifier test: ensures stable identifier targets article 2, NOT 34
    def test_09_stable_identifier_not_confused_with_law_number(self):
        res = LegalTermsController.suggest("صافي الدخل")
        opt = res["options"][0]
        # Full identifier must end in _مادة_2, not 34
        self.assertEqual(opt["source_id"], "قانون_34_2014_وتعديلاته_مادة_2")
        self.assertEqual(opt["article_number"], 2)
        self.assertIn("article=قانون_34_2014_وتعديلاته_مادة_2", opt["open_url"])
        self.assertNotIn("article=34", opt["open_url"])

    # 10. Layer (a) banner vs Layer (b) dropdown-only matching
    def test_10_layer_a_vs_layer_b_matching(self):
        # Layer (a): Exact/normalized match on popular term -> is_direct_banner = True
        res_a = LegalTermsController.suggest("صافي الدخل")
        self.assertTrue(res_a["matched"])
        self.assertTrue(res_a["is_direct_banner"])

        # Layer (b): Whole-word partial query (e.g. "دخل" or "راتب") -> is_direct_banner = False
        res_b = LegalTermsController.suggest("دخل", limit=5)
        self.assertTrue(res_b["matched"])
        self.assertFalse(res_b["is_direct_banner"])
        self.assertGreater(len(res_b["options"]), 0)

    # 11. Neo4j unavailable: fails closed
    def test_11_neo4j_unavailable_fail_closed(self):
        from unittest.mock import patch
        from fastapi import HTTPException
        with patch("controllers.legal_terms_controller.verify_article_in_neo4j", side_effect=HTTPException(status_code=503, detail="Simulated graph failure")):
            with self.assertRaises(HTTPException) as ctx:
                LegalTermsController.suggest("صافي الدخل")
            self.assertEqual(ctx.exception.status_code, 503)

    # 12. Real FastAPI Endpoint: /api/legal/search remains unchanged
    def test_12_real_legal_search_endpoint_unchanged(self):
        response = self.client.get("/api/legal/search", params={"query": "ضريبة الدخل"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    # 13. Real FastAPI Endpoint: /api/legal/terms/suggest returns expected contract
    def test_13_real_terms_suggest_endpoint(self):
        response = self.client.get("/api/legal/terms/suggest", params={"q": "صافي الدخل"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["matched"])
        self.assertTrue(data["is_direct_banner"])
        self.assertGreater(len(data["options"]), 0)
        opt = data["options"][0]
        self.assertIn("version_status", opt)
        self.assertIn("version_basis", opt)
        self.assertIn("open_url", opt)
        self.assertIn("قانون_34_2014_وتعديلاته_مادة_2", opt["open_url"])

    # 14. Extra: Arabic normalization cases
    def test_14_extra_arabic_normalization(self):
        res1 = LegalTermsController.suggest("صافي الدخل")
        res2 = LegalTermsController.suggest("صافى الدخل")     # ى instead of ي
        res3 = LegalTermsController.suggest("صـافي الـدخل")   # tatweel
        self.assertTrue(res1["matched"])
        self.assertTrue(res2["matched"])
        self.assertTrue(res3["matched"])
        self.assertEqual(res1["options"][0]["source_id"], res2["options"][0]["source_id"])
        self.assertEqual(res1["options"][0]["source_id"], res3["options"][0]["source_id"])

    # 15. Extra: SQL / Script Injection Safety
    def test_15_extra_sql_injection_safety(self):
        res1 = LegalTermsController.suggest("' OR 1=1 --")
        res2 = LegalTermsController.suggest("<script>alert(1)</script>")
        self.assertFalse(res1["matched"])
        self.assertFalse(res2["matched"])
        self.assertEqual(res1["options"], [])
        self.assertEqual(res2["options"], [])


if __name__ == "__main__":
    unittest.main()
