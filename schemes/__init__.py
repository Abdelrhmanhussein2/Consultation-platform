from schemes.schemes import (
    # Users & Auth
    UserCreate, UserProfileUpdate, ChangePasswordRequest, UserLogin, UserOut, Token, TokenData,
    ConsultantRegister, RefreshRequest, LogoutRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ConsultantApplicationAction, ConsultantApplicationStatus,

    # Specializations
    SpecializationOut,

    # Consultant Profiles
    ConsultantProfileCreate, ConsultantProfileOut,
    ConsultantPublicProfileOut, ConsultantListItemOut,

    # Consultant Credentials
    CredentialCreate, CredentialReview, CredentialOut,

    # Service Expansion Requests
    ServiceExpansionRequestCreate, ServiceExpansionReview,
    ServiceExpansionReviewAction, ServiceExpansionRequestOut,

    # Consultant Services
    ConsultantServiceCreate, ConsultantServiceUpdate, ConsultantServiceOut,

    # Appointments
    AppointmentCreate, AppointmentCancel, AppointmentReschedule, PaymentSimulate, AppointmentOut,

    # Ratings
    RatingCreate, RatingReview, RatingOut,

    # Notifications & Invoices
    NotificationOut, UnreadCountOut, NotificationBulkReadOut, InvoiceOut,

    # Chat Messages
    ChatMessageCreate, ChatMessageOut, ChatReadResponse,

    # Sessions & Client Summaries
    SessionJoinOut, ClientSummaryOut,

    # Consultant Availability
    ConsultantAvailabilityCreate, ConsultantAvailabilityOut, AvailableSlotOut,
)
