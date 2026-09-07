"""
SuperAdminService Master Facade
(Aggregates modular Admin services while maintaining 100% backward compatibility)
"""

from services.super_admin.admin_users_service import AdminUsersService
from services.super_admin.admin_finance_service import AdminFinanceService
from services.super_admin.admin_reports_service import AdminReportsService
from services.super_admin.admin_dashboard_service import AdminDashboardService
from services.super_admin.admin_sessions_service import AdminSessionsService
from services.super_admin.admin_security_service import AdminSecurityService


class SuperAdminService(
    AdminUsersService,
    AdminFinanceService,
    AdminReportsService,
    AdminDashboardService,
    AdminSessionsService,
    AdminSecurityService
):
    """
    Unified SuperAdminService combining all modular admin domain services:
    - AdminUsersService: user & consultant lifecycle management, approvals, profiles
    - AdminFinanceService: payments, payouts, subscriptions, invoices, receipts
    - AdminReportsService: analytics, growth rates, drilldowns, charts
    - AdminDashboardService: live command center KPIs and real-time database lists
    - AdminSessionsService: sessions, live links, broadcast announcements, policies
    - AdminSecurityService: audit logs, login histories, account roles & RBAC
    """
    pass


__all__ = ["SuperAdminService"]
