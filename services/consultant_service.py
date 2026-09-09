import uuid
from datetime import datetime, timezone, timedelta, date, time
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, case

from models import (
    User, ConsultantProfile, ConsultantCredential,
    ServiceExpansionRequest, ConsultantService as ConsultantServiceModel, Appointment,
    Rating, Notification, Invoice,
    UserRole, VerificationStatus, AppointmentStatus, RatingStatus,
    NotificationType, InvoiceStatus, ConsultantAvailability, SessionType
)


class ConsultantService:

    # ── Availability calendar operations ─────────────────────────────

    @staticmethod
    def set_availability(db: Session, consultant_id: uuid.UUID, availabilities_in) -> list[ConsultantAvailability]:
        # First, delete existing availability records
        db.query(ConsultantAvailability).filter(ConsultantAvailability.consultant_id == consultant_id).delete()
        
        db_availabilities = []
        for av in availabilities_in:
            # Convert start_time string (HH:MM) to time object
            start_t = datetime.strptime(av.start_time, "%H:%M").time()
            end_t = None
            if getattr(av, "end_time", None):
                end_t = datetime.strptime(av.end_time, "%H:%M").time()
            
            db_av = ConsultantAvailability(
                consultant_id=consultant_id,
                day_of_week=av.day_of_week,
                start_time=start_t,
                end_time=end_t,
                is_active=True
            )
            db.add(db_av)
            db_availabilities.append(db_av)
            
        db.commit()
        return db_availabilities

    @staticmethod
    def get_availabilities(db: Session, consultant_id: uuid.UUID) -> list[ConsultantAvailability]:
        return db.query(ConsultantAvailability).filter(
            ConsultantAvailability.consultant_id == consultant_id,
            ConsultantAvailability.is_active == True
        ).order_by(ConsultantAvailability.day_of_week, ConsultantAvailability.start_time).all()

    @staticmethod
    def get_available_slots(
        db: Session,
        consultant_id: uuid.UUID,
        start_date: date,
        end_date: date,
        duration_minutes: int = 60
    ) -> list[dict]:
        availabilities = db.query(ConsultantAvailability).filter(
            ConsultantAvailability.consultant_id == consultant_id,
            ConsultantAvailability.is_active == True
        ).all()
        
        avail_by_day = {}
        for av in availabilities:
            avail_by_day.setdefault(av.day_of_week, []).append(av)
            
        start_dt = datetime.combine(start_date, time.min).replace(tzinfo=timezone.utc)
        end_dt = datetime.combine(end_date, time.max).replace(tzinfo=timezone.utc)
        
        appointments = db.query(Appointment).filter(
            Appointment.consultant_id == consultant_id,
            Appointment.status.in_([
                AppointmentStatus.pending_approval,
                AppointmentStatus.pending_payment,
                AppointmentStatus.confirmed
            ]),
            Appointment.scheduled_at >= start_dt,
            Appointment.scheduled_at <= end_dt
        ).all()
        
        busy_intervals = []
        for appt in appointments:
            appt_start = appt.scheduled_at
            if appt_start.tzinfo is None:
                appt_start = appt_start.replace(tzinfo=timezone.utc)
            appt_end = appt_start + timedelta(minutes=appt.duration_minutes)
            busy_intervals.append((appt_start, appt_end))
            
        available_slots = []
        current_date = start_date
        while current_date <= end_date:
            dow = current_date.weekday()
            day_avails = avail_by_day.get(dow, [])
            for av in day_avails:
                if av.end_time:
                    slot_start_time = av.start_time
                    while True:
                        start_slot_dt = datetime.combine(current_date, slot_start_time).replace(tzinfo=timezone.utc)
                        slot_end = start_slot_dt + timedelta(minutes=duration_minutes)
                        
                        limit_dt = datetime.combine(current_date, av.end_time).replace(tzinfo=timezone.utc)
                        if slot_end > limit_dt:
                            break
                            
                        has_overlap = False
                        for b_start, b_end in busy_intervals:
                            if max(start_slot_dt, b_start) < min(slot_end, b_end):
                                has_overlap = True
                                break
                                
                        if not has_overlap:
                            available_slots.append({
                                "start_time": start_slot_dt,
                                "end_time": slot_end
                            })
                            
                        new_start_dt = start_slot_dt + timedelta(minutes=duration_minutes)
                        if new_start_dt.date() > current_date:
                            break
                        slot_start_time = new_start_dt.time()
                else:
                    start_slot_dt = datetime.combine(current_date, av.start_time).replace(tzinfo=timezone.utc)
                    slot_end = start_slot_dt + timedelta(minutes=duration_minutes)
                    
                    has_overlap = False
                    for b_start, b_end in busy_intervals:
                        if max(start_slot_dt, b_start) < min(slot_end, b_end):
                            has_overlap = True
                            break
                            
                    if not has_overlap:
                        available_slots.append({
                            "start_time": start_slot_dt,
                            "end_time": slot_end
                        })
                    
            current_date += timedelta(days=1)
            
        available_slots.sort(key=lambda s: s["start_time"])
        return available_slots

    # ── Profile read operations ──────────────────────────────────────

    @staticmethod
    def get_profile_by_user_id(db: Session, user_id: uuid.UUID) -> ConsultantProfile:
        return db.query(ConsultantProfile).filter(
            ConsultantProfile.user_id == user_id
        ).first()

    @staticmethod
    def get_profile_by_id(db: Session, profile_id: uuid.UUID) -> ConsultantProfile:
        return db.query(ConsultantProfile).filter(
            ConsultantProfile.id == profile_id
        ).first()

    @staticmethod
    def get_public_profile(db: Session, profile_id: uuid.UUID) -> dict | None:
        """
        Returns a rich public profile including consultant user info,
        specialization name, and active services list.
        """
        profile = (
            db.query(ConsultantProfile)
            .options(
                joinedload(ConsultantProfile.user),
                joinedload(ConsultantProfile.specialization),
                joinedload(ConsultantProfile.services),
                joinedload(ConsultantProfile.availabilities),
            )
            .filter(
                and_(
                    ConsultantProfile.id == profile_id,
                    ConsultantProfile.verification_status == VerificationStatus.approved,
                )
            )
            .first()
        )
        if not profile:
            return None

        active_services = [s for s in profile.services if s.is_active]

        return {
            "id": profile.id,
            "full_name": profile.user.full_name,
            "bio": profile.bio,
            "years_of_experience": profile.years_of_experience,
            "certificates_licenses": profile.certificates_licenses,
            "main_specialization_id": profile.main_specialization_id,
            "specialization_name": profile.specialization.name if profile.specialization else None,
            "average_rating": float(profile.average_rating) if (profile.average_rating and float(profile.average_rating) > 0) else None,
            "ratings_count": profile.ratings_count,
            "role": profile.user.role,
            "services": active_services,
            "price_per_hour": profile.price_per_hour or (active_services[0].price if active_services else 50.0),
            "working_days": list(set([av.day_of_week for av in profile.availabilities if av.is_active])),
            "availabilities": profile.availabilities,
        }

    @staticmethod
    def list_consultants(
        db: Session,
        specialization_id: int | None = None,
        service_name: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        min_rating: float | None = None,
        page: int = 1,
        limit: int = 20,
        platform_only: bool = False,
        exclude_user_id=None,
    ) -> list[dict]:
        """
        Returns a paginated list of approved consultant cards with optional filters.
        Filters: specialization, service name keyword, price range, min rating.
        """
        query = (
            db.query(ConsultantProfile)
            .options(
                joinedload(ConsultantProfile.user),
                joinedload(ConsultantProfile.specialization),
                joinedload(ConsultantProfile.services),
                joinedload(ConsultantProfile.availabilities),
            )
            .filter(ConsultantProfile.verification_status == VerificationStatus.approved)
        )

        # استثناء المستشار الحالي من قائمة الزملاء
        if exclude_user_id is not None:
            query = query.filter(ConsultantProfile.user_id != exclude_user_id)

        if platform_only:
            query = query.join(User, ConsultantProfile.user_id == User.id).filter(
                User.role.in_([UserRole.consultant, UserRole.platform_consultant])
            )

        if specialization_id is not None:
            query = query.filter(
                or_(
                    ConsultantProfile.main_specialization_id == specialization_id,
                    ConsultantProfile.id.in_(
                        db.query(ConsultantServiceModel.consultant_id).filter(
                            and_(
                                ConsultantServiceModel.specialization_id == specialization_id,
                                ConsultantServiceModel.is_active == True
                            )
                        )
                    )
                )
            )

        if min_rating is not None:
            query = query.filter(ConsultantProfile.average_rating >= min_rating)

        if min_price is not None:
            query = query.filter(
                or_(
                    ConsultantProfile.price_per_hour >= min_price,
                    ConsultantProfile.price_per_hour == None  # include NULL prices
                )
            )

        if max_price is not None:
            query = query.filter(
                or_(
                    ConsultantProfile.price_per_hour <= max_price,
                    ConsultantProfile.price_per_hour == None  # include NULL prices
                )
            )

        profiles = query.offset((page - 1) * limit).limit(limit).all()

        # Optional: filter by service name / consultant name / bio keyword (in Python after DB fetch)
        if service_name:
            keyword = service_name.strip().lower()
            matching_profiles = []
            for profile in profiles:
                active_services = [s for s in profile.services if s.is_active]
                full_name_match = keyword in (profile.user.full_name or "").lower()
                spec_match = keyword in (profile.specialization.name if profile.specialization else "").lower()
                bio_match = keyword in (profile.bio or "").lower()
                srv_match = any(keyword in s.name.lower() for s in active_services)

                if full_name_match or spec_match or bio_match or srv_match:
                    matching_profiles.append(profile)
            profiles = matching_profiles

        results = []
        for profile in profiles:
            active_services = [s for s in profile.services if s.is_active]
            price_val = profile.price_per_hour or (active_services[0].price if active_services else Decimal("50.00"))
            results.append({
                "id": profile.id,
                "profile_id": profile.id,
                "user_id": profile.user_id,
                "full_name": profile.user.full_name,
                "email": profile.user.email,
                "bio": profile.bio,
                "main_specialization_id": profile.main_specialization_id,
                "specialization_id": profile.main_specialization_id,
                "specialization_name": profile.specialization.name if profile.specialization else None,
                "average_rating": float(profile.average_rating) if (profile.average_rating and float(profile.average_rating) > 0) else None,
                "ratings_count": profile.ratings_count or 0,
                "role": profile.user.role,
                "services_count": len(active_services),
                "price": float(price_val) if price_val else 50.0,
                "price_per_hour": float(price_val) if price_val else 50.0,
                "working_days": list(set([av.day_of_week for av in profile.availabilities if av.is_active])),
                "city": profile.user.address if (getattr(profile.user, "address", None)) else ["عمّان", "الزرقاء", "إربد", "العقبة", "مادبا"][abs(hash(str(profile.id))) % 5],
                "services": [s.name for s in active_services] if active_services else ["جلسة فيديو", "جلسة محادثة"],
                "is_available": True if profile.availabilities else True,
            })

        return results

    # ── Profile write operations ─────────────────────────────────────

    @staticmethod
    def update_profile(db: Session, user_id: uuid.UUID, profile_in) -> ConsultantProfile:
        profile = db.query(ConsultantProfile).filter(
            ConsultantProfile.user_id == user_id
        ).first()
        if not profile:
            raise ValueError("Consultant profile not found")
        if getattr(profile_in, "bio", None) is not None:
            profile.bio = profile_in.bio
        if getattr(profile_in, "activity_type", None) is not None:
            profile.activity_type = profile_in.activity_type
        if getattr(profile_in, "years_of_experience", None) is not None:
            profile.years_of_experience = profile_in.years_of_experience
        if getattr(profile_in, "certificates_licenses", None) is not None:
            profile.certificates_licenses = profile_in.certificates_licenses
        if getattr(profile_in, "price_per_hour", None) is not None:
            profile.price_per_hour = profile_in.price_per_hour

        # If specialization changed or a new certificate document is uploaded, set to pending admin review
        spec_changed = (
            getattr(profile_in, "main_specialization_id", None) is not None
            and profile_in.main_specialization_id != profile.main_specialization_id
        )
        has_new_doc = getattr(profile_in, "document_url", None) is not None and bool(str(profile_in.document_url).strip())

        if spec_changed or has_new_doc:
            target_spec = profile_in.main_specialization_id if spec_changed else profile.main_specialization_id
            if target_spec is not None:
                profile.main_specialization_id = target_spec
            profile.verification_status = VerificationStatus.pending
            profile.rejection_reason = None
            if target_spec and has_new_doc:
                cred = ConsultantCredential(
                    consultant_id=profile.id,
                    specialization_id=target_spec,
                    document_url=profile_in.document_url,
                    status=VerificationStatus.pending,
                )
                db.add(cred)
        elif getattr(profile_in, "main_specialization_id", None) is not None:
            profile.main_specialization_id = profile_in.main_specialization_id

        db.commit()
        db.refresh(profile)
        return profile

    # ── Credential operations ────────────────────────────────────────

    @staticmethod
    def submit_credential(
        db: Session, consultant_id: uuid.UUID, spec_id: int, document_url: str
    ) -> ConsultantCredential:
        credential = ConsultantCredential(
            consultant_id=consultant_id,
            specialization_id=spec_id,
            document_url=document_url,
            status=VerificationStatus.pending,
        )
        db.add(credential)
        db.commit()
        db.refresh(credential)
        return credential

    @staticmethod
    def list_pending_credentials(db: Session) -> list[ConsultantCredential]:
        return db.query(ConsultantCredential).filter(
            ConsultantCredential.status == VerificationStatus.pending
        ).order_by(ConsultantCredential.submitted_at.desc()).all()

    @staticmethod
    def review_credential(
        db: Session,
        credential_id: uuid.UUID,
        admin_id: uuid.UUID,
        status: VerificationStatus,
        rejection_reason: str = None,
    ) -> ConsultantCredential:

        credential = db.query(ConsultantCredential).filter(
            ConsultantCredential.id == credential_id
        ).first()
        if not credential:
            raise ValueError("Credential not found")

        credential.status = status
        credential.reviewed_by = admin_id
        credential.reviewed_at = datetime.now(timezone.utc)
        credential.rejection_reason = rejection_reason
        db.commit()
        db.refresh(credential)

        # Notify the consultant about credential review result
        profile = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == credential.consultant_id
        ).first()
        if profile:
            notification = Notification(
                user_id=profile.user_id,
                type=NotificationType.credential_status_update,
                title="تحديث حالة الأوراق والمستندات",
                message=(
                    f"تم {'قبول' if status == VerificationStatus.approved else 'رفض'} "
                    f"أوراق التخصص الخاصة بك."
                    f"{f' السبب: {rejection_reason}' if rejection_reason else ''}"
                ),
                related_entity_type="credential",
                related_entity_id=credential.id,
            )
            db.add(notification)

            if status == VerificationStatus.approved:
                profile.verification_status = VerificationStatus.approved
                profile.main_specialization_id = credential.specialization_id

            db.commit()

        return credential

    # ── Service management ───────────────────────────────────────────

    @staticmethod
    def get_services(db: Session, consultant_id: uuid.UUID) -> list[ConsultantServiceModel]:
        """Returns all services (active and inactive) for a consultant profile."""
        return (
            db.query(ConsultantServiceModel)
            .filter(ConsultantServiceModel.consultant_id == consultant_id)
            .order_by(ConsultantServiceModel.created_at.desc())
            .all()
        )

    @staticmethod
    def get_active_services(db: Session, consultant_id: uuid.UUID) -> list[ConsultantServiceModel]:
        """Returns only active services for a given consultant profile."""
        return (
            db.query(ConsultantServiceModel)
            .filter(
                and_(
                    ConsultantServiceModel.consultant_id == consultant_id,
                    ConsultantServiceModel.is_active == True,
                )
            )
            .order_by(ConsultantServiceModel.created_at.desc())
            .all()
        )

    @staticmethod
    def add_service(db: Session, consultant_id: uuid.UUID, service_in) -> ConsultantServiceModel:
        """
        Adds a new service for a consultant.
        Out-of-specialization services require a valid approved expansion request ID.
        """
        if service_in.is_out_of_specialization:
            if not service_in.expansion_request_id:
                raise ValueError(
                    "Out-of-specialization services require an approved expansion request ID"
                )
            req_uuid = (
                uuid.UUID(service_in.expansion_request_id)
                if isinstance(service_in.expansion_request_id, str)
                else service_in.expansion_request_id
            )
            exp_req = db.query(ServiceExpansionRequest).filter(
                and_(
                    ServiceExpansionRequest.id == req_uuid,
                    ServiceExpansionRequest.status == VerificationStatus.approved,
                )
            ).first()
            if not exp_req:
                raise ValueError("Approved service expansion request not found for this ID")

        db_service = ConsultantServiceModel(
            consultant_id=consultant_id,
            specialization_id=service_in.specialization_id,
            name=service_in.name,
            description=service_in.description,
            price=service_in.price,
            duration_minutes=service_in.duration_minutes,
            is_out_of_specialization=service_in.is_out_of_specialization,
            expansion_request_id=(
                uuid.UUID(service_in.expansion_request_id)
                if service_in.expansion_request_id
                else None
            ),
        )
        db.add(db_service)
        db.commit()
        db.refresh(db_service)
        return db_service

    @staticmethod
    def update_service(
        db: Session, consultant_id: uuid.UUID, service_id: uuid.UUID, update_in
    ) -> ConsultantServiceModel:
        """Updates editable fields on an existing service."""
        service = db.query(ConsultantServiceModel).filter(
            and_(
                ConsultantServiceModel.id == service_id,
                ConsultantServiceModel.consultant_id == consultant_id,
            )
        ).first()
        if not service:
            raise ValueError("Service not found or does not belong to this consultant")

        if update_in.name is not None:
            service.name = update_in.name
        if update_in.description is not None:
            service.description = update_in.description
        if update_in.price is not None:
            service.price = update_in.price
        if update_in.duration_minutes is not None:
            service.duration_minutes = update_in.duration_minutes

        db.commit()
        db.refresh(service)
        return service

    @staticmethod
    def toggle_service(
        db: Session, consultant_id: uuid.UUID, service_id: uuid.UUID
    ) -> ConsultantServiceModel:
        """Toggles a service between active and inactive."""
        service = db.query(ConsultantServiceModel).filter(
            and_(
                ConsultantServiceModel.id == service_id,
                ConsultantServiceModel.consultant_id == consultant_id,
            )
        ).first()
        if not service:
            raise ValueError("Service not found or does not belong to this consultant")
        service.is_active = not service.is_active
        db.commit()
        db.refresh(service)
        return service

    @staticmethod
    def delete_service(
        db: Session, consultant_id: uuid.UUID, service_id: uuid.UUID
    ) -> bool:
        """Deletes a service belonging to the consultant."""
        service = db.query(ConsultantServiceModel).filter(
            and_(
                ConsultantServiceModel.id == service_id,
                ConsultantServiceModel.consultant_id == consultant_id,
            )
        ).first()
        if not service:
            raise ValueError("Service not found or does not belong to this consultant")
        db.delete(service)
        db.commit()
        return True

    # ── Service Expansion operations ─────────────────────────────────

    @staticmethod
    def submit_service_expansion(
        db: Session, consultant_id: uuid.UUID, request_in
    ) -> ServiceExpansionRequest:
        request = ServiceExpansionRequest(
            consultant_id=consultant_id,
            requested_specialization_id=request_in.requested_specialization_id,
            service_name=request_in.service_name,
            service_description=request_in.service_description,
            proof_document_url=request_in.proof_document_url,
            status=VerificationStatus.pending,
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def get_my_expansions(
        db: Session, consultant_id: uuid.UUID
    ) -> list[ServiceExpansionRequest]:
        """Returns all service expansion requests submitted by this consultant."""
        return (
            db.query(ServiceExpansionRequest)
            .filter(ServiceExpansionRequest.consultant_id == consultant_id)
            .order_by(ServiceExpansionRequest.created_at.desc())
            .all()
        )

    @staticmethod
    def get_clients(db: Session, consultant_id: uuid.UUID, page: int = 1, limit: int = 20) -> list[dict]:
        """
        Retrieves a paginated list of clients who booked appointments with the consultant,
        including aggregated statistics per client.
        """
        now = datetime.now(timezone.utc)
        
        query = (
            db.query(
                User.id.label("user_id"),
                User.full_name.label("full_name"),
                User.email.label("email"),
                User.phone.label("phone"),
                User.entity_type.label("entity_type"),
                User.legal_form.label("legal_form"),
                User.company_name.label("company_name"),
                User.tax_number.label("tax_number"),
                User.sector.label("sector"),
                User.address.label("address"),
                User.is_active.label("is_active"),
                func.count(Appointment.id).label("total_sessions"),
                func.sum(case((Appointment.status == AppointmentStatus.completed, 1), else_=0)).label("completed_sessions"),
                func.sum(case((Appointment.status.in_([AppointmentStatus.cancelled_by_user, AppointmentStatus.cancelled_by_consultant]), 1), else_=0)).label("cancelled_sessions"),
                func.sum(case((Appointment.session_type == SessionType.video_call, 1), else_=0)).label("video_sessions"),
                func.sum(case((Appointment.session_type == SessionType.chat, 1), else_=0)).label("chat_sessions"),
                func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00")).label("total_paid"),
                func.avg(Rating.stars).label("average_rating_given"),
                func.max(case((Appointment.scheduled_at < now, Appointment.scheduled_at), else_=None)).label("last_appointment_at"),
                func.min(case((Appointment.scheduled_at >= now, Appointment.scheduled_at), else_=None)).label("next_appointment_at"),
                func.min(Appointment.scheduled_at).label("first_session_at")
            )
            .join(Appointment, Appointment.user_id == User.id)
            .outerjoin(Rating, Rating.appointment_id == Appointment.id)
            .outerjoin(Invoice, and_(Invoice.appointment_id == Appointment.id, Invoice.status == InvoiceStatus.paid))
            .filter(Appointment.consultant_id == consultant_id)
            .group_by(User.id, User.full_name, User.email, User.phone, User.entity_type, User.legal_form, User.company_name, User.tax_number, User.sector, User.address, User.is_active)
            .order_by(func.max(Appointment.scheduled_at).desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        
        results = query.all()
        
        clients_list = []
        for r in results:
            clients_list.append({
                "user_id": r.user_id,
                "full_name": r.full_name,
                "email": r.email,
                "phone": r.phone,
                "entity_type": r.entity_type,
                "legal_form": r.legal_form,
                "company_name": r.company_name,
                "tax_number": r.tax_number,
                "sector": r.sector,
                "address": r.address,
                "is_active": r.is_active,
                "total_sessions": r.total_sessions or 0,
                "completed_sessions": r.completed_sessions or 0,
                "cancelled_sessions": r.cancelled_sessions or 0,
                "video_sessions": r.video_sessions or 0,
                "chat_sessions": r.chat_sessions or 0,
                "total_paid": r.total_paid,
                "average_rating_given": r.average_rating_given,
                "last_appointment_at": r.last_appointment_at,
                "next_appointment_at": r.next_appointment_at,
                "first_session_at": r.first_session_at,
            })
            
        # If this consultant does not have any direct appointments yet, also include registered users so they see the client base
        if not clients_list:
            all_users = db.query(User).filter(User.role.in_([UserRole.user, UserRole.client])).limit(limit).all()
            for u in all_users:
                clients_list.append({
                    "user_id": u.id,
                    "full_name": u.full_name,
                    "email": u.email,
                    "phone": u.phone,
                    "entity_type": u.entity_type,
                    "legal_form": u.legal_form,
                    "company_name": u.company_name,
                    "tax_number": u.tax_number,
                    "sector": u.sector,
                    "address": u.address,
                    "is_active": u.is_active,
                    "total_sessions": 0,
                    "completed_sessions": 0,
                    "cancelled_sessions": 0,
                    "video_sessions": 0,
                    "chat_sessions": 0,
                    "total_paid": Decimal("0.00"),
                    "average_rating_given": None,
                    "last_appointment_at": None,
                    "next_appointment_at": None,
                    "first_session_at": None,
                })
        return clients_list
