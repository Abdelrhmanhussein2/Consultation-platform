import os
import uuid
from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from helpers.database import get_db
from models import User
from models.ticket_attachment import TicketAttachment
from helpers.enums import TicketCategory, TicketPriority, TicketStatus
from schemes import TicketCreate, TicketOut, TicketReplyCreate, TicketReplyOut, TicketAttachmentOut
from controllers import TicketController
from routes.deps import get_current_active_user

router = APIRouter(prefix="/tickets", tags=["Support Tickets"])

@router.post(
    "/",
    response_model=TicketOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new support ticket",
)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submits a new support ticket to the support desk.
    """
    return TicketController.create_ticket(db, current_user.id, ticket_in)


@router.get(
    "/my",
    response_model=List[TicketOut],
    summary="Get list of my support tickets",
)
def list_my_tickets(
    status: Optional[TicketStatus] = None,
    category: Optional[TicketCategory] = None,
    priority: Optional[TicketPriority] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all support tickets submitted by the authenticated user with optional filters.
    """
    return TicketController.list_my_tickets(
        db, current_user.id, status, category, priority, search, page, limit
    )


@router.get(
    "/{ticket_id}",
    response_model=TicketOut,
    summary="Get support ticket details",
)
def get_ticket_detail(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns details of a specific ticket.
    Only the owner of the ticket can view it. Internal replies/notes are excluded.
    """
    return TicketController.get_my_ticket(db, ticket_id, current_user.id)


@router.post(
    "/{ticket_id}/reply",
    response_model=TicketReplyOut,
    status_code=status.HTTP_201_CREATED,
    summary="Reply to a support ticket",
)
def reply_to_ticket(
    ticket_id: str,
    reply_in: TicketReplyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Adds a public reply to an open support ticket.
    Rejects the request if the ticket status is 'closed'.
    """
    return TicketController.reply_as_user(db, ticket_id, current_user.id, reply_in)


@router.post(
    "/{ticket_id}/attachments",
    response_model=TicketAttachmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an attachment for a support ticket"
)
async def upload_ticket_attachment(
    ticket_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        ticket_uuid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="معرف التذكرة غير صالح"
        )

    # Check ticket ownership
    ticket = TicketController.get_my_ticket(db, ticket_id, current_user.id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="التذكرة غير موجودة"
        )

    # Clean and sanitize filename to prevent path traversal
    raw_filename = os.path.basename(file.filename)
    filename, ext = os.path.splitext(raw_filename)
    ext = ext.lower()

    # Allowed extensions validation
    allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc']
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"صيغة الملف غير مسموح بها. الصيغ المسموح بها هي: {', '.join(allowed_extensions)}"
        )

    # Create upload directory if it doesn't exist
    upload_dir = os.path.join("static", "ticket_attachments")
    os.makedirs(upload_dir, exist_ok=True)

    new_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = f"/static/ticket_attachments/{new_filename}"
    full_path = os.path.join(upload_dir, new_filename)

    # Read and validate size before saving
    try:
        content = await file.read()
        file_size = len(content)

        # Size limit: 10 MB
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="حجم الملف يجب أن لا يتجاوز 10 ميجابايت"
            )

        with open(full_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"فشل في حفظ الملف على الخادم: {e}"
        )

    # Insert into database
    attachment = TicketAttachment(
        ticket_id=ticket_uuid,
        uploaded_by=current_user.id,
        filename=raw_filename,
        file_path=file_path,
        file_size=file_size,
        content_type=file.content_type
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.delete(
    "/{ticket_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an attachment from a support ticket"
)
def delete_ticket_attachment(
    ticket_id: str,
    attachment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        ticket_uuid = uuid.UUID(ticket_id)
        att_uuid = uuid.UUID(attachment_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="معرف التذكرة أو المرفق غير صالح"
        )

    # Check ticket ownership
    ticket = TicketController.get_my_ticket(db, ticket_id, current_user.id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="التذكرة غير موجودة"
        )

    attachment = db.query(TicketAttachment).filter(
        TicketAttachment.id == att_uuid,
        TicketAttachment.ticket_id == ticket_uuid
    ).first()

    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المرفق غير موجود"
        )

    # Remove physical file if it exists
    relative_path = attachment.file_path.lstrip('/')
    if os.path.exists(relative_path):
        try:
            os.remove(relative_path)
        except Exception:
            pass

    db.delete(attachment)
    db.commit()
    return
