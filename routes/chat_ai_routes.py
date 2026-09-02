import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from helpers.database import get_db
from helpers.enums import UserRole
from models import Appointment, ChatMessage, User
from routes.deps import get_current_active_user
from services.llm_service import LLMService

router = APIRouter(prefix="/chat/ai", tags=["Chat AI Assistant"])

class GenerateReplyRequest(BaseModel):
    appointment_id: uuid.UUID
    purpose: Optional[str] = "suggest_reply" # suggest_reply, summary, formal_response, follow_up
    language: Optional[str] = "ar"
    creativity: Optional[str] = "medium"
    max_length: Optional[int] = 150
    custom_instructions: Optional[str] = None

class GenerateReplyResponse(BaseModel):
    reply: str
    context_message_count: int

@router.post("/generate-reply", response_model=GenerateReplyResponse)
def generate_ai_reply(
    req: GenerateReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify appointment exists and user is part of it or consultant/admin
    appt = db.query(Appointment).filter(Appointment.id == req.appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الاستشارة غير موجودة")

    # Check permission: current_user must be consultant, user, or admin attached to appt
    if current_user.id not in (appt.user_id, appt.consultant.user_id if appt.consultant else None) and current_user.role not in (UserRole.admin, UserRole.super_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="غير مصرح لك بالوصول لهذه الاستشارة")

    # Fetch last 25 chat messages for context
    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.appointment_id == req.appointment_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(25)
        .all()
    )
    recent_messages.reverse() # chronological order

    # Format transcript context
    transcript_lines = []
    for msg in recent_messages:
        sender_name = msg.sender.full_name if msg.sender else "مستخدم"
        text = msg.message_text or "[مرفق ملف]"
        transcript_lines.append(f"{sender_name}: {text}")

    context_str = "\n".join(transcript_lines) if transcript_lines else "لا توجد رسائل سابقة في المحادثة."

    purpose_guide = {
        "suggest_reply": "اقترح رداً مهنياً ومباشراً ومناسباً جداً لسياق المحادثة الأخيرة.",
        "summary": "لخص النقاط رئيسية المتفق عليها واطلب التحرّك للخطوة القادمة.",
        "formal_response": "اكتب رداً رسمياً واستشارياً ودقيقاً.",
        "follow_up": "اكتب رسالة متابعة مهذبة للاستفسار عن المستجدات."
    }.get(req.purpose, "اقترح رداً متميزاً ومناسباً لسياق المحادثة.")

    system_instruction = (
        "أنت مساعد استشاري بالذكاء الاصطناعي على منصة استشارات قانونية ومهنية. "
        "مهمتك صياغة ردود واضحة ومباشرة ومهنية باللغة العربية (أو اللغة المطلوبة). "
        "يجب أن يكون الرد صادراً باسم المستشار وبنبرة احترافية وودودة."
    )

    prompt = f"""
سياق الاستشارة:
- موضوع الاستشارة: {appt.notes or 'استشارة تخصصية'}
- خدمة: {appt.service_name or 'فيديو / شات'}

سياق المحادثة الأخيرة:
---
{context_str}
---

الهدف المطلوب من الرد: {purpose_guide}
{f'تعليمات إضافية من المستشار: {req.custom_instructions}' if req.custom_instructions else ''}
اللغة: {'العربية' if req.language == 'ar' else 'الإنجيلزية'}
أقصى عدد كلمات: {req.max_length or 150} كلمة.

اكتب الرد المباشر فقط دون أي مقدمات أو شرح إضافي:
"""

    try:
        raw_reply = LLMService.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            strict_mode=True
        )
        return GenerateReplyResponse(
            reply=raw_reply.strip(),
            context_message_count=len(recent_messages)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل توليد الرد بالذكاء الاصطناعي: {str(e)}"
        )
