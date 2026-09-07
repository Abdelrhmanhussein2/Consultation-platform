import uuid
from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy.orm import Session

from models import (
    User, Appointment, Notification, SystemPolicy,
    UserRole, AppointmentStatus, NotificationType
)
from helpers.enums import EntityType, NotificationAudience
from services.daily_service import DailyService


class AdminSessionsService:
    @staticmethod
    def broadcast_notification(
        db: Session,
        audience: NotificationAudience,
        title: str,
        message: str,
        notification_type: NotificationType
    ) -> int:
        """
        Sends notifications to target audience in bulk.
        """
        query = db.query(User).filter(User.is_active == True)

        if audience == NotificationAudience.users_only:
            query = query.filter(User.role == UserRole.user)
        elif audience == NotificationAudience.consultants_only:
            query = query.filter(User.role.in_([UserRole.consultant, UserRole.platform_consultant]))
        elif audience == NotificationAudience.companies_only:
            query = query.filter(User.entity_type == EntityType.company)
        elif audience == NotificationAudience.researchers_only:
            query = query.filter(User.entity_type == EntityType.researcher)
        elif audience == NotificationAudience.admins_only:
            query = query.filter(User.role.in_([UserRole.admin, UserRole.super_admin]))

        target_users = query.all()

        notifications_to_add = []
        for u in target_users:
            notif = Notification(
                user_id=u.id,
                type=notification_type,
                title=title,
                message=message
            )
            notifications_to_add.append(notif)
            
        if notifications_to_add:
            db.bulk_save_objects(notifications_to_add)
            db.commit()

            try:
                from services.live_notification_service import LiveNotificationService
                aud_val = audience.value if hasattr(audience, "value") else str(audience)
                LiveNotificationService.broadcast_announcement(
                    audience=aud_val,
                    title=title,
                    message=message
                )
            except Exception:
                pass

        return len(notifications_to_add)

    @staticmethod
    def admin_get_all_sessions(db: Session) -> list:
        """
        Returns all scheduled video and consultation sessions with client and consultant metadata.
        """
        appointments = db.query(Appointment).order_by(Appointment.scheduled_at.desc()).all()

        results = []
        for appt in appointments:
            results.append({
                "appointment_id": appt.id,
                "client_id": appt.user_id,
                "client_name": appt.user.full_name if appt.user else "عميل المنصة",
                "consultant_profile_id": appt.consultant_id,
                "consultant_name": appt.consultant.user.full_name if (appt.consultant and appt.consultant.user) else "مستشار المنصة",
                "scheduled_at": appt.scheduled_at,
                "duration_minutes": appt.duration_minutes,
                "status": appt.status,
                "session_room_name": appt.session_room_name,
                "session_room_url": appt.session_room_url,
                "created_at": appt.created_at,
            })
        return results

    @staticmethod
    def admin_update_session_status(db: Session, appointment_id: uuid.UUID, new_status: AppointmentStatus) -> dict:
        """
        Updates the status of an appointment (e.g. from kanban drag & drop).
        """
        appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appt:
            raise ValueError("Appointment not found")

        appt.status = new_status
        db.commit()
        db.refresh(appt)

        return {
            "appointment_id": appt.id,
            "status": appt.status,
            "updated_at": datetime.now(timezone.utc)
        }

    @staticmethod
    def admin_join_session(db: Session, appointment_id: uuid.UUID, admin_user: User) -> dict:
        """
        Creates a meeting token for the administrator to join a live video session as an observer.
        """
        appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appt:
            raise ValueError("Appointment not found")
        if not appt.session_room_url or not appt.session_room_name:
            raise ValueError("Video session room has not been initialized for this appointment")
            
        token = DailyService.generate_meeting_token(
            room_name=appt.session_room_name,
            user_name=f"[Admin] {admin_user.full_name}",
            is_owner=False  # Observer
        )
        expires_at = datetime.now(timezone.utc) + timedelta(hours=2)
        return {
            "room_url": appt.session_room_url,
            "token": token,
            "expires_at": expires_at
        }

    @staticmethod
    def create_system_policy(db: Session, title: str, policy_type: str, version: str, content: str) -> SystemPolicy:
        """
        Creates a new version of a policy type and sets it active, deactivating all others of the same type.
        """
        if not title or not title.strip():
            raise ValueError("Title is required")
        if not policy_type or not policy_type.strip():
            raise ValueError("Policy type is required")
        if not version or not version.strip():
            raise ValueError("Version is required")
        if not content or not content.strip():
            raise ValueError("Content is required")

        # Deactivate existing active policies of the same type
        db.query(SystemPolicy).filter(
            SystemPolicy.policy_type == policy_type,
            SystemPolicy.is_active == True
        ).update({"is_active": False})
        
        # Create new active policy
        policy = SystemPolicy(
            title=title,
            policy_type=policy_type,
            version=version,
            content=content,
            is_active=True
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return policy

    @staticmethod
    def list_system_policies(db: Session) -> List[SystemPolicy]:
        """
        Lists all system policies.
        """
        return db.query(SystemPolicy).order_by(SystemPolicy.policy_type, SystemPolicy.created_at.desc()).all()

    @staticmethod
    def get_active_policies(db: Session) -> List[SystemPolicy]:
        """
        Gets all current active system policies.
        """
        return db.query(SystemPolicy).filter(SystemPolicy.is_active == True).order_by(SystemPolicy.policy_type).all()
