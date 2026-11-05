import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models import AIChatSession, AIChatMessage
from helpers.enums import AIChatRole
from helpers.encryption import encrypt_text, decrypt_text
from services.ai.llm_service import LLMService
from services.ai.hybrid_search_service import HybridSearchService


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


class AIChatService:

    @staticmethod
    def _get_user_session(db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> AIChatSession:
        session = db.query(AIChatSession).filter(
            AIChatSession.id == session_id, AIChatSession.user_id == user_id
        ).first()
        if not session:
            raise ValueError("جلسة المحادثة غير موجودة")
        return session

    @classmethod
    def create_session(cls, db: Session, user_id: uuid.UUID, title: Optional[str] = None) -> AIChatSession:
        session = AIChatSession(
            user_id=user_id,
            title=title.strip()[:200] if title and title.strip() else None
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @classmethod
    def get_user_sessions(cls, db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        sessions = (
            db.query(AIChatSession)
            .filter(AIChatSession.user_id == user_id)
            .order_by(
                AIChatSession.is_pinned.desc(),
                AIChatSession.pinned_at.desc().nullslast(),
                AIChatSession.updated_at.desc()
            )
            .offset(skip).limit(limit).all()
        )

        result = []
        for s in sessions:
            last = db.query(AIChatMessage).filter(AIChatMessage.session_id == s.id).order_by(AIChatMessage.created_at.desc()).first()
            last_text = decrypt_text(last.content_encrypted)[:80] if last else None
            cnt = db.query(AIChatMessage).filter(AIChatMessage.session_id == s.id).count()
            result.append({
                "id": str(s.id), "user_id": str(s.user_id),
                "title": s.title or (f"{last_text}..." if last_text else "محادثة جديدة"),
                "is_pinned": s.is_pinned, "is_favorite": s.is_pinned,
                "pinned_at": s.pinned_at, "created_at": s.created_at, "updated_at": s.updated_at,
                "last_message": last_text,
                "message_count": cnt
            })
        return result

    @classmethod
    def get_session_detail(cls, db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> Dict[str, Any]:
        session = cls._get_user_session(db, session_id, user_id)
        msg_list = db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()
        messages = [
            {
                "id": str(m.id), "session_id": str(m.session_id),
                "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                "content": decrypt_text(m.content_encrypted) or "",
                "citations": m.citations, "created_at": m.created_at
            }
            for m in msg_list
        ]
        return {
            "id": str(session.id), "user_id": str(session.user_id), "title": session.title,
            "is_pinned": session.is_pinned, "is_favorite": session.is_pinned,
            "pinned_at": session.pinned_at, "created_at": session.created_at,
            "updated_at": session.updated_at, "messages": messages
        }

    @classmethod
    def update_session(cls, db: Session, session_id: uuid.UUID, user_id: uuid.UUID, title: Optional[str] = None, is_pinned: Optional[bool] = None) -> Dict[str, Any]:
        session = cls._get_user_session(db, session_id, user_id)
        if title is not None and title.strip():
            session.title = title.strip()[:200]
        if is_pinned is not None:
            session.is_pinned = is_pinned
            session.pinned_at = datetime.now(timezone.utc) if is_pinned else None
        db.commit()
        db.refresh(session)
        return {"id": session.id, "title": session.title, "is_pinned": session.is_pinned, "is_favorite": session.is_pinned, "pinned_at": session.pinned_at, "updated_at": session.updated_at}

    @classmethod
    def toggle_pin(cls, db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> Dict[str, Any]:
        session = cls._get_user_session(db, session_id, user_id)
        session.is_pinned = not session.is_pinned
        session.pinned_at = datetime.now(timezone.utc) if session.is_pinned else None
        db.commit()
        db.refresh(session)
        return {"id": session.id, "title": session.title, "is_pinned": session.is_pinned, "is_favorite": session.is_pinned, "pinned_at": session.pinned_at, "updated_at": session.updated_at}

    @classmethod
    def delete_session(cls, db: Session, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        session = cls._get_user_session(db, session_id, user_id)
        db.delete(session)
        db.commit()
        return True

    @classmethod
    def send_message(cls, db: Session, session_id: uuid.UUID, user_id: uuid.UUID, message_text: str = None, text: str = None, mode: str = "consultation", is_advanced: bool = False) -> Dict[str, Any]:
        session = cls._get_user_session(db, session_id, user_id)
        raw_text = message_text if message_text is not None else (text or "")
        clean_text = raw_text.strip()
        if not clean_text:
            raise ValueError("نص الرسالة فارغ")

        if not session.title:
            session.title = clean_text[:50] + ("..." if len(clean_text) > 50 else "")

        # 1. User Message (Encrypted)
        user_msg = AIChatMessage(
            session_id=session.id, role=AIChatRole.user,
            content_encrypted=encrypt_text(clean_text)
        )
        db.add(user_msg)

        # 2. فحص نية المستخدم (Intent Detection): هل طلب المستخدم مساراً تشريعياً متقدماً؟
        detected_mode = detect_advanced_intent(clean_text)

        # يعتبر متقدماً إذا تم الضغط على زر بحث متقدم أو إذا طلب المستخدم مساراً متقدماً في كلامه
        effective_is_advanced = bool(is_advanced or detected_mode)
        effective_mode = detected_mode if detected_mode else (mode or "consultation")

        graph_context = None
        citations = []

        if effective_is_advanced:
            # صياغة استعلام البحث في حال كان طلب المستخدم متابعة مختصرة
            search_query = clean_text
            if detected_mode and len(clean_text) < 90:
                # استرجاع موضوع السؤال السابق في الجلسة لضمان دقة استرجاع نصوص القوانين من Qdrant وNeo4j
                last_user_msg = (
                    db.query(AIChatMessage)
                    .filter(AIChatMessage.session_id == session.id, AIChatMessage.role == AIChatRole.user)
                    .order_by(AIChatMessage.created_at.desc())
                    .offset(1)
                    .first()
                )
                if last_user_msg:
                    try:
                        prev_text = decrypt_text(last_user_msg.content_encrypted)
                        search_query = f"{prev_text} ({clean_text})"
                    except Exception:
                        pass

            # استدعاء أدوات البحث الهجين (Qdrant Semantic + Neo4j Graph RAG)
            graph_context, citations = HybridSearchService.search(search_query)

            # استرجاع وتطبيق البرومبت المخصص للوضع المتقدم المعتمد من قبل الأدمن
            from services.ai.prompts import build_system_instruction_for_mode
            system_prompt = build_system_instruction_for_mode(mode=effective_mode, db=db)

            user_prompt_with_context = clean_text
            if graph_context:
                user_prompt_with_context = (
                    f"{clean_text}\n\n"
                    f"--- [البيانات والنصوص المستخرجة من قاعدة المعرفة الرسم البياني Neo4j] ---\n"
                    f"{graph_context}\n"
                    f"--- [نهاية بيانات Neo4j] ---"
                )
        else:
            # الوضع الافتراضي التفاعلي السريع: بدون استدعاء الـ Tools (لتوفير السرعة والموارد)
            # مع تحليل السؤال واقتراح مسارات التعمق في ختام الإجابة
            from services.ai.prompts import build_default_system_instruction
            system_prompt = build_default_system_instruction(db=db)
            user_prompt_with_context = clean_text

        try:
            reply = LLMService.generate_response(user_prompt_with_context, system_instruction=system_prompt)
        except Exception:
            reply = "عذراً، تعذر معالجة الطلب حالياً. يرجى إعادة المحاولة."

        # 3. Assistant Message (Encrypted with Citations)
        ai_msg = AIChatMessage(
            session_id=session.id,
            role=AIChatRole.assistant,
            content_encrypted=encrypt_text(reply),
            citations=citations if citations else None
        )
        db.add(ai_msg)
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user_msg)
        db.refresh(ai_msg)

        return {
            "user_message": {
                "id": user_msg.id,
                "session_id": session.id,
                "role": "user",
                "content": clean_text,
                "created_at": user_msg.created_at
            },
            "assistant_message": {
                "id": ai_msg.id,
                "session_id": session.id,
                "role": "assistant",
                "content": reply,
                "citations": ai_msg.citations,
                "created_at": ai_msg.created_at
            },
            "session": {
                "id": session.id,
                "title": session.title,
                "is_pinned": session.is_pinned,
                "updated_at": session.updated_at
            }
        }

