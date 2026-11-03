"""
services/ai/prompts.py
ملف مركزي ومستقل لكافة برومبتس الذكاء الاصطناعي في منصة ديوان.
يحتوي على:
1. البرومبتس الافتراضية لأزرار البحث المتقدم وأنماط الاستشارة.
2. برومبتس الشات العام، الرد المباشر، واقتراح ردود المستشارين.
3. إدارة تخزين واسترجاع البرومبتس المعدلة من قبل الأدمن لضمان تطبيقها مباشرة.
"""

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from helpers.database import SessionLocal


# ── 1. البرومبتس الافتراضية لأزرار البحث المتقدم ───────────────────
DEFAULT_ADVANCED_BUTTONS: List[Dict[str, Any]] = [
    {
        "id": "btn-1",
        "orderNum": 1,
        "type": "زر بحث متقدم",
        "mode_key": "consultation",
        "relatedSearchText": "استشارة",
        "title": "استشارة ضريبية",
        "tag": "استشارة",
        "isActive": True,
        "description": "إجابة استشارية عملية مباشرة على السؤال الضريبي",
        "generalPrompt": (
            "أجب كمستشار ضريبي أردني خبير: قدّم إجابة عملية مباشرة مدعومة بالمواد القانونية النافذة بدقة تامة في النسب والأرقام، "
            "مع مراعاة صفة الأطراف (مقيم أو غير مقيم، وشخص طبيعي أو اعتباري)، مع خطوات تطبيقية واضحة للمكلف."
        ),
        "formatPrompt": (
            "استشارة متقدمة قائمة على اتخاذ القرار، أقسام الإجابة بالترتيب:\n"
            "1. ملخص الحالة والقرار المباشر\n"
            "2. التكييف الضريبي والبدائل مع تطبيق النصوص على الوقائع\n"
            "3. أثر كل بديل والمخاطر الضريبية\n"
            "4. الإسناد المرجعي (المواد والأنظمة وتواريخ السريان)\n"
            "5. التوصية وخطوات التنفيذ العملية للمكلف."
        ),
        "clarificationPrompt": "عند نقص الوقائع المؤثرة اسأل عن صفة المكلف وطبيعة المعاملة وتاريخها، والهدف من القرار والبدائل المتاحة وأثرها المالي.",
        "followupPrompt": "ولّد ثلاثة أسئلة متابعة خاصة بالحالة حول أثر البديل الآخر، تغير ظرف مؤثر، وخطوات تنفيذ القرار."
    },
    {
        "id": "btn-2",
        "orderNum": 2,
        "type": "زر بحث متقدم",
        "mode_key": "deep",
        "relatedSearchText": "تحليل عميق",
        "title": "تحليل تشريعي عميق",
        "tag": "تحليل عميق",
        "isActive": True,
        "description": "تحليل معمّق للنصوص التشريعية والتفسيرات",
        "generalPrompt": (
            "حلّل الموضوع تحليلاً تشريعياً معمّقاً: اعرض النصوص ذات الصلة، وتطور الأحكام عبر التعديلات، "
            "وسوابق التطبيق، ثم استخلص الموقف القانوني الراجح مع ذكر الاستثناءات والحالات الحدّية."
        ),
        "formatPrompt": (
            "تحليل قانوني تفصيلي موثق بالأسانيد:\n"
            "1. استعراض النصوص التشريعية الحاكمة\n"
            "2. التفسير الفقهي والقضائي المقارن\n"
            "3. السوابق القضائية وأحكام محكمة التمييز\n"
            "4. الرأي القانوني والضريبي الراجح ومآلات التطبيق."
        ),
        "clarificationPrompt": "اسأل عن تاريخ الواقعة المالي، والقانون الساري في تلك السنة المحددة.",
        "followupPrompt": "اقترح أسئلة حول قرارات المحاكم التمييزية أو التفسيرية المرتبطة."
    },
    {
        "id": "btn-3",
        "orderNum": 3,
        "type": "زر بحث متقدم",
        "mode_key": "compare",
        "relatedSearchText": "مقارنة",
        "title": "مقارنة تشريعية",
        "tag": "مقارنة",
        "isActive": True,
        "description": "مقارنة بين مواد أو أنظمة أو نسخ تشريعية",
        "generalPrompt": (
            "قارن بين الأحكام التشريعية ذات الصلة: حدّد أوجه التشابه والاختلاف بين المواد أو النسخ أو الأنظمة، "
            "وبيّن أثر كل اختلاف عملياً على المكلف، وقدّم النتيجة في صيغة منظمة."
        ),
        "formatPrompt": (
            "جدول مقارنة مقارن واستنتاج تحليلي يتضمن:\n"
            "1. وجه المقارنة\n"
            "2. النص الأصلي أو النظام الأول\n"
            "3. النص المعدل أو النظام المقارن\n"
            "4. الأثر الضريبي والمالي على المكلف."
        ),
        "clarificationPrompt": "اسأل عن القانونين أو المادتين أو السنتين المراد المقارنة بينهما بدقة.",
        "followupPrompt": "استفسر عما إذا كان المكلف خاضعاً لمنطقة تنموية أو منطقة حرة أو وضع خاص."
    },
    {
        "id": "btn-4",
        "orderNum": 4,
        "type": "زر بحث متقدم",
        "mode_key": "compliance",
        "relatedSearchText": "امتثال",
        "title": "الالتزام والامتثال",
        "tag": "امتثال",
        "isActive": True,
        "description": "متطلبات الامتثال والالتزامات الإجرائية والمواعيد",
        "generalPrompt": (
            "ركّز على متطلبات الامتثال: عدّد الالتزامات الإجرائية والمواعيد النهائية والغرامات المترتبة على المخالفة، "
            "وقدّم قائمة تحقق عملية لضمان الالتزام الكامل بالتشريعات النافذة."
        ),
        "formatPrompt": (
            "دليل امتثال وإجراءات تنفيذية:\n"
            "1. المتطلبات الإجرائية الفورية\n"
            "2. المواعيد والمهل القانونية النهائية\n"
            "3. جدول الغرامات والفوائد القانونية المترتبة عند التأخير\n"
            "4. قائمة تحقق عملية (Checklist) لضمان الامتثال التام."
        ),
        "clarificationPrompt": "اسأل عن صفة المكلف (فرد طبيعي أم شركة ذات مسؤولية محدودة أم مساهمة عامة).",
        "followupPrompt": "اقترح خطوات فورية لتسوية الوضع وتجنب الحجز المالي أو الغرامة الإضافية."
    }
]


