import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from services.ticket_service import TicketService
from helpers.enums import TicketCategory, TicketPriority, TicketStatus
from helpers.encryption import decrypt_text

class TicketController:
    @staticmethod
    def create_ticket(db: Session, client_id: uuid.UUID, ticket_in):
        return TicketService.create_ticket(db, client_id, ticket_in)

    @staticmethod
    def list_my_tickets(
        db: Session,
        client_id: uuid.UUID,
        status: TicketStatus = None,
        category: TicketCategory = None,
        priority: TicketPriority = None,
        search: str = None,
        page: int = 1,
        limit: int = 20
    ):
        return TicketService.list_my_tickets(db, client_id, status, category, priority, search, page, limit)

    @staticmethod
    def get_my_ticket(db: Session, ticket_id: str, client_id: uuid.UUID):
        try:
            ticket_uuid = uuid.UUID(ticket_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ticket ID format"
            )
            
        try:
            ticket = TicketService.get_ticket_for_user(db, ticket_uuid, client_id)
            
            # Map replies to output schema excluding internal replies
            # We will manually strip is_internal replies for safety
            public_replies = [r for r in ticket.replies if not r.is_internal]
            
            # Form return dict/object
            return {
                "id": ticket.id,
                "submitted_by": ticket.submitted_by,
                "submitter_name": ticket.submitter.full_name if ticket.submitter else "",
                "assigned_to": ticket.assigned_to,
                "assignee_name": ticket.assignee.full_name if ticket.assignee else None,
                "ticket_number": ticket.ticket_number,
                "subject": ticket.subject,
                "description": decrypt_text(ticket.description),
                "category": ticket.category,
                "sub_category": ticket.sub_category,
                "priority": ticket.priority,
                "status": ticket.status,
                "extra_fields": ticket.extra_fields,
                "closed_at": ticket.closed_at,
                "created_at": ticket.created_at,
                "updated_at": ticket.updated_at,
                "replies": [
                    {
                        "id": r.id,
                        "ticket_id": r.ticket_id,
                        "author_id": r.author_id,
                        "author_name": r.author.full_name if r.author else "",
                        "author_role": r.author.role if r.author else "user",
                        "message": decrypt_text(r.message),
                        "is_internal": r.is_internal,
                        "created_at": r.created_at
                    } for r in public_replies
                ],
                "attachments": [
                    {
                        "id": att.id,
                        "ticket_id": att.ticket_id,
                        "filename": att.filename,
                        "file_path": att.file_path,
                        "file_size": att.file_size,
                        "content_type": att.content_type,
                        "created_at": att.created_at
                    } for att in ticket.attachments
                ]
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

    @staticmethod
    def reply_as_user(db: Session, ticket_id: str, author_id: uuid.UUID, reply_in):
        try:
            ticket_uuid = uuid.UUID(ticket_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ticket ID format"
            )
            
        try:
            return TicketService.reply_to_ticket_user(db, ticket_uuid, author_id, reply_in.message)
        except ValueError as e:
            # Rejection message like "لا يمكن الرد على تذكرة مغلقة" or ticket not found
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def admin_list_tickets(
        db: Session,
        status_val: TicketStatus = None,
        category: TicketCategory = None,
        priority: TicketPriority = None,
        search: str = None,
        page: int = 1,
        limit: int = 20
    ):
        return TicketService.list_all_tickets(
            db, status_val, category, priority, search, page, limit
        )

    @staticmethod
    def admin_create_ticket(db: Session, admin_id: uuid.UUID, ticket_in):
        try:
            return TicketService.admin_create_ticket(db, admin_id, ticket_in)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def admin_get_ticket(db: Session, ticket_id: str):
        try:
            ticket_uuid = uuid.UUID(ticket_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ticket ID format"
            )
            
        try:
            ticket = TicketService.get_ticket_for_admin(db, ticket_uuid)
            return {
                "id": ticket.id,
                "submitted_by": ticket.submitted_by,
                "submitter_name": ticket.submitter.full_name if ticket.submitter else "",
                "assigned_to": ticket.assigned_to,
                "assignee_name": ticket.assignee.full_name if ticket.assignee else None,
                "ticket_number": ticket.ticket_number,
                "subject": ticket.subject,
                "description": decrypt_text(ticket.description),
                "category": ticket.category,
                "sub_category": ticket.sub_category,
                "priority": ticket.priority,
                "status": ticket.status,
                "extra_fields": ticket.extra_fields,
                "closed_at": ticket.closed_at,
                "created_at": ticket.created_at,
                "updated_at": ticket.updated_at,
                "replies": [
                    {
                        "id": r.id,
                        "ticket_id": r.ticket_id,
                        "author_id": r.author_id,
                        "author_name": r.author.full_name if r.author else "",
                        "author_role": r.author.role if r.author else "admin",
                        "message": decrypt_text(r.message),
                        "is_internal": r.is_internal,
                        "created_at": r.created_at
                    } for r in ticket.replies
                ],
                "attachments": [
                    {
                        "id": att.id,
                        "ticket_id": att.ticket_id,
                        "filename": att.filename,
                        "file_path": att.file_path,
                        "file_size": att.file_size,
                        "content_type": att.content_type,
                        "created_at": att.created_at
                    } for att in ticket.attachments
                ]
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

    @staticmethod
    def admin_reply(db: Session, ticket_id: str, admin_id: uuid.UUID, reply_in):
        try:
            ticket_uuid = uuid.UUID(ticket_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ticket ID format"
            )
            
        try:
            return TicketService.reply_to_ticket_admin(
                db, ticket_uuid, admin_id, reply_in.message, reply_in.is_internal
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @staticmethod
    def admin_update_ticket(db: Session, ticket_id: str, admin_id: uuid.UUID, update_in):
        try:
            ticket_uuid = uuid.UUID(ticket_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ticket ID format"
            )
            
        try:
            return TicketService.update_ticket_admin(db, ticket_uuid, admin_id, update_in)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
