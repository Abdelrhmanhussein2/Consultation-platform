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
            # ── Role upgrade & Account Activation ─────────────────────
            if new_status == VerificationStatus.approved:
                profile.verification_status = VerificationStatus.approved
                user = db.query(User).filter(User.id == profile.user_id).first()
                if user:
                    user.verification_status = VerificationStatus.approved
                    user.is_active = True
                    if user.role == UserRole.consultant:
                        user.role = UserRole.platform_consultant


                if exp_req.requested_specialization_id:
                    if "تغيير" in (exp_req.service_name or ""):
                        profile.main_specialization_id = exp_req.requested_specialization_id
                    
                    # Add to credentials if not already present
                    from models.consultant_credential import ConsultantCredential
                    existing_cred = db.query(ConsultantCredential).filter(
                        ConsultantCredential.consultant_id == profile.id,
                        ConsultantCredential.specialization_id == exp_req.requested_specialization_id
                    ).first()
                    if not existing_cred:
                        db.add(ConsultantCredential(
                            consultant_id=profile.id,
                            specialization_id=exp_req.requested_specialization_id,
                            document_url=exp_req.proof_document_url or "https://diwan.jo/docs/credentials",
                            status=VerificationStatus.approved,
                            reviewed_by=admin_id,
                            reviewed_at=datetime.now(timezone.utc)
                        ))
                    else:
                        existing_cred.status = VerificationStatus.approved
                        existing_cred.reviewed_by = admin_id
                        existing_cred.reviewed_at = datetime.now(timezone.utc)

            # ── Notification ─────────────────────────────────────────
            try:
                from services.notification_service import NotificationService
                notif_msg = (
                    f"تمت الموافقة على طلب اعتماد التخصص '{exp_req.service_name}' بنجاح وتحديث ملفك المهني."
                    if new_status == VerificationStatus.approved else
                    f"تم رفض طلب اعتماد التخصص '{exp_req.service_name}'. السبب: {rejection_reason or 'يرجى مراجعة الوثائق وإعادة التقديم.'}"
                )
                NotificationService.send(
                    db=db,
                    user_id=profile.user_id,
                    notification_type=NotificationType.service_request_status_update,
                    title="تحديث حالة طلب التخصص",
                    message=notif_msg,
                    related_entity_type="service_expansion_request",
                    related_entity_id=exp_req.id,
                )
            except Exception as ex:
                print("Notification dispatch error:", ex)

        return exp_req