# ── 2. دوال استرجاع وحفظ البرومبتس المحدثة بواسطة الأدمن ──────────
SETTINGS_KEY = "ai_prompt_library"

def get_all_prompts(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """
    جلب كافة البرومبتس: إذا قام الأدمن بتعديلها في قاعدة البيانات تُسترجع من DB،
    وإلا تُرجع البرومبتس الافتراضية من هذا الملف.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        from models.admin.platform_setting import PlatformSetting
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == SETTINGS_KEY).first()
        if setting and setting.value_json:
            stored = json.loads(setting.value_json)
            if isinstance(stored, list) and len(stored) > 0:
                return stored
    except Exception as e:
        print(f"[Prompts Warning] Could not load stored prompts from DB: {e}")
    finally:
        if close_db:
            db.close()

    return DEFAULT_ADVANCED_BUTTONS


def save_prompts(buttons: List[Dict[str, Any]], updated_by_id: Optional[Any] = None, db: Optional[Session] = None) -> List[Dict[str, Any]]:
    """
    حفظ وتحديث البرومبتس بواسطة الأدمن في قاعدة البيانات لكي تنعكس فورياً على استجابات الـ AI.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        from models.admin.platform_setting import PlatformSetting
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == SETTINGS_KEY).first()
        if not setting:
            setting = PlatformSetting(
                key=SETTINGS_KEY,
                value_json=json.dumps(buttons, ensure_ascii=False),
                description="مكتبة البرومبتس وأزرار البحث المتقدم للذكاء الاصطناعي",
                updated_by=updated_by_id
            )
            db.add(setting)
        else:
            setting.value_json = json.dumps(buttons, ensure_ascii=False)
            if updated_by_id:
                setting.updated_by = updated_by_id

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Prompts Error] Failed to save prompts: {e}")
        raise e
    finally:
        if close_db:
            db.close()

    return buttons


