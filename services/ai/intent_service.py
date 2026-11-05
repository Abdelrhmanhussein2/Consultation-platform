from typing import Optional

def detect_advanced_intent(text: str) -> Optional[str]:
    """
    تحليل نية المستخدم واكتشاف ما إذا كان يطلب تفعيل أحد أنماط البحث المتقدم في نصه:
    - 'deep': تحليل تشريعي عميق
    - 'compare': مقارنة تشريعية
    - 'compliance': الالتزام والامتثال
    - 'consultation': استشارة ضريبية متقدمة
    """
    if not text:
        return None
    t = text.lower().strip()

    # 1. تحليل تشريعي عميق
    deep_keywords = [
        "تحليل تشريعي", "تحليل عميق", "تحليلا تشريعيا", "حلل تشريعيا", "حلل تشريعياً",
        "تحليل تشريعي عميق", "سوابق التمييز", "قرارات التمييز", "محكمة التمييز",
        "تطور الاحكام", "تطور الأحكام", "نصوص المواد وتطورها", "تتبع المادة"
    ]
    if any(k in t for k in deep_keywords):
        return "deep"

    # 2. مقارنة تشريعية
    compare_keywords = [
        "مقارنة تشريعية", "مقارنة", "قارن بين", "قارن المواد", "مقارنة النصوص",
        "الفرق بين القانونين", "الفرق بين المادتين", "قبل التعديل وبعده"
    ]
    if any(k in t for k in compare_keywords):
        return "compare"

    # 3. الالتزام والامتثال
    compliance_keywords = [
        "امتثال", "الامتثال", "الالتزام", "الالتزام والامتثال", "المواعيد القانونية",
        "الغرامات", "غرامات التأخير", "فحص الامتثال", "مواعيد الإقرار", "مهلة السداد",
        "غرامة التأخير"
    ]
    if any(k in t for k in compliance_keywords):
        return "compliance"

    # 4. طلب استشارة متقدمة
    if "بحث متقدم" in t or "استشارة متقدمة" in t:
        return "consultation"

    return None

