import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models import AIChatMessage
from helpers.enums import AIChatRole
from helpers.encryption import encrypt_text, decrypt_text
from services.ai.llm_service import LLMService
from services.ai.hybrid_search_service import HybridSearchService
from services.ai.ai_cache_service import AICacheService
from services.ai.intent_service import detect_advanced_intent
from services.ai.ai_session_service import AIChatSessionService


class AIChatService:
    # Delegate session operations for backward compatibility
    _get_user_session = AIChatSessionService.get_user_session
    create_session = AIChatSessionService.create_session
    get_user_sessions = AIChatSessionService.get_user_sessions
    get_session_detail = AIChatSessionService.get_session_detail
    update_session = AIChatSessionService.update_session
    toggle_pin = AIChatSessionService.toggle_pin
    delete_session = AIChatSessionService.delete_session

    @classmethod
    def send_message(
        cls, db: Session, session_id: uuid.UUID, user_id: uuid.UUID,
        message_text: str = None, text: str = None,
        mode: str = "consultation", is_advanced: bool = False
    ) -> Dict[str, Any]:
        session = cls._get_user_session(db, session_id, user_id)
        raw_text = message_text if message_text is not None else (text or "")
        clean_text = raw_text.strip()
        if not clean_text:
            raise ValueError("نص الرسالة فارغ")

        if not session.title:
            session.title = clean_text[:50] + ("..." if len(clean_text) > 50 else "")

        user_msg = AIChatMessage(
            session_id=session.id, role=AIChatRole.user,
            content_encrypted=encrypt_text(clean_text)
        )
        db.add(user_msg)

        detected_mode = detect_advanced_intent(clean_text)
        effective_is_advanced = bool(is_advanced or detected_mode)
        effective_mode = detected_mode if detected_mode else (mode or "default")

        # 1. Check Exact Redis Cache
        cached_exact = AICacheService.get_exact(effective_mode, clean_text)
        if cached_exact:
            cached_data = cached_exact["data"]
            return cls._save_and_return_cached(
                db, session, user_msg, clean_text,
                reply=cached_data.get("reply", ""),
                citations=cached_data.get("citations"),
                cache_type="exact",
                cache_key=cached_exact.get("cache_key"),
                mode=effective_mode,
                usage=cached_data.get("usage"),
                model_name=cached_data.get("model_name"),
            )

        # 2. Check Semantic Qdrant Cache
        cached_semantic = AICacheService.get_semantic(effective_mode, clean_text)
        if cached_semantic:
            payload = cached_semantic["data"]
            return cls._save_and_return_cached(
                db, session, user_msg, clean_text,
                reply=payload.get("answer", ""),
                citations=payload.get("citations"),
                cache_type="semantic",
                cache_key=f"ai_cache:semantic:{cached_semantic.get('point_id')}",
                score=cached_semantic.get("score"),
                mode=effective_mode,
                usage={
                    "prompt_tokens": payload.get("prompt_tokens", 0),
                    "completion_tokens": payload.get("completion_tokens", 0),
                    "total_tokens": payload.get("total_tokens", 0),
                },
                model_name=payload.get("model_name"),
            )

        # 3. Cache Miss: Execute LLM Pipeline
        citations = []
        if effective_is_advanced:
            search_query = clean_text
            if detected_mode and len(clean_text) < 90:
                last_user = (
                    db.query(AIChatMessage)
                    .filter(AIChatMessage.session_id == session.id, AIChatMessage.role == AIChatRole.user)
                    .order_by(AIChatMessage.created_at.desc()).offset(1).first()
                )
                if last_user:
                    try:
                        search_query = f"{decrypt_text(last_user.content_encrypted)} ({clean_text})"
                    except Exception:
                        pass

            graph_context, citations = HybridSearchService.search(search_query, mode=effective_mode)
            from services.ai.prompts import build_system_instruction_for_mode
            system_prompt = build_system_instruction_for_mode(mode=effective_mode, db=db)
            user_prompt = f"{clean_text}\n\n{graph_context}" if graph_context else clean_text
        else:
            from services.ai.prompts import build_default_system_instruction
            system_prompt = build_default_system_instruction(db=db)
            user_prompt = clean_text

        try:
            llm_res = LLMService.generate_response(user_prompt, system_instruction=system_prompt)
            reply = llm_res.get("content", "")
            usage = llm_res.get("usage", {})
            model_name = llm_res.get("model_name", "")
            latency_ms = llm_res.get("latency_ms", 0)
        except Exception:
            reply = "عذراً، تعذر معالجة الطلب حالياً. يرجى إعادة المحاولة."
            usage, model_name, latency_ms = {}, "", 0

        # تنظيف أي تسريب تقني غير مقصود لضمان عدم ظهور أي ألفاظ تقنية نهائياً
        import re
        tech_leaks = [
            r"نظراً لعدم وجود نصوص في البيانات المسترجعة.*?(?:،|\.|\n|$)",
            r"في البيانات المسترجعة من Neo4j",
            r"في البيانات المسترجعة من Qdrant",
            r"في البيانات المسترجعة",
            r"البيانات المسترجعة",
            r"من Neo4j",
            r"من Qdrant",
            r"Neo4j",
            r"Qdrant",
        ]
        for pattern in tech_leaks:
            reply = re.sub(pattern, "", reply, flags=re.IGNORECASE)
        reply = re.sub(r"\n{3,}", "\n\n", reply).strip()

        # فحص ما إذا كان الـ AI غير متأكد أو عجز عن الإجابة (Flagging)
        is_unresolved, unresolved_reason = False, None
        if "[UNRESOLVED_QUERY" in reply:
            match = re.search(r"\[UNRESOLVED_QUERY:?\s*(.*?)\]", reply, re.IGNORECASE)
            is_unresolved = True
            unresolved_reason = match.group(1).strip() if (match and match.group(1)) else "عدم توفر سند قانوني"
            reply = re.sub(r"\[UNRESOLVED_QUERY:?.*?\]?", "", reply, flags=re.IGNORECASE).strip()
        elif any(p in reply for p in [
            "لا تتوفر لدي معلومات", "خارج نطاق التشريعات", "لا أملك إجابة", "خارج نطاق اختصاصي",
            "خارج اختصاص", "يرجى مراجعة مستشار", "غير مختص بهذا", "لا أملك سنداً", "لا أعلم"
        ]):
            is_unresolved = True
            unresolved_reason = "خارج النطاق الضريبي أو نقص في البيانات"

        citations_payload = {"sources": citations} if citations else {}
        if is_unresolved:
            citations_payload["is_unresolved"] = True
            citations_payload["unresolved_reason"] = unresolved_reason or "بحاجة لمستشار"
            citations_payload["original_question"] = clean_text

        exact_key = None
        if not is_unresolved:
            exact_key = AICacheService.set_exact(
                effective_mode, clean_text,
                {"question": clean_text, "reply": reply, "citations": citations, "usage": usage, "model_name": model_name},
                is_advanced=effective_is_advanced
            )
            AICacheService.index_semantic(
                mode=effective_mode, question=clean_text, answer=reply,
                usage=usage, model_name=model_name, citations=citations
            )

        ai_msg = AIChatMessage(
            session_id=session.id, role=AIChatRole.assistant, content_encrypted=encrypt_text(reply),
            citations=citations_payload if citations_payload else None,
            prompt_tokens=usage.get("prompt_tokens"), completion_tokens=usage.get("completion_tokens"),
            total_tokens=usage.get("total_tokens"), model_name=model_name, latency_ms=latency_ms,
            is_cached=False, cache_type=None, cache_key=exact_key, mode=effective_mode,
        )
        db.add(ai_msg)
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user_msg); db.refresh(ai_msg)
        return cls._build_response(user_msg, ai_msg, session, clean_text, reply)

    @classmethod
    def _save_and_return_cached(cls, db: Session, session: Any, user_msg: AIChatMessage, question: str, reply: str, citations: Any, cache_type: str, cache_key: str = None, score: float = None, mode: str = "default", usage: dict = None, model_name: str = None) -> Dict[str, Any]:
        u = usage or {}
        ai_msg = AIChatMessage(
            session_id=session.id, role=AIChatRole.assistant, content_encrypted=encrypt_text(reply), citations=citations,
            prompt_tokens=u.get("prompt_tokens", 0), completion_tokens=u.get("completion_tokens", 0), total_tokens=u.get("total_tokens", 0),
            model_name=model_name, latency_ms=10, is_cached=True, cache_type=cache_type, cache_key=cache_key, cache_similarity_score=score, mode=mode,
        )
        db.add(ai_msg)
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user_msg); db.refresh(ai_msg)
        return cls._build_response(user_msg, ai_msg, session, question, reply)

    @staticmethod
    def _build_response(user_msg, ai_msg, session, text, reply):
        return {
            "user_message": {"id": user_msg.id, "session_id": session.id, "role": "user", "content": text, "created_at": user_msg.created_at},
            "assistant_message": {"id": ai_msg.id, "session_id": session.id, "role": "assistant", "content": reply, "citations": ai_msg.citations, "created_at": ai_msg.created_at, "is_cached": ai_msg.is_cached, "cache_type": ai_msg.cache_type},
            "session": {"id": session.id, "title": session.title, "is_pinned": session.is_pinned, "updated_at": session.updated_at}
        }
