from schemes.schemes import (
    # Users & Auth
    UserCreate, UserProfileUpdate, ChangePasswordRequest, UserLogin, UserOut, Token, TokenData,
    ConsultantRegister, RefreshRequest, LogoutRequest, ForgotPasswordRequest, ResetPasswordRequest,
    EmailChangeRequest, EmailChangeVerify, RequestPasswordOtpRequest, VerifyPasswordOtpAndResetRequest,
    VerifyMyPasswordOtpAndResetRequest,
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

    # Admin User Stats & Lists
    RoleCount, EntityTypeCount, UserStatsOut, AdminUserListOut, AdminAddUserRequest,

    # Admin Broadcast Notification
    AdminBroadcastNotification, BroadcastResultOut,

    # Sessions (Admin)
    AdminSessionOut, AdminSessionJoinOut, AdminUpdateSessionStatus,

    # Tickets (Support Desk)
    TicketCreate, TicketReplyCreate, TicketReplyOut, TicketOut,
    AdminTicketCreate, AdminTicketReplyCreate, AdminTicketUpdate,

    # Admin RBAC Permissions
    AdminCreate, AdminUpdatePermissions,

    # Consultant Bank Accounts & Payouts (Phase 2)
    SupportedBankOut, ConsultantBankAccountCreate, ConsultantBankAccountUpdate,
    ConsultantBankAccountOut, ConsultantWalletOut, PayoutRequestCreate,
    PayoutRequestOut, AdminPayoutAction,

    # System Policies
    SystemPolicyOut, SystemPolicyCreate, UserPolicyAgreementOut,

    # Platform Settings (Phase 4)
    BrandSettingsSchema, SystemSettingsSchema, CompanySettingsSchema,
    CurrencyItemSchema, CurrencySettingsSchema, ContractSettingsSchema,
    SMTPSettingsSchema, BankTransferGatewaySchema, PayPalGatewaySchema,
    StripeGatewaySchema, PaymentGatewaysSchema, AllPlatformSettingsOut,
    PublicPaymentGatewayOut, PublicPlatformSettingsOut, TestEmailRequest,
    TestEmailResponse, UserDocumentOut, OfficialTemplateOut, FavoriteOut, FavoriteToggle,
)


