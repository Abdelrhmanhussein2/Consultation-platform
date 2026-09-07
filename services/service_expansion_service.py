import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models import (
    User, ConsultantProfile, ServiceExpansionRequest, Notification,
    UserRole, VerificationStatus, NotificationType
)


class ServiceExpansionService:

    @staticmethod
    def list_pending(db: Session) -> list[ServiceExpansionRequest]:
        """Returns all pending service expansion requests for admin review."""
        return (
            db.query(ServiceExpansionRequest)
            .filter(ServiceExpansionRequest.status == VerificationStatus.pending)
            .order_by(ServiceExpansionRequest.created_at.asc())
            .all()
        )

    @staticmethod
    def review(
        db: Session,
        request_id: uuid.UUID,
        admin_id: uuid.UUID,
        action: str,
        rejection_reason: str | None = None,
    ) -> ServiceExpansionRequest:
        """
        Admin approves or rejects a service expansion request.
        On approval → consultant's role is upgraded to `platform_consultant`.
        """
        exp_req = db.query(ServiceExpansionRequest).filter(
            ServiceExpansionRequest.id == request_id
        ).first()
        if not exp_req:
            raise ValueError("Service expansion request not found")
        if exp_req.status != VerificationStatus.pending:
            raise ValueError("This request has already been reviewed")

        new_status = (
            VerificationStatus.approved if action == "approve" else VerificationStatus.rejected
        )
        exp_req.status = new_status
        exp_req.reviewed_by = admin_id
        exp_req.reviewed_at = datetime.now(timezone.utc)
        exp_req.rejection_reason = rejection_reason
        db.commit()
        db.refresh(exp_req)

        # Fetch the consultant's profile and their user account
        profile = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == exp_req.consultant_id
        ).first()

        if profile:
            # ── Role upgrade ─────────────────────────────────────────
            if new_status == VerificationStatus.approved:
                user = db.query(User).filter(User.id == profile.user_id).first()
                if user and user.role == UserRole.consultant:
                    user.role = UserRole.platform_consultant

            # ── Notification ─────────────────────────────────────────
            db.add(Notification(
                user_id=profile.user_id,
                type=NotificationType.service_request_status_update,
                title="تحديث حالة طلب توسيع الخدمات",
                message=(
                    f"تم {'قبول' if new_status == VerificationStatus.approved else 'رفض'} "
                    f"طلب إضافة الخدمة '{exp_req.service_name}'."
                    f"{f' السبب: {rejection_reason}' if rejection_reason else ''}"
                ),
                related_entity_type="service_expansion_request",
                related_entity_id=exp_req.id,
            ))
            db.commit()

        return exp_req
