import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models import AIChatSession, AIChatMessage
from helpers.enums import AIChatRole
from helpers.encryption import encrypt_text, decrypt_text
from services.llm_service import LLMService


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
    def send_message(cls, db: Session, session_id: uuid.UUID, user_id: uuid.UUID, message_text: str = None, text: str = None) -> Dict[str, Any]:
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

        # 2. Call LLM
        system_prompt = (
            "أنت مستشارك الضريبي ديوان. قدم إجابات مهنية مقسمة إلى: "
            "1) الجواب المباشر 2) التكييف النظامي 3) السند القانوني 4) الخلاصة."
        )
        try:
            reply = LLMService.generate_response(clean_text, system_instruction=system_prompt)
        except Exception:
            reply = "عذراً، تعذر معالجة الطلب حالياً. يرجى إعادة المحاولة."

        # 3. Assistant Message (Encrypted)
        ai_msg = AIChatMessage(
            session_id=session.id, role=AIChatRole.assistant,
            content_encrypted=encrypt_text(reply)
        )
        db.add(ai_msg)
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user_msg)
        db.refresh(ai_msg)

        return {
            "user_message": {"id": user_msg.id, "session_id": session.id, "role": "user", "content": clean_text, "created_at": user_msg.created_at},
            "assistant_message": {"id": ai_msg.id, "session_id": session.id, "role": "assistant", "content": reply, "created_at": ai_msg.created_at},
            "session": {"id": session.id, "title": session.title, "is_pinned": session.is_pinned, "updated_at": session.updated_at}
        }
