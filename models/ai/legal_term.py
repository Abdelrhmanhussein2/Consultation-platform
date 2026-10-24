"""
models/ai/legal_term.py
SQLAlchemy model for the legal_terms table.
"""
from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, ForeignKey, text
from helpers.database import Base


class LegalTerm(Base):
    __tablename__ = "legal_terms"

    id                = Column(Integer, primary_key=True, index=True)
    popular_term      = Column(Text, nullable=False)
    legislative_term  = Column(Text, nullable=False)
    ref_type          = Column(Text, nullable=True)
    law_name          = Column(Text, nullable=True)
    law_number_year   = Column(Text, nullable=True)
    article_reference = Column(Text, nullable=True)
    literal_text      = Column(Text, nullable=True)
    official_url      = Column(Text, nullable=True)
    neo4j_article_id  = Column(Text, nullable=True)
    law_id              = Column(Text, nullable=True, index=True)
    version_id          = Column(Text, nullable=True)
    match_status        = Column(Text, nullable=True, index=True)  # verified, ambiguous, not_found, not_in_graph
    text_match_status   = Column(Text, nullable=True, index=True)  # exact, contained_light, contained_punct, contained_normalized, different, not_in_graph
    normalization_level = Column(Text, nullable=True)             # exact, quotes_stripped, punct_stripped, hamza_normalized, none
    version_basis       = Column(Text, nullable=True)             # current_consolidated, amended_only
    review_status       = Column(Text, nullable=False, default="pending", server_default="pending", index=True) # pending, approved, rejected
    review_notes        = Column(Text, nullable=True)
    reviewed_by         = Column(Text, nullable=True)
    reviewed_at         = Column(TIMESTAMP(timezone=True), nullable=True)
    is_openable         = Column(Boolean, nullable=False, default=False, server_default="false", index=True)
    verified_at         = Column(TIMESTAMP(timezone=True), nullable=True)
    row_hash            = Column(Text, nullable=False, unique=True)
    import_batch_id     = Column(Text, nullable=True)
    imported_at         = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)
    is_active           = Column(Boolean, nullable=False, default=True, server_default="true")
    superseded_by       = Column(Integer, ForeignKey("legal_terms.id", ondelete="SET NULL"), nullable=True)
