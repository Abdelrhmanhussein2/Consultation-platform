import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session
from models import User, SupportTicket, TicketReply, Notification
from helpers.enums import TicketCategory, TicketPriority, TicketStatus, NotificationType, UserRole
from helpers.encryption import encrypt_text, decrypt_text
from services.notification_service import NotificationService

class TicketService:
    @staticmethod
    def create_ticket(db: Session, client_id: uuid.UUID, ticket_in) -> SupportTicket:
        """
        Creates a new support ticket by a client/consultant and alerts platform Admins.
        """
        current_year = datetime.now(timezone.utc).year
        year_start = datetime(current_year, 1, 1, tzinfo=timezone.utc)
        count = db.query(SupportTicket).filter(SupportTicket.created_at >= year_start).count()
        ticket_num = f"#{current_year}{str(count + 1).zfill(6)}"

        raw_desc = ticket_in.description
        encrypted_desc = encrypt_text(raw_desc) if raw_desc else None

        ticket = SupportTicket(
            submitted_by=client_id,
            ticket_number=ticket_num,
            subject=ticket_in.subject,
            description=encrypted_desc,
            category=ticket_in.category,
            sub_category=ticket_in.sub_category,
            priority=ticket_in.priority or TicketPriority.medium,
            status=TicketStatus.new,
            extra_fields=ticket_in.extra_fields
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        ticket.description = raw_desc

        # Dispatch real-time notification to all Admins
        try:
            submitter = db.query(User).filter(User.id == client_id).first()
            submitter_name = submitter.full_name if submitter else "أحد المستخدمين"
            role_label = "المستشار" if submitter and submitter.role == UserRole.consultant else "العميل"
            admins = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).all()
            for admin in admins:
                NotificationService.send(
                    db=db,
                    user_id=admin.id,
                    notification_type=NotificationType.system_announcement,
                    title="تذكرة دعم فني جديدة",
                    message=f"قام {role_label} {submitter_name} بفتح تذكرة دعم فني برقم {ticket_num}: '{ticket.subject}'.",
                    related_entity_type="support_ticket",
                    related_entity_id=ticket.id
                )
        except Exception:
            pass

        return ticket

    @staticmethod
    def admin_create_ticket(db: Session, admin_id: uuid.UUID, ticket_in) -> SupportTicket:
        """
        Allows an admin to manually create a ticket for any user.
        """
        user = db.query(User).filter(User.id == ticket_in.submitted_by).first()
        if not user:
            raise ValueError("Submitter user not found")

        current_year = datetime.now(timezone.utc).year
        year_start = datetime(current_year, 1, 1, tzinfo=timezone.utc)
        count = db.query(SupportTicket).filter(SupportTicket.created_at >= year_start).count()
        ticket_num = f"#{current_year}{str(count + 1).zfill(6)}"

        raw_desc = ticket_in.description
        encrypted_desc = encrypt_text(raw_desc) if raw_desc else None

        ticket = SupportTicket(
            submitted_by=ticket_in.submitted_by,
            ticket_number=ticket_num,
            subject=ticket_in.subject,
            description=encrypted_desc,
            category=ticket_in.category,
            priority=ticket_in.priority,
            status=TicketStatus.new,
            assigned_to=ticket_in.assigned_to or admin_id
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        ticket.description = raw_desc
        return ticket

    @staticmethod
    def list_my_tickets(
        db: Session,
        client_id: uuid.UUID,
        status: Optional[TicketStatus] = None,
        category: Optional[TicketCategory] = None,
        priority: Optional[TicketPriority] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[SupportTicket]:
        """
        Returns tickets created by the logged-in user with filters, search, and pagination.
        """
        query = db.query(SupportTicket).filter(SupportTicket.submitted_by == client_id)

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
                    SupportTicket.ticket_number.ilike(search_pattern)
                )
            )

        offset = (page - 1) * limit
        tickets = query.order_by(SupportTicket.created_at.desc()).offset(offset).limit(limit).all()

        for ticket in tickets:
            ticket.description = decrypt_text(ticket.description)
            ticket.replies = [r for r in ticket.replies if not r.is_internal]
            for r in ticket.replies:
                r.message = decrypt_text(r.message)

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
        
        ticket.description = decrypt_text(ticket.description)
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
                    SupportTicket.ticket_number.ilike(search_pattern),
                    User.full_name.ilike(search_pattern)
                )
            )

        offset = (page - 1) * limit
        tickets = query.order_by(SupportTicket.created_at.desc()).offset(offset).limit(limit).all()

        for t in tickets:
            t.description = decrypt_text(t.description)
            for r in t.replies:
                r.message = decrypt_text(r.message)

        return tickets

    @staticmethod
    def get_ticket_for_admin(db: Session, ticket_id: uuid.UUID) -> SupportTicket:
        """
        Returns ticket details for admin review (including internal notes and replies).
        """
        ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
        if not ticket:
            raise ValueError("Ticket not found")
        ticket.description = decrypt_text(ticket.description)
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

        raw_msg = message.strip() if message else ""
        encrypted_msg = encrypt_text(raw_msg) if raw_msg else ""

        # Create reply with encrypted message
        reply = TicketReply(
            ticket_id=ticket_id,
            author_id=author_id,
            message=encrypted_msg,
            is_internal=False
        )
        db.add(reply)
        
        if ticket.status == TicketStatus.resolved:
            ticket.status = TicketStatus.in_progress

        db.commit()
        db.refresh(reply)
        reply.message = raw_msg

        # Notify Admin / Support team that user replied
        try:
            submitter = db.query(User).filter(User.id == author_id).first()
            submitter_name = submitter.full_name if submitter else "المستخدم"
            admins = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).all()
            for admin in admins:
                NotificationService.send(
                    db=db,
                    user_id=admin.id,
                    notification_type=NotificationType.system_announcement,
                    title="رد جديد من المستخدم على التذكرة",
                    message=f"قام {submitter_name} بإضافة رد على تذكرة الدعم {ticket.ticket_number}: '{raw_msg[:60]}...'",
                    related_entity_type="support_ticket",
                    related_entity_id=ticket.id
                )
        except Exception:
            pass

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

        if ticket.status == TicketStatus.closed and not is_internal:
            ticket.status = TicketStatus.in_progress

        raw_msg = message.strip() if message else ""
        encrypted_msg = encrypt_text(raw_msg) if raw_msg else ""

        reply = TicketReply(
            ticket_id=ticket_id,
            author_id=admin_id,
            message=encrypted_msg,
            is_internal=is_internal
        )
        db.add(reply)
        db.commit()
        db.refresh(reply)

        # Notify submitter user if reply is public
        if not is_internal:
            try:
                NotificationService.send(
                    db=db,
                    user_id=ticket.submitted_by,
                    notification_type=NotificationType.general,
                    title="رد جديد على تذكرتك للدعم الفني",
                    message=f"قام فريق الدعم الفني بالرد على تذكرتك {ticket.ticket_number} ('{ticket.subject}').",
                    related_entity_type="support_ticket",
                    related_entity_id=ticket.id
                )
            except Exception:
                pass

        reply.message = raw_msg
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
            prio = update_in.priority
            if isinstance(prio, str):
                prio_map = {
                    "منخفضة": TicketPriority.low,
                    "متوسطة": TicketPriority.medium,
                    "عالية": TicketPriority.high,
                    "low": TicketPriority.low,
                    "medium": TicketPriority.medium,
                    "high": TicketPriority.high
                }
                ticket.priority = prio_map.get(prio, TicketPriority.medium)
            else:
                ticket.priority = prio

        if update_in.status is not None:
            st = update_in.status
            if isinstance(st, str):
                status_map = {
                    "جديد": TicketStatus.new,
                    "مفتوح": TicketStatus.open,
                    "قيد المراجعة": TicketStatus.reviewing,
                    "قيد المعالجة": TicketStatus.in_progress,
                    "بانتظار رد المستخدم": TicketStatus.waiting_user,
                    "تم التصعيد": TicketStatus.escalated,
                    "تم الحل": TicketStatus.resolved,
                    "مغلق": TicketStatus.closed,
                    "new": TicketStatus.new,
                    "open": TicketStatus.open,
                    "in_progress": TicketStatus.in_progress,
                    "reviewing": TicketStatus.reviewing,
                    "waiting_user": TicketStatus.waiting_user,
                    "escalated": TicketStatus.escalated,
                    "resolved": TicketStatus.resolved,
                    "closed": TicketStatus.closed
                }
                new_status = status_map.get(st, TicketStatus.in_progress)
            else:
                new_status = st

            if ticket.status != new_status:
                ticket.status = new_status
                status_changed = True
                if new_status == TicketStatus.closed:
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
                TicketStatus.new: "جديد",
                TicketStatus.open: "مفتوح",
                TicketStatus.reviewing: "قيد المراجعة",
                TicketStatus.in_progress: "قيد المعالجة",
                TicketStatus.waiting_user: "بانتظار ردك",
                TicketStatus.escalated: "تم التصعيد للإدارة",
                TicketStatus.resolved: "تم الحل",
                TicketStatus.closed: "مغلق"
            }
            status_str = arabic_statuses.get(ticket.status, ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status))
            try:
                NotificationService.send(
                    db=db,
                    user_id=ticket.submitted_by,
                    notification_type=NotificationType.general,
                    title="تحديث حالة تذكرة الدعم الفني",
                    message=f"تم تحديث حالة تذكرتك {ticket.ticket_number} ('{ticket.subject}') إلى '{status_str}'.",
                    related_entity_type="support_ticket",
                    related_entity_id=ticket.id
                )
            except Exception:
                pass

        return ticket
