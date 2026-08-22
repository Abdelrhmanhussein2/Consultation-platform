import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session
from models import User, SupportTicket, TicketReply, Notification
from helpers.enums import TicketCategory, TicketPriority, TicketStatus, NotificationType

class TicketService:
    @staticmethod
    def create_ticket(db: Session, client_id: uuid.UUID, ticket_in) -> SupportTicket:
        """
        Creates a new support ticket by a client/consultant.
        """
        ticket = SupportTicket(
            submitted_by=client_id,
            subject=ticket_in.subject,
            description=ticket_in.description,
            category=ticket_in.category,
            priority=TicketPriority.medium,
            status=TicketStatus.open
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def admin_create_ticket(db: Session, admin_id: uuid.UUID, ticket_in) -> SupportTicket:
        """
        Allows an admin to manually create a ticket for any user.
        """
        # Validate that submitter exists
        user = db.query(User).filter(User.id == ticket_in.submitted_by).first()
        if not user:
            raise ValueError("Submitter user not found")

        ticket = SupportTicket(
            submitted_by=ticket_in.submitted_by,
            subject=ticket_in.subject,
            description=ticket_in.description,
            category=ticket_in.category,
            priority=ticket_in.priority,
            status=TicketStatus.open,
            assigned_to=ticket_in.assigned_to or admin_id
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket

    @staticmethod
    def list_my_tickets(db: Session, client_id: uuid.UUID) -> List[SupportTicket]:
        """
        Returns tickets created by the logged-in user.
        Internal replies are excluded at the ORM level by temporarily overriding the replies list.
        """
        tickets = db.query(SupportTicket).filter(
            SupportTicket.submitted_by == client_id
        ).order_by(SupportTicket.created_at.desc()).all()

        # Strip internal replies so the user never sees admin-internal notes
        for ticket in tickets:
            ticket.replies = [r for r in ticket.replies if not r.is_internal]

        return tickets

    @staticmethod
    def get_ticket_for_user(db: Session, ticket_id: uuid.UUID, client_id: uuid.UUID) -> SupportTicket:
        """
        Retrieves a ticket for a user, verifying ownership, and excluding internal replies.
        """
        ticket = db.query(SupportTicket).filter(
            SupportTicket.id == ticket_id,
            SupportTicket.submitted_by == client_id
        ).first()
        if not ticket:
            raise ValueError("Ticket not found or access denied")
        
        # We will filter out internal replies dynamically in the response
        return ticket

    @staticmethod
    def list_all_tickets(
        db: Session,
        status: Optional[TicketStatus] = None,
        category: Optional[TicketCategory] = None,
        priority: Optional[TicketPriority] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[SupportTicket]:
        """
        Lists all tickets with administrative filters and search.
        """
        query = db.query(SupportTicket).join(User, SupportTicket.submitted_by == User.id)

        if status:
            query = query.filter(SupportTicket.status == status)
        if category:
            query = query.filter(SupportTicket.category == category)
        if priority:
            query = query.filter(SupportTicket.priority == priority)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    SupportTicket.subject.ilike(search_pattern),
                    SupportTicket.description.ilike(search_pattern),
                    User.full_name.ilike(search_pattern)
                )
            )

        offset = (page - 1) * limit
        return query.order_by(SupportTicket.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_ticket_for_admin(db: Session, ticket_id: uuid.UUID) -> SupportTicket:
        """
        Returns ticket details for admin review (including internal notes and replies).
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
        if not ticket:
            raise ValueError("Ticket not found")
        return ticket

    @staticmethod
    def reply_to_ticket_user(db: Session, ticket_id: uuid.UUID, author_id: uuid.UUID, message: str) -> TicketReply:
        """
        Creates a public reply to a ticket by the owner. Rejects if ticket is closed.
        """
        ticket = db.query(SupportTicket).filter(
            SupportTicket.id == ticket_id,
            SupportTicket.submitted_by == author_id
        ).first()
        if not ticket:
            raise ValueError("Ticket not found or access denied")

        if ticket.status == TicketStatus.closed:
            raise ValueError("لا يمكن الرد على تذكرة مغلقة")

        # Create reply
        reply = TicketReply(
            ticket_id=ticket_id,
            author_id=author_id,
            message=message,
            is_internal=False
        )
        db.add(reply)
        
        # If user replies, change status to open or in_progress to notify admin
        if ticket.status == TicketStatus.resolved:
            ticket.status = TicketStatus.in_progress

        db.commit()
        db.refresh(reply)
        return reply

    @staticmethod
    def reply_to_ticket_admin(
        db: Session, ticket_id: uuid.UUID, admin_id: uuid.UUID, message: str, is_internal: bool = False
    ) -> TicketReply:
        """
        Creates a reply to a ticket by an admin. Automatically triggers notifications for public replies.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
        if not ticket:
            raise ValueError("Ticket not found")

        # Allow admin to reply even if closed, but open/in_progress it
        if ticket.status == TicketStatus.closed and not is_internal:
            ticket.status = TicketStatus.in_progress

        reply = TicketReply(
            ticket_id=ticket_id,
            author_id=admin_id,
            message=message,
            is_internal=is_internal
        )
        db.add(reply)
        db.commit()
        db.refresh(reply)

        # Notify submitter if not internal
        if not is_internal:
            notif = Notification(
                user_id=ticket.submitted_by,
                type=NotificationType.general,
                title="رد جديد على تذكرتك الدعم الفني",
                message=f"قام الدعم الفني بالرد على تذكرتك: '{ticket.subject}'."
            )
            db.add(notif)
            db.commit()

            # Push real-time live WebSocket notification (Phase 3)
            try:
                from services.live_notification_service import LiveNotificationService
                LiveNotificationService.push_notification(
                    user_id=ticket.submitted_by,
                    title="رد جديد على تذكرتك الدعم الفني",
                    message=f"قام الدعم الفني بالرد على تذكرتك: '{ticket.subject}'.",
                    notif_type="support_ticket_reply",
                    notif_id=notif.id,
                    extra={"ticket_id": str(ticket.id), "ticket_subject": ticket.subject}
                )
            except Exception:
                pass

        return reply


    @staticmethod
    def update_ticket_admin(db: Session, ticket_id: uuid.UUID, admin_id: uuid.UUID, update_in) -> SupportTicket:
        """
        Updates support ticket fields (status, priority, internal_note, assignment) by administrator.
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
        if not ticket:
            raise ValueError("Ticket not found")

        status_changed = False
        old_status = ticket.status

        if update_in.priority is not None:
            ticket.priority = update_in.priority
        if update_in.status is not None:
            if ticket.status != update_in.status:
                ticket.status = update_in.status
                status_changed = True
                if update_in.status == TicketStatus.closed:
                    ticket.closed_at = datetime.now(timezone.utc)
                else:
                    ticket.closed_at = None
        if update_in.internal_note is not None:
            ticket.internal_note = update_in.internal_note
        if update_in.assigned_to is not None:
            ticket.assigned_to = update_in.assigned_to

        db.commit()
        db.refresh(ticket)

        # If status changed, send notification to user
        if status_changed:
            arabic_statuses = {
                TicketStatus.open: "مفتوحة",
                TicketStatus.in_progress: "قيد المعالجة",
                TicketStatus.resolved: "تم الحل",
                TicketStatus.closed: "مغلقة"
            }
            status_str = arabic_statuses.get(ticket.status, ticket.status.value)
            notif = Notification(
                user_id=ticket.submitted_by,
                type=NotificationType.general,
                title="تحديث حالة تذكرة الدعم",
                message=f"تم تحديث حالة تذكرتك '{ticket.subject}' إلى '{status_str}'."
            )
            db.add(notif)
            db.commit()

        return ticket
