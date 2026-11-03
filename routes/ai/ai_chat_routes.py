import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from helpers.database import get_db
from models import User
from routes.deps import get_current_active_user
from services.ai.ai_chat_service import AIChatService
from schemes.ai_chat import (
    AIChatSessionCreate,
    AIChatSessionUpdate,
    AIChatSessionOut,
    AIChatSessionDetailOut,
    SendMessageRequest,
    SendMessageResponse,
)

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant Chat Sessions"])


@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(
    payload: Optional[AIChatSessionCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    إنشاء جلسة محادثة جديدة للذكاء الاصطناعي.
    """
    title = payload.title if payload else None
    session = AIChatService.create_session(db=db, user_id=current_user.id, title=title)
    return {
        "id": session.id,
        "user_id": session.user_id,
        "title": session.title,
        "is_pinned": session.is_pinned,
        "is_favorite": session.is_pinned,
        "pinned_at": session.pinned_at,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


@router.get("/sessions")
def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    استرجاع سجل محادثات المستخدم مرتبة (المثبتة/المفضلة أولاً ثم الأحدث تعديلاً).
    """
    return AIChatService.get_user_sessions(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )


@router.get("/sessions/{session_id}")
def get_session_detail(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    استرجاع تفاصيل جلسة محددة مع جميع رسائلها بعد فك التشفير.
    """
    try:
        return AIChatService.get_session_detail(
            db=db, session_id=session_id, user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/sessions/{session_id}")
def update_session(
    session_id: uuid.UUID,
    payload: AIChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    تعديل عنوان المحادثة أو حالة التثبيت (PIN / Favorite).
    """
    try:
        return AIChatService.update_session(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            title=payload.title,
            is_pinned=payload.is_pinned,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/sessions/{session_id}/pin")
def toggle_pin_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    تثبيت أو إلغاء تثبيت المحادثة (تبديل الحالة).
    """
    try:
        return AIChatService.toggle_pin(
            db=db, session_id=session_id, user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
def delete_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    حذف المحادثة نهائياً ومباشرة من قاعدة البيانات مع رسائلها المرتبطة (CASCADE).
    """
    try:
        AIChatService.delete_session(
            db=db, session_id=session_id, user_id=current_user.id
        )
        return {"success": True, "message": "تم حذف المحادثة بنجاح"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/sessions/{session_id}/messages")
def send_message_to_ai(
    session_id: uuid.UUID,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    إرسال رسالة جديدة للذكاء الاصطناعي:
    - تشفير رسالة المستخدم وحفظها
    - استدعاء الذكاء الاصطناعي وتشفير الرد وحفظه
    - إرجاع الرسالتين والبيانات مفكوكة التشفير
    """
    try:
        return AIChatService.send_message(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            message_text=payload.message,
            mode=payload.mode or "consultation",
            is_advanced=payload.is_advanced or False,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"حدث خطأ أثناء معالجة الرسالة: {str(e)}",
        )



# ── مكتبة البرومبتس وأزرار البحث المتقدم ────────────────────────────

@router.get("/prompts")
def get_ai_prompts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    استرجاع كافة أزرار البحث المتقدم والبرومبتس الخاصة بها (المعدلة من الأدمن أو الافتراضية).
    """
    from services.ai.prompts import get_all_prompts
    return get_all_prompts(db=db)


@router.put("/prompts")
def update_ai_prompts(
    payload: List[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    حفظ وتحديث أزرار البحث المتقدم والبرومبتس من قبل المشرفين/الأدمن،
    لتنعكس مباشرة وبشكل فوري على إجابات مساعد ديوان الذكي.
    """
    from helpers.enums import UserRole
    if current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="فقط المشرفون ومدراء المنصة مصرح لهم بتعديل مكتبة البرومبتس."
        )

    from services.ai.prompts import save_prompts
    try:
        updated = save_prompts(buttons=payload, updated_by_id=current_user.id, db=db)
        return {"success": True, "message": "تم حفظ وتحديث مكتبة البرومبتس بنجاح.", "prompts": updated}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل حفظ البرومبتس: {str(e)}"
        )
