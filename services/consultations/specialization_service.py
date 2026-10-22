from sqlalchemy.orm import Session
from models import Specialization


class SpecializationService:

    @staticmethod
    def get_all(db: Session) -> list[Specialization]:
        """
        Returns all available specializations ordered by ID.
        """
        return db.query(Specialization).order_by(Specialization.id.asc()).all()
