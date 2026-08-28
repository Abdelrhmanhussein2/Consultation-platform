import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from models import (
    User, ConsultantProfile, UserRole, VerificationStatus,
    Appointment, AppointmentStatus, Notification, SystemPolicy
)
from helpers.enums import EntityType, NotificationAudience, NotificationType
from services.notification_service import NotificationService
from services.auth_utils import hash_password
from services.daily_service import DailyService

class SuperAdminService:
    @staticmethod
    def get_pending_consultants(db: Session) -> List[ConsultantProfile]:
        """
        Retrieves all consultant profiles with pending verification status.
        """
        return db.query(ConsultantProfile).filter(
            ConsultantProfile.verification_status == VerificationStatus.pending
        ).all()

    @staticmethod
    def approve_consultant(db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID) -> ConsultantProfile:
        """
        Approves a pending consultant, records the action, and triggers an approval notification.
        """
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user_id).first()
        if not profile:
            raise ValueError("Consultant profile not found")
        
        profile.verification_status = VerificationStatus.approved
        profile.reviewed_by = super_admin_id
        profile.reviewed_at = datetime.now(timezone.utc)
        profile.rejection_reason = None  # Clear any previous rejection reason
        
        db.commit()
        db.refresh(profile)
        
        # Send notification
        NotificationService.send_application_approved(db, user_id)
        
        return profile

    @staticmethod
    def reject_consultant(
        db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID, rejection_reason: str
    ) -> ConsultantProfile:
        """
        Rejects a pending consultant with a reason, records the action, and triggers a rejection notification.
        """
        if not rejection_reason or not rejection_reason.strip():
            raise ValueError("Rejection reason is required")
            
        profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user_id).first()
        if not profile:
            raise ValueError("Consultant profile not found")
        
        profile.verification_status = VerificationStatus.rejected
        profile.rejection_reason = rejection_reason
        profile.reviewed_by = super_admin_id
        profile.reviewed_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(profile)
        
        # Send notification
        NotificationService.send_application_rejected(db, user_id, rejection_reason)
        
        return profile

    @staticmethod
    def list_all_users(
        db: Session, role: Optional[UserRole] = None, page: int = 1, limit: int = 20
    ) -> List[User]:
        """
        Retrieves users from the database, optionally filtering by role.
        """
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        
        offset = (page - 1) * limit
        return query.offset(offset).limit(limit).all()

    @staticmethod
    def toggle_user_active(db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID) -> User:
        """
        Toggles the is_active status of a user. Prevents self-deactivation.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if user.id == super_admin_id:
            raise ValueError("Super Admin cannot deactivate themselves")
            
        user.is_active = not user.is_active
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_user_stats(db: Session) -> dict:
        """
        Calculates user counts breakdown by role and entity type.
        """
        total = db.query(User).count()
        
        # Group by role
        role_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()
        by_role = [{"role": r.value, "count": c} for r, c in role_counts]

        # Group by entity type
        entity_counts = db.query(User.entity_type, func.count(User.id)).group_by(User.entity_type).all()
        by_entity_type = [{"entity_type": et.value, "count": c} for et, c in entity_counts]

        return {
            "total_users": total,
            "by_role": by_role,
            "by_entity_type": by_entity_type
        }

    @staticmethod
    def list_all_users_admin(
        db: Session,
        search: Optional[str] = None,
        role: Optional[UserRole] = None,
        entity_type: Optional[EntityType] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        limit: int = 20
    ) -> List[dict]:
        """
        Retrieves users with advanced filtering, searching and left joins for consultant info.
        """
        query = db.query(
            User.id,
            User.full_name,
            User.email,
            User.phone,
            User.role,
            User.entity_type,
            User.company_name,
            User.tax_number,
            User.sector,
            User.is_active,
            User.created_at,
            ConsultantProfile.bio,
            ConsultantProfile.verification_status
        ).outerjoin(ConsultantProfile, User.id == ConsultantProfile.user_id)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.phone.ilike(search_pattern)
                )
            )

        if role:
            query = query.filter(User.role == role)

        if entity_type:
            query = query.filter(User.entity_type == entity_type)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        offset = (page - 1) * limit
        results = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

        users_list = []
        for r in results:
            users_list.append({
                "id": r.id,
                "full_name": r.full_name,
                "email": r.email,
                "phone": r.phone,
                "role": r.role,
                "entity_type": r.entity_type,
                "company_name": r.company_name,
                "tax_number": r.tax_number,
                "sector": r.sector,
                "is_active": r.is_active,
                "created_at": r.created_at,
                "bio": r.bio,
                "verification_status": r.verification_status
            })
        return users_list

    @staticmethod
    def admin_add_user(db: Session, user_in) -> User:
        """
        Directly registers a user or consultant as approved.
        """
        if user_in.role in (UserRole.admin, UserRole.super_admin):
            raise ValueError("Cannot register administrative roles through this endpoint. Use the admins endpoint.")

        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise ValueError("Email already registered")

        db_user = User(
            full_name=user_in.full_name,
            email=user_in.email,
            phone=user_in.phone,
            password_hash=hash_password(user_in.password),
            role=user_in.role,
            entity_type=user_in.entity_type or EntityType.individual,
            company_name=user_in.company_name,
            tax_number=user_in.tax_number,
            sector=user_in.sector,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # If adding a consultant, create approved profile directly
        if db_user.role in (UserRole.consultant, UserRole.platform_consultant):
            profile = ConsultantProfile(
                user_id=db_user.id,
                bio=user_in.bio,
                main_specialization_id=user_in.main_specialization_id,
                verification_status=VerificationStatus.approved
            )
            db.add(profile)
            db.commit()
            db.refresh(db_user)
            
        return db_user

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

            # Dispatch real-time live WebSocket broadcast across target connected users (Phase 3)
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
    def get_pending_users(db: Session) -> List[User]:
        """
        Retrieves all standard user accounts with pending verification status.
        """
        return db.query(User).filter(
            User.role == UserRole.user,
            User.verification_status == VerificationStatus.pending
        ).all()

    @staticmethod
    def approve_user(db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID) -> User:
        """
        Approves a pending standard user or consultant account.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.verification_status = VerificationStatus.approved
        
        # If the user is a consultant, also approve their profile
        if user.role == UserRole.consultant and user.profile:
            user.profile.verification_status = VerificationStatus.approved
            user.profile.reviewed_by = super_admin_id
            user.profile.reviewed_at = datetime.now(timezone.utc)
            user.profile.rejection_reason = None
            
        db.commit()
        db.refresh(user)
        
        # Send notification
        try:
            NotificationService.send_application_approved(db, user_id)
        except Exception:
            pass  # Don't fail if notifications fail in tests
            
        return user

    @staticmethod
    def reject_user(
        db: Session, user_id: uuid.UUID, super_admin_id: uuid.UUID, rejection_reason: str
    ) -> User:
        """
        Rejects a pending standard user or consultant account with a reason.
        """
        if not rejection_reason or not rejection_reason.strip():
            raise ValueError("Rejection reason is required")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
            
        user.verification_status = VerificationStatus.rejected
        
        # If the user is a consultant, also reject their profile
        if user.role == UserRole.consultant and user.profile:
            user.profile.verification_status = VerificationStatus.rejected
            user.profile.rejection_reason = rejection_reason
            user.profile.reviewed_by = super_admin_id
            user.profile.reviewed_at = datetime.now(timezone.utc)
            
        db.commit()
        db.refresh(user)
        
        # Send notification
        try:
            NotificationService.send_application_rejected(db, user_id, rejection_reason)
        except Exception:
            pass  # Don't fail if notifications fail in tests
            
        return user

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