def get_prompt_for_mode(mode: str, db: Optional[Session] = None) -> Dict[str, Any]:
    """
    البحث عن البرومبت النشط المرتبط بالوضع المحدد (mode أو title أو tag أو id).
    """
    all_btns = get_all_prompts(db)
    mode_clean = (mode or "").strip().lower()

    # مطابقة mode_key أولاً (consultation, deep, compare, compliance)
    for btn in all_btns:
        if btn.get("mode_key") == mode_clean or btn.get("id") == mode:
            return btn

    # مطابقة العنوان أو الكلمة الدلالية
    for btn in all_btns:
        title = btn.get("title", "")
        tag = btn.get("tag", "")
        if mode in title or mode in tag or title in mode or tag in mode:
            return btn

    # الافتراضي هو أول زرار (استشارة ضريبية)
    return all_btns[0] if all_btns else DEFAULT_ADVANCED_BUTTONS[0]


def build_system_instruction_for_mode(mode: str, db: Optional[Session] = None) -> str:
    """
    توليد الـ system_instruction الكامل الموجه للـ LLM بناءً على الزرار والبرومبت المعتمد من الأدمن.
    """
    btn = get_prompt_for_mode(mode, db)
    title = btn.get("title", "استشارة ضريبية")
    gen_prompt = btn.get("generalPrompt", "")
    format_prompt = btn.get("formatPrompt", "")
    clarify_prompt = btn.get("clarificationPrompt", "")
    followup_prompt = btn.get("followupPrompt", "")

    return (
        f"أنت «ديوان»، المساعد الذكي والمستشار الضريبي والقانوني المعتمد في المملكة الأردنية الهاشمية.\n"
        f"وضع الاستشارة الحالي المختار: «{title}».\n\n"
        f"--- [التوجيه الأساسي لهذا الوضع]:\n{gen_prompt}\n\n"
        f"--- [طريقة تنظيم وهيكلة الإجابة المطلوبة]:\n{format_prompt}\n\n"
        f"--- [إرشادات الاستيضاح إن لزم]:\n{clarify_prompt}\n\n"
        f"--- [إرشادات أسئلة المتابعة]:\n{followup_prompt}\n\n"
        f"قواعد إلزامية حاسمة للدقة والنزاهة القانونية:\n"
        f"1. الدقة الرقمية الصارمة: انقل النسب المئوية والمبالغ المالية حرفياً كما وردت في نص المادة المرفقة بالسياق دون أي تعديل أو تخمين (مثال: إذا كانت المادة 12/ب تنص صراحة على اقتطاع 10% من دخل غير المقيم فلا تذكر 5% إطلاقاً، وميّز بينها وبين نسبة الـ 5% في 12/أ لأتعاب المقيمين).\n"
        f"2. التمييز الدقيق في صفة الأطراف:\n"
        f"   - فرّق دائماً بين المكلف المقيم والمكلف غير المقيم.\n"
        f"   - فرّق بين الشخص الاعتباري (الشركات والمنشآت الملزمة بالاقتطاع والتوريد) والشخص الطبيعي (الفرد المستأجر لسكنه الخاص غير الملزم بالاقتطاع والتوريد).\n"
        f"3. التحقق المرجعي ومنع التلفيق: استشهد فقط بأرقام ونصوص المواد الحقيقية الواردة في السياق، وإياك واختلاق أو نسبة نصوص لمواد لا تخصها (مثل عدم نسبة أحكام الاقتطاع للمادة 26 لأنها خاصة بالإقرارات الضريبية، فاقتطاع المصدر محصور في المادة 12 وتعليماتها التنفيذية).\n"
        f"4. المصطلحات القانونية المعتمدة: استخدم المصطلحات الدقيقة لقانون ضريبة الدخل الأردني (الدخل الإجمالي، الدخل الخاضع للضريبة، دفعة على حساب الضريبة، ضريبة قطعية) وتجنب تماماً أي مصطلحات مبتدعة مثل 'الدخل الموسع'.\n"
        f"5. الاستشهاد بالسوابق القضائية: إذا وُجدت أحكام قضائية مرتبطة في السياق (مثل قرارات محكمة التمييز أو بداية الضريبة)، استشهد بها مع ذكر رقم الحكم والمحكمة لدعم الإجابة."
    )

