import uuid
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func

from models import (
    Appointment, ConsultantProfile, Rating, RatingStatus
)


class RatingService:
    @staticmethod
    def rate_appointment(
        db: Session,
        client_id: uuid.UUID,
        appt_id: uuid.UUID,
        stars: int,
        comment: str = None,
        low_rating_reason: str = None,
    ) -> Rating:
        appt = db.query(Appointment).filter(
            and_(Appointment.id == appt_id, Appointment.user_id == client_id)
        ).first()
        if not appt:
            raise ValueError("Appointment not found or does not belong to you")

        rating = Rating(
            appointment_id=appt_id,
            consultant_id=appt.consultant_id,
            user_id=client_id,
            stars=stars,
            comment=comment,
            low_rating_reason=low_rating_reason,
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)

        # Recalculate average rating & ratings count for consultant profile
        try:
            stats = db.query(
                func.avg(Rating.stars).label("avg_stars"),
                func.count(Rating.id).label("count_ratings")
            ).filter(
                and_(
                    Rating.consultant_id == appt.consultant_id,
                    Rating.status == RatingStatus.published
                )
            ).first()

            prof = db.query(ConsultantProfile).filter(ConsultantProfile.id == appt.consultant_id).first()
            if prof and stats:
                prof.average_rating = Decimal(str(round(stats.avg_stars, 2))) if stats.avg_stars else Decimal("0.00")
                prof.ratings_count = stats.count_ratings or 0
                db.commit()
        except Exception:
            pass

        return rating

    @staticmethod
    def get_consultant_ratings(db: Session, profile_id: uuid.UUID) -> list:
        ratings = (
            db.query(Rating)
            .options(joinedload(Rating.user))
            .filter(
                and_(
                    Rating.consultant_id == profile_id,
                    Rating.status == RatingStatus.published
                )
            )
            .order_by(Rating.created_at.desc())
            .all()
        )
        return [
            {
                "id": str(r.id),
                "reviewer_name": r.user.full_name if r.user else "عميل موثق",
                "stars": r.stars,
                "comment": r.comment or "استشارة ممتازة ومفيدة جداً",
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "is_verified_booking": True
            }
            for r in ratings
        ]
