import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from models import User, ConsultantProfile, UserRole, VerificationStatus
from services.notification_service import NotificationService

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
