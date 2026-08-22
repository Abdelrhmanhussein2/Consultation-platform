"""
Unit Tests: Registration Legal Forms, System Policies and Admin Approval
======================================================================
Tests validation of registration constraints, commercial register documents,
multiple system policies versioning, and user policy agreement logging.
"""

import os
import uuid
import pytest
from unittest.mock import MagicMock, patch, mock_open
import sys

# Stub out heavy optional dependencies so tests can run without them
for _mod in [
    "qdrant_client", "qdrant_client.http", "qdrant_client.http.models",
    "neo4j", "redis", "cohere", "groq",
]:
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from helpers.database import Base
from helpers.enums import UserRole, LegalForm, VerificationStatus
from models.user import User
from models.consultant_profile import ConsultantProfile
from models.system_policy import SystemPolicy
from models.user_policy_agreement import UserPolicyAgreement
from services import UserService, SuperAdminService
from schemes import UserCreate, ConsultantRegister

SQLITE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    _engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=_engine)
    
    # Seed 11 default active policies
    Session = sessionmaker(bind=_engine)
    session = Session()
    policy_types = [
        "terms_and_conditions", "tax_services_use", "disclaimer", "cybersecurity",
        "service_quality", "code_of_conduct", "sla", "records_retention",
        "ai_assistant_disclosure", "data_subject_rights", "privacy_policy"
    ]
    for p_type in policy_types:
        policy = SystemPolicy(
            title=f"Title for {p_type}",
            policy_type=p_type,
            version="1.0",
            content=f"Content for {p_type} policy",
            is_active=True
        )
        session.add(policy)
    session.commit()
    session.close()
    
    yield _engine
    Base.metadata.drop_all(bind=_engine)

@pytest.fixture()
def db(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

def test_register_individual_no_register_url(db):
    user_in = UserCreate(
        full_name="Individual User",
        email="individual@test.com",
        password="SecurePassword123!",
        phone="1234567890",
        legal_form=LegalForm.individual,
        commercial_register_url=None,
        accepted_privacy_policy=True
    )
    user = UserService.create_user(db, user_in, role=UserRole.user)
    assert user.email == "individual@test.com"
    assert user.legal_form == LegalForm.individual
    assert user.commercial_register_url is None
    assert user.verification_status == VerificationStatus.pending

    # Verify that user has 11 agreements generated
    agreements = db.query(UserPolicyAgreement).filter(UserPolicyAgreement.user_id == user.id).all()
    assert len(agreements) == 11

def test_register_independent_entity_no_register_url(db):
    user_in = UserCreate(
        full_name="Independent Entity",
        email="independent@test.com",
        password="SecurePassword123!",
        phone="1234567890",
        legal_form=LegalForm.independent_entity,
        commercial_register_url=None,
        accepted_privacy_policy=True
    )
    user = UserService.create_user(db, user_in, role=UserRole.user)
    assert user.email == "independent@test.com"
    assert user.legal_form == LegalForm.independent_entity
    assert user.commercial_register_url is None

def test_register_researcher_no_register_url(db):
    user_in = UserCreate(
        full_name="Researcher User",
        email="researcher@test.com",
        password="SecurePassword123!",
        phone="1234567890",
        legal_form=LegalForm.researcher,
        commercial_register_url=None,
        accepted_privacy_policy=True
    )
    user = UserService.create_user(db, user_in, role=UserRole.user)
    assert user.email == "researcher@test.com"
    assert user.legal_form == LegalForm.researcher
    assert user.commercial_register_url is None

def test_register_company_no_register_url_raises(db):
    user_in = UserCreate(
        full_name="LLC Company User",
        email="company_fail@test.com",
        password="SecurePassword123!",
        phone="1234567890",
        legal_form=LegalForm.llc,
        commercial_register_url=None,
        accepted_privacy_policy=True
    )
    with pytest.raises(ValueError, match="السجل التجاري مطلوب للصفة القانونية المحددة"):
        UserService.create_user(db, user_in, role=UserRole.user)

def test_register_company_with_register_url(db):
    user_in = UserCreate(
        full_name="LLC Company User",
        email="company_success@test.com",
        password="SecurePassword123!",
        phone="1234567890",
        legal_form=LegalForm.llc,
        commercial_register_url="/static/documents/cr_12345.pdf",
        accepted_privacy_policy=True
    )
    user = UserService.create_user(db, user_in, role=UserRole.user)
    assert user.email == "company_success@test.com"
    assert user.legal_form == LegalForm.llc
    assert user.commercial_register_url == "/static/documents/cr_12345.pdf"

def test_register_consultant_additional_fields(db):
    consultant_in = ConsultantRegister(
        full_name="Dr. Consultant",
        email="dr_consultant@test.com",
        password="SecurePassword123!",
        phone="0987654321",
        title="د.",
        address="عمان، الأردن",
        company_name="مكتب الاستشارات الضريبية",
        bio="خبرة طويلة في الاستشارات الضريبية والمالية.",
        main_specialization_id=1,
        activity_type="مستشار ضريبي",
        years_of_experience=15,
        certificates_licenses="شهادة محاسب قانوني معتمد (CPA)",
        accepted_privacy_policy=True
    )
    user = UserService.create_user(db, consultant_in, role=UserRole.consultant)
    assert user.email == "dr_consultant@test.com"
    assert user.title == "د."
    assert user.address == "عمان، الأردن"
    assert user.company_name == "مكتب الاستشارات الضريبية"
    
    # Query the ConsultantProfile
    profile = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == user.id).first()
    assert profile is not None
    assert profile.bio == "خبرة طويلة في الاستشارات الضريبية والمالية."
    assert profile.main_specialization_id == 1
    assert profile.activity_type == "مستشار ضريبي"
    assert profile.years_of_experience == 15
    assert profile.certificates_licenses == "شهادة محاسب قانوني معتمد (CPA)"

