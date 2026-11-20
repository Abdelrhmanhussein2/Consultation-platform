import pytest
from datetime import date
from fastapi import HTTPException
from helpers.date_filter_utils import (
    parse_and_validate_date_param,
    parse_db_date,
    extract_law_effective_date,
    extract_judgment_effective_date,
    matches_date_filter
)
from services.ai.legal_graph_service import LegalGraphService

def test_law_with_amendment_matched_by_amendment():
    """قانون له تاريخ تعديل: يُطابق بتاريخ التعديل لا بتاريخ الإصدار"""
    test_law = {
        "law_id": "TEST_law_amended",
        "title": "قانون تجريبي معدل",
        "issue_date": "30-12-2014",
        "amended_date": "01-01-2019"
    }
    eff = extract_law_effective_date(test_law)
    assert eff == date(2019, 1, 1), "يجب أن يعتمد تاريخ التعديل كـ effective date"

    # بحث عن 2019: يطابق
    r_2019 = parse_and_validate_date_param("2019")
    assert matches_date_filter(eff, r_2019, r_2019) is True

    # بحث عن 2014: لا يطابق لأن التعديل في 2019
    r_2014 = parse_and_validate_date_param("2014")
    assert matches_date_filter(eff, r_2014, r_2014) is False

def test_law_without_amendment_matched_by_issue_date():
    """قانون بلا تعديل: يُطابق بتاريخ الإصدار"""
    for empty_amended in ["—", "لا ينطبق", "لا ينطبق (نص أصلي)", None, ""]:
        test_law = {
            "law_id": "TEST_law_original",
            "title": "قانون تجريبي أصلي",
            "issue_date": "30-12-2014",
            "amended_date": empty_amended
        }
        eff = extract_law_effective_date(test_law)
        assert eff == date(2014, 12, 30), f"يجب أن يتراجع إلى تاريخ الإصدار عند amended_date={empty_amended}"

        # بحث عن 2014: يطابق
        r_2014 = parse_and_validate_date_param("2014")
        assert matches_date_filter(eff, r_2014, r_2014) is True

        # بحث عن 2019: لا يطابق
        r_2019 = parse_and_validate_date_param("2019")
        assert matches_date_filter(eff, r_2019, r_2019) is False

def test_law_without_dates_excluded_without_error():
    """قانون بلا تاريخين: لا يظهر في بحث بتاريخ ولا يخطئ ولا يرجع 500"""
    test_law = {
        "law_id": "TEST_law_no_dates",
        "title": "قانون تجريبي بلا تواريخ",
        "issue_date": None,
        "amended_date": None
    }
    eff = extract_law_effective_date(test_law)
    assert eff is None

    # عند وجود أي فلتر تاريخ: يستبعد (يرجع False) ولا يرمي Exception
    r_2020 = parse_and_validate_date_param("2020")
    assert matches_date_filter(eff, r_2020, None) is False
    assert matches_date_filter(eff, None, r_2020) is False
    assert matches_date_filter(eff, r_2020, r_2020) is False

def test_precision_levels():
    """اختبار مستويات الدقة: سنة فقط، سنة+شهر، سنة+شهر+يوم"""
    test_law = {
        "law_id": "TEST_law_precision",
        "title": "قانون الدقة",
        "issue_date": "30-12-2014",
        "amended_date": None
    }
    eff = extract_law_effective_date(test_law) # 2014-12-30

    # 1. سنة فقط
    r_y_match = parse_and_validate_date_param("2014")
    r_y_nomatch = parse_and_validate_date_param("2015")
    assert matches_date_filter(eff, r_y_match, r_y_match) is True
    assert matches_date_filter(eff, r_y_nomatch, r_y_nomatch) is False

    # 2. سنة + شهر
    r_ym_match = parse_and_validate_date_param("2014-12")
    r_ym_nomatch = parse_and_validate_date_param("2014-11")
    assert matches_date_filter(eff, r_ym_match, r_ym_match) is True
    assert matches_date_filter(eff, r_ym_nomatch, r_ym_nomatch) is False

    # 3. سنة + شهر + يوم
    r_ymd_match = parse_and_validate_date_param("2014-12-30")
    r_ymd_nomatch = parse_and_validate_date_param("2014-12-29")
    assert matches_date_filter(eff, r_ymd_match, r_ymd_match) is True
    assert matches_date_filter(eff, r_ymd_nomatch, r_ymd_nomatch) is False

def test_date_range_from_to():
    """اختبار نطاق من/إلى"""
    eff = date(2016, 6, 15)
    r_from = parse_and_validate_date_param("2014")
    r_to = parse_and_validate_date_param("2018")
    assert matches_date_filter(eff, r_from, r_to) is True

    r_from_late = parse_and_validate_date_param("2017")
    assert matches_date_filter(eff, r_from_late, r_to) is False

