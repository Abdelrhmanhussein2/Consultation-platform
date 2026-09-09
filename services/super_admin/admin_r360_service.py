from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from uuid import UUID

from models import User, ConsultantProfile, Appointment, Invoice, SupportTicket, Rating, AdminActionLog, ConsultantCredential, ConsultantService
from helpers.enums import UserRole

class AdminR360Service:
    @staticmethod
    def search_entities(db: Session, query: Optional[str] = None, entity_type: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        results = []
        q_str = f"%{query}%" if query else "%"

        if not entity_type or entity_type in ["user", "all"]:
            users = db.query(User).filter(
                User.role == UserRole.user,
                (User.full_name.ilike(q_str)) | (User.email.ilike(q_str)) | (User.phone.ilike(q_str))
            ).limit(limit).all()
            for u in users:
                results.append({
                    "id": str(u.id),
                    "name": u.full_name,
                    "title": u.full_name,
                    "subtitle": u.email or u.phone,
                    "type": "user",
                    "status": "active" if u.is_active else "inactive",
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                    "metadata": {"role": u.role, "entity_type": u.entity_type}
                })

        if not entity_type or entity_type in ["consultant", "all"]:
            consultants = db.query(User).filter(
                User.role == UserRole.consultant,
                (User.full_name.ilike(q_str)) | (User.email.ilike(q_str)) | (User.phone.ilike(q_str))
            ).limit(limit).all()

            for c in consultants:
                results.append({
                    "id": str(c.id),
                    "name": c.full_name,
                    "title": c.full_name,
                    "subtitle": c.email or c.phone,

                    "type": "consultant",
                    "status": "approved" if c.is_verified else "pending",
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "metadata": {"role": c.role}
                })

        if not entity_type or entity_type in ["session", "appointment", "all"]:
            sessions = db.query(Appointment).limit(limit).all()
            for s in sessions:
                results.append({
                    "id": str(s.id),
                    "title": f"جلسة #{str(s.id)[:8]}",
                    "subtitle": f"حالة: {s.status}",
                    "type": "session",
                    "status": str(s.status),
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "metadata": {"scheduled_at": s.scheduled_at.isoformat() if s.scheduled_at else None}
                })

        return results[:limit]

    @staticmethod
    def get_entity_360_details(db: Session, entity_type: str, entity_id: str) -> Dict[str, Any]:
        entity_type_clean = entity_type.lower().strip()

        if entity_type_clean == "user":
            user = db.query(User).filter(User.id == entity_id).first()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
            appointments = db.query(Appointment).filter(Appointment.user_id == user.id).all()
            invoices = db.query(Invoice).filter(Invoice.user_id == user.id).all()
            tickets = db.query(SupportTicket).filter(SupportTicket.user_id == user.id).all()

            return {
                "entity_id": str(user.id),
                "entity_type": "user",
                "overview": {
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                },
                "related_records": {
                    "appointments_count": len(appointments),
                    "invoices_count": len(invoices),
                    "tickets_count": len(tickets),
                    "appointments": [{"id": str(a.id), "status": str(a.status), "date": a.scheduled_at.isoformat() if a.scheduled_at else None} for a in appointments[:10]],
                    "invoices": [{"id": str(i.id), "amount": float(i.amount or 0), "status": str(i.status)} for i in invoices[:10]],
                    "tickets": [{"id": str(t.id), "subject": t.subject, "status": str(t.status)} for t in tickets[:10]]
                }
            }

        elif entity_type_clean == "consultant":
            consultant = db.query(User).filter(User.id == entity_id).first()
            if not consultant:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultant not found")

            profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == consultant.id).first()
            credentials = db.query(ConsultantCredential).filter(ConsultantCredential.consultant_id == (profile.id if profile else None)).all()
            services = db.query(ConsultantService).filter(ConsultantService.consultant_id == (profile.id if profile else None)).all()
            appointments = db.query(Appointment).filter(Appointment.consultant_id == (profile.id if profile else None)).all()

            return {
                "entity_id": str(consultant.id),
                "entity_type": "consultant",
                "overview": {
                    "full_name": consultant.full_name,
                    "email": consultant.email,
                    "phone": consultant.phone,
                    "rating_avg": float(profile.rating_avg or 5.0) if profile else 5.0,
                    "total_reviews": profile.total_reviews if profile else 0,
                    "is_verified": consultant.is_verified,
                    "created_at": consultant.created_at.isoformat() if consultant.created_at else None
                },
                "related_records": {
                    "credentials": [{"id": str(c.id), "title": c.title, "status": str(c.verification_status)} for c in credentials],
                    "services": [{"id": str(s.id), "title": s.title, "price": float(s.price or 0)} for s in services],
                    "appointments_count": len(appointments),
                    "appointments": [{"id": str(a.id), "status": str(a.status), "date": a.scheduled_at.isoformat() if a.scheduled_at else None} for a in appointments[:10]]
                }
            }

        elif entity_type_clean in ["session", "appointment"]:
            appointment = db.query(Appointment).filter(Appointment.id == entity_id).first()
            if not appointment:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

            client = db.query(User).filter(User.id == appointment.user_id).first()
            consultant_profile = db.query(ConsultantProfile).filter(ConsultantProfile.id == appointment.consultant_id).first()
            consultant_user = db.query(User).filter(User.id == consultant_profile.user_id).first() if consultant_profile else None
            rating = db.query(Rating).filter(Rating.appointment_id == appointment.id).first()

            return {
                "entity_id": str(appointment.id),
                "entity_type": "session",
                "overview": {
                    "id": str(appointment.id),
                    "status": str(appointment.status),
                    "scheduled_at": appointment.scheduled_at.isoformat() if appointment.scheduled_at else None,
                    "price": float(appointment.price or 0),
                    "created_at": appointment.created_at.isoformat() if appointment.created_at else None
                },
                "related_records": {
                    "client": {"id": str(client.id), "name": client.full_name, "email": client.email} if client else None,
                    "consultant": {"id": str(consultant_user.id), "name": consultant_user.full_name, "email": consultant_user.email} if consultant_user else None,
                    "rating": {"score": rating.score, "comment": rating.comment} if rating else None
                }
            }

        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported entity type: {entity_type}")