def test_system_policy_versioning(db):
    # Retrieve active policies
    active_policies = SuperAdminService.get_active_policies(db)
    assert len(active_policies) > 0
    
    # Create new policy version (should deactivate old version of the same type)
    new_policy = SuperAdminService.create_system_policy(
        db,
        title="New Privacy Title",
        policy_type="privacy_policy",
        version="2.0",
        content="Updated privacy content"
    )
    assert new_policy.version == "2.0"
    assert new_policy.is_active is True
    
    # Confirm 1.0 privacy policy is deactivated
    old_policy = db.query(SystemPolicy).filter(
        SystemPolicy.policy_type == "privacy_policy",
        SystemPolicy.version == "1.0"
    ).first()
    assert old_policy.is_active is False
    
    # Register user and confirm they are linked to version 2.0 of privacy policy
    user_in = UserCreate(
        full_name="Policy User",
        email="policy_user@test.com",
        password="SecurePassword123!",
        phone="1234567890",
        legal_form=LegalForm.individual,
        commercial_register_url=None,
        accepted_privacy_policy=True
    )
    user = UserService.create_user(db, user_in, role=UserRole.user)
    agreements = db.query(UserPolicyAgreement).filter(UserPolicyAgreement.user_id == user.id).all()
    
    # Verify that one of the agreements is specifically the new version 2.0 privacy policy
    assert any(ag.policy_id == new_policy.id for ag in agreements)

def test_admin_approve_reject_user_actions(db):
    user_in = UserCreate(
        full_name="Pending Client",
        email="pending_client@test.com",
        password="SecurePassword123!",
        phone="1234567890",
        legal_form=LegalForm.individual,
        commercial_register_url=None,
        accepted_privacy_policy=True
    )
    user = UserService.create_user(db, user_in, role=UserRole.user)
    assert user.verification_status == VerificationStatus.pending
    
    # Admin lists pending users
    pending = SuperAdminService.get_pending_users(db)
    assert any(u.id == user.id for u in pending)
    
    # Approve user
    admin_id = uuid.uuid4()
    approved_user = SuperAdminService.approve_user(db, user.id, admin_id)
    assert approved_user.verification_status == VerificationStatus.approved
    
    # Reject user
    rejected_user = SuperAdminService.reject_user(db, user.id, admin_id, "Incomplete documentation")
    assert rejected_user.verification_status == VerificationStatus.rejected
