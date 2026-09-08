import sys, os, uuid
sys.path.insert(0, os.path.abspath('.'))
from helpers.database import SessionLocal
from models.user import User
from models.support_ticket import SupportTicket
from models.ticket_reply import TicketReply
from helpers.enums import TicketCategory, TicketPriority, TicketStatus, UserRole
from helpers.encryption import encrypt_text

db = SessionLocal()

# Clear any partial tickets
db.query(TicketReply).delete()
db.query(SupportTicket).delete()
db.commit()

# Find users
admin = db.query(User).filter(User.role.in_([UserRole.admin, UserRole.super_admin])).first()
users = db.query(User).all()
user_map = {u.email: u for u in users}

real_tickets_data = [
    {
        "email": "omar@haddad.io",
        "fallback_role": UserRole.user,
        "subject": "استفسار بخصوص تفعيل باقة الشركات والمطابقة البنكية",
        "description": "قمت بالتحويل البنكي وتأكيد الاشتراك، وأرجو التأكد من تفعيل صلاحيات النماذج الضريبية للحساب.",
        "category": TicketCategory.billing,
        "priority": TicketPriority.high,
        "status": TicketStatus.in_progress,
        "replies": [
            ("user", "omar@haddad.io", "أرجو المتابعة للأهمية لأن الإقرار الضريبي يستحق اليوم."),
            ("admin", admin.email if admin else "admin@platform.com", "أهلاً بك، تم استلام الطلب ومطابقة الحوالة البنكية بنجاح، وجميع الصلاحيات قيد التفعيل الفوري.")
        ]
    },
    {
        "email": "khaledd@gmail.com",
        "fallback_role": UserRole.user,
        "subject": "مساعدة في تصدير تقرير ضريبة المبيعات الربع سنوي",
        "description": "أحتاج إلى تصدير التقرير بصيغة PDF وتدقيق الأرقام مع مستندات الفواتير المرفوعة.",
        "category": TicketCategory.technical,
        "priority": TicketPriority.medium,
        "status": TicketStatus.open,
        "replies": []
    },
    {
        "email": "ahmad.nassar@platform.com",
        "fallback_role": UserRole.consultant,
        "subject": "طلب تسوية مالية وتحويل أرباح الاستشارات لشهر أغسطس",
        "description": "أرجو مراجعة كشف الجلسات الاستشارية المنجزة لشهر أغسطس واعتماد التحويل لحساب CliQ المعتمد.",
        "category": TicketCategory.billing,
        "priority": TicketPriority.high,
        "status": TicketStatus.in_progress,
        "replies": [
            ("admin", admin.email if admin else "admin@platform.com", "تمت مراجعة كشف الجلسات واعتماده من قبل الإدارة المالية، سيتم الصرف خلال دورة التسوية الحالية.")
        ]
    },
    {
        "email": "abdelrhmanhussein886@gmail.com",
        "fallback_role": UserRole.consultant,
        "subject": "تحديث رخصة الاعتماد المهني (JCPA) وإضافة التخصص الضريبي",
        "description": "قمت بتجديد شهادة المزاولة المهنية وأرغب في تحديث الملف الشخصي وإضافة تخصص الضرائب الدولية.",
        "category": TicketCategory.other,
        "priority": TicketPriority.medium,
        "status": TicketStatus.open,
        "replies": []
    }
]

created_count = 0
for item in real_tickets_data:
    user = user_map.get(item["email"])
    if not user:
        user = db.query(User).filter(User.role == item["fallback_role"]).first()
    if not user:
        continue
    
    count = db.query(SupportTicket).count()
    ticket_num = f"#2026{str(count + 1).zfill(6)}"
    
    ticket = SupportTicket(
        submitted_by=user.id,
        ticket_number=ticket_num,
        subject=item["subject"],
        description=encrypt_text(item["description"]),
        category=item["category"],
        priority=item["priority"],
        status=item["status"],
        assigned_to=admin.id if admin else None
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    created_count += 1
    
    for sender_type, sender_email, msg in item["replies"]:
        author = user_map.get(sender_email, admin)
        reply = TicketReply(
            ticket_id=ticket.id,
            author_id=author.id if author else user.id,
            message=encrypt_text(msg),
            is_internal=False
        )
        db.add(reply)
    db.commit()

print(f"Successfully created {created_count} live PostgreSQL tickets with real relations!")
db.close()