def test_invalid_dates_throw_400():
    """تحقق صارم للمدخلات ورفض 400 للتواريخ غير الصحيحة"""
    invalid_inputs = [
        "2024-13",        # شهر 13
        "2024-02-31",     # 31 في فبراير
        "2023-02-29",     # 29 في فبراير لسنة غير كبيسة
        "2024-04-31",     # 31 في أبريل (30 يوم فقط)
        "1850",           # سنة خارج النطاق 1900-2100
        "not-a-date"      # نص غير صالح
    ]
    for bad in invalid_inputs:
        with pytest.raises(HTTPException) as excinfo:
            parse_and_validate_date_param(bad, "test_param")
        assert excinfo.value.status_code == 400, f"Expected 400 for {bad}, got {excinfo.value.status_code}"

def test_judgment_effective_date():
    """الأحكام القضائية: اعتماد تاريخ الحكم j.date / j.تاريخ_الفصل"""
    j_iso = {"title": "TEST_judgment", "date": "2023-04-03"}
    assert extract_judgment_effective_date(j_iso) == date(2023, 4, 3)

    j_dmy = {"title": "TEST_judgment", "تاريخ_الفصل": "09-01-2024"}
    assert extract_judgment_effective_date(j_dmy) == date(2024, 1, 9)

def test_get_laws_with_live_service():
    """تشغيل فعلي عبر LegalGraphService.get_laws"""
    laws_2019 = LegalGraphService.get_laws(date_from="2019", date_to="2019")
    ids_2019 = [l["law_id"] for l in laws_2019]
    assert "قانون_34_2014_وتعديلاته" in ids_2019
    assert "قانون_34_2014_الأصلية" not in ids_2019

    laws_2014 = LegalGraphService.get_laws(date_from="2014", date_to="2014")
    ids_2014 = [l["law_id"] for l in laws_2014]
    assert "قانون_34_2014_الأصلية" in ids_2014
    assert "قانون_34_2014_وتعديلاته" not in ids_2014


def test_version_status_and_legal_status_separation():
    """التحقق من الفصل التام بين نوع النسخة والحالة القانونية ونوع التشريع وأولوية الشارات"""
    laws = LegalGraphService.get_laws()
    by_id = {l["law_id"]: l for l in laws}

    # 1. الأصلية المستبدلة بنسخة أحدث: شارة 'معدل' (برتقالي) + حالة قانونية 'ساري' (غير ملغي)
    orig = by_id.get("قانون_34_2014_الأصلية")
    assert orig is not None
    assert orig["status"] == "معدل"
    assert orig["legal_status"] == "ساري"
    assert orig["is_superseded"] is True
    assert orig.get("doc_type") is not None

    # 2. النسخة المعدلة الحالية: شارة 'ساري' + حالة قانونية 'ساري' + نوع النسخة 'معدل'
    amended = by_id.get("قانون_34_2014_وتعديلاته")
    assert amended is not None
    assert amended["version_status"] == "معدل"
    assert amended["status"] == "ساري"
    assert amended["legal_status"] == "ساري"
    assert amended["is_superseded"] is False
    assert amended.get("doc_type") is not None

    # 3. التحقق من منطق الإلغاء إذا وجد تشريع ملغي
    repealed_laws = [l for l in laws if l.get("legal_status") == "ملغي"]
    for rep in repealed_laws:
        assert rep["status"] == "ملغي"
        assert rep["legal_status"] == "ملغي"


def test_status_filters_with_version_logic():
    """اختبار فلترة get_laws بحالات التشريع الجديدة: معدل، نسخة سابقة، ساري"""
    # 1. فلتر 'معدل' (يشمل القوانين المعدلة والأصلية المستبدلة)
    laws_amended = LegalGraphService.get_laws(status="معدل")
    ids_amended = [l["law_id"] for l in laws_amended]
    assert "قانون_34_2014_الأصلية" in ids_amended

    # 2. فلتر 'نسخة سابقة' (توافق رجعي)
    laws_superseded = LegalGraphService.get_laws(status="نسخة سابقة")
    ids_superseded = [l["law_id"] for l in laws_superseded]
    assert "قانون_34_2014_الأصلية" in ids_superseded

    # 3. فلتر 'ساري'
    laws_valid = LegalGraphService.get_laws(status="ساري")
    for l in laws_valid:
        assert l["status"] == "ساري"


def test_dynamic_doc_types():
    """التحقق من استخراج تصنيفات التشريع ديناميكياً من الأدمن/القاعدة"""
    doc_types = LegalGraphService.get_law_doc_types()
    assert isinstance(doc_types, list)
    assert len(doc_types) > 0
    # يضم تصنيفات الأدمن الأساسية
    assert "قانون" in doc_types
    assert "نظام" in doc_types
    assert "تعليمات" in doc_types

