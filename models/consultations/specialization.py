from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.orm import relationship

from helpers.database import Base

class Specialization(Base):
    __tablename__ = "specializations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    profiles = relationship("ConsultantProfile", back_populates="specialization")
    credentials = relationship("ConsultantCredential", back_populates="specialization")
    expansion_requests = relationship("ServiceExpansionRequest", back_populates="specialization")
    services = relationship("ConsultantService", back_populates="specialization")
