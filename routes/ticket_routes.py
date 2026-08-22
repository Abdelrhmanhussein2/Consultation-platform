from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from helpers.database import get_db
from models import User
from schemes import TicketCreate, TicketOut, TicketReplyCreate, TicketReplyOut
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
    Initial status is set to 'open' and priority is set to 'medium' by default.
    """
    return TicketController.create_ticket(db, current_user.id, ticket_in)


@router.get(
    "/my",
    response_model=List[TicketOut],
    summary="Get list of my support tickets",
)
def list_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Returns all support tickets submitted by the authenticated user.
    """
    return TicketController.list_my_tickets(db, current_user.id)


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
