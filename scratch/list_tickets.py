import sys, os
sys.path.insert(0, os.path.abspath('.'))
from helpers.database import SessionLocal
from models.support_ticket import SupportTicket
from models.ticket_reply import TicketReply
from models.user import User

db = SessionLocal()
tickets = db.query(SupportTicket).all()
print(f'Total tickets in DB: {len(tickets)}')
for t in tickets:
    user = db.query(User).filter(User.id == t.user_id).first()
    uname = user.full_name if user else 'Unknown'
    urole = user.role.value if user and hasattr(user.role, 'value') else (user.role if user else 'Unknown')
    print(f'Ticket #{t.ticket_number} (ID: {t.id}): subject="{t.subject}", user={uname} ({urole}), status={t.status.value if hasattr(t.status, "value") else t.status}, priority={t.priority.value if hasattr(t.priority, "value") else t.priority}, replies={len(t.replies)}')
    for r in t.replies:
        print(f'   Reply from {r.author_name or r.author_role}: {r.message[:60]}...')
db.close()
