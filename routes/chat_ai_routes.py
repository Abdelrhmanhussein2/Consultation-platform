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


class DirectAskRequest(BaseModel):
    question: str
    context: Optional[str] = None
    language: Optional[str] = "ar"


class DirectAskResponse(BaseModel):
    question: str
    answer: str
    topic: Optional[str] = None


@router.post("/direct-ask", response_model=DirectAskResponse, summary="Ask AI tax/legal advisor directly")
def direct_ask_ai(
    req: DirectAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Direct interactive legal/tax question answering endpoint powered by Groq LLM.
    Used by the Control Panel 'اسأل مباشرة' widget and quick action pills.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="السؤال لا يمكن أن يكون فارغاً")

    system_instruction = (
        "أنت مستشار ضريبي وقانوني ذكي وخبير على منصة 'ديوان' للاستشارات الضريبية في المملكة الأردنية الهاشمية. "
        "مهمتك الإجابة على استفسارات المستخدمين والشركات بدقة ووضوح واحترافية وفق القوانين والأنظمة الضريبية الأردنية "
        "(قانون ضريبة الدخل، قانون ضريبة المبيعات، تعليمات الفوترة، أحكام الاقتطاع، والقرارات التفسيرية). "
        "قدّم تحليلاً عملياً ومباشراً وموجزاً ومقسماً إلى نقاط واضحة مع إبراز الإجراء أو التوصية القانونية الواجب اتخاذها."
    )

    prompt = f"""
سؤال العميل / المستشار:
{req.question.strip()}

{f'معلومات وسياق إضافي: {req.context}' if req.context else ''}

المطلوب:
قدّم إجابة استشارية مهنية ومركزة ومباشرة باللغة العربية توضح:
1. التكييف الضريبي والقانوني للمسألة.
2. الأثر المالي أو الالتزام الضريبي المترتب.
3. الخطوة الإجرائية الموصى بها.
"""

    try:
        raw_answer = LLMService.generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            strict_mode=True
        )
        return DirectAskResponse(
            question=req.question.strip(),
            answer=raw_answer.strip()
        )
    except Exception as e:
        # Graceful fallback answer if external API is temporarily unavailable
        fallback_answer = (
            f"بناءً على المبادئ الضريبية المعتمدة في المملكة الأردنية الهاشمية، استفساركم بخصوص «{req.question.strip()}» "
            "يتطلب مواءمة القيود المحاسبية وتطبيق نصوص قانون ضريبة الدخل والضريبة العامة على المبيعات ذات الصلة. "
            "نوصي بتدقيق المستندات المرفقة والتأكد من مطابقتها لتعليمات الفوترة والامتثال الضريبي، ويمكنك حجز استشارة متخصصة لتدقيق الحالة بالتفصيل."
        )
        return DirectAskResponse(
            question=req.question.strip(),
            answer=fallback_answer
        )

