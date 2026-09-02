import React, { useState, useEffect } from 'react';
import { IconAudit, IconSearch, IconSecurity } from '../components/AdminIcons';
import { getAuditLogs } from '../services/adminApi';

export default function AdminAuditLogsPage({ navigate }) {
  // ══════════════════════════════════════════════════════════════════════════
  // INITIAL RICH AUDIT DATASET
  // ══════════════════════════════════════════════════════════════════════════
  const [logs, setLogs] = useState([
    {
      id: 'log_101',
      timestamp: '2026-08-29 14:40:14',
      relativeTime: 'منذ دقيقة',
      actor: 'خالد (Super Admin)',
      actorRole: 'مدير عام',
      actorEmail: 'admin@diwan.jo',
      ip: '192.168.1.105 (عمان، الأردن)',
      device: 'Chrome / Windows 11',
      actionCode: 'admin.permission.grant',
      actionCategory: 'صلاحيات ومستخدمين',
      actionLabel: 'منح وتعديل صلاحيات إدارية',
      target: 'المشرف: عبدالرحمن حسين (#ADM-402)',
      targetType: 'مشرف إداري',
      details: 'منح صلاحية إدارة السحوبات والماليات وتدقيق إقرارات الشركات الكبرى',
      severity: 'high',
      status: 'success',
      payload: {
        permissionGranted: 'perm_manage_financials',
        grantedBy: 'Super Admin',
        previousState: ['perm_view_reports', 'perm_reply_tickets'],
        newState: ['perm_view_reports', 'perm_reply_tickets', 'perm_manage_financials'],
        authorizedIp: '192.168.1.105'
      }
    },
    {
      id: 'log_102',
      timestamp: '2026-08-29 14:32:19',
      relativeTime: 'منذ 9 دقائق',
      actor: 'خالد (Super Admin)',
      actorRole: 'مدير عام',
      actorEmail: 'admin@diwan.jo',
      ip: '192.168.1.105 (عمان، الأردن)',
      device: 'Chrome / Windows 11',
      actionCode: 'payout.request.status_update',
      actionCategory: 'سحوبات وأموال',
      actionLabel: 'اعتماد سحب أرباح بنكية',
      target: 'طلب سحب أرباح #PAY-103',
      targetType: 'حوالة بنكية',
      details: 'تأكيد التحويل البنكي للمستشار أحمد نصار بمبلغ 350 د.أ عبر البنك العربي',
      severity: 'high',
      status: 'success',
      payload: {
        payoutId: 'pay_103',
        amount: '350.00 JOD',
        beneficiary: 'أحمد نصار',
        iban: 'JO******************1245',
        bankName: 'Arab Bank PLC',
        referenceNumber: 'TXN-ARAB-9884210'
      }
    },
    {
      id: 'log_103',
      timestamp: '2026-08-29 14:30:00',
      relativeTime: 'منذ 11 دقيقة',
      actor: 'نظام الأمان الموحد',
      actorRole: 'نظام آلي',
      actorEmail: 'system-security@diwan.jo',
      ip: '10.0.4.1 (Internal Gateway)',
      device: 'Security Daemon',
      actionCode: 'auth.login.success',
      actionCategory: 'توثيق ودخول',
      actionLabel: 'تسجيل دخول ناجح للمدير',
      target: 'حساب المدير: admin@diwan.jo',
      targetType: 'جلسة دخول',
      details: 'تسجيل دخول ناجح مع توثيق JWT وتوليد مفتاح جلسة فوري',
      severity: 'low',
      status: 'success',
      payload: {
        authMethod: 'Password + Memory Token',
        tokenType: 'Bearer Zero-Trust',
        jwtExpiry: '24 Hours',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    },
    {
      id: 'log_104',
      timestamp: '2026-08-29 13:50:22',
      relativeTime: 'منذ 50 دقيقة',
      actor: 'سعد هارون',
      actorRole: 'مدير المحتوى والمعرفة',
      actorEmail: 'saad.haroon@diwan.jo',
      ip: '192.168.1.120 (إربد، الأردن)',
      device: 'Safari / macOS',
      actionCode: 'knowledge.article.publish',
      actionCategory: 'قاعدة المعرفة',
      actionLabel: 'نشر مادة تشريعية جديدة',
      target: 'دليل ضريبة المبيعات المعدل 2026 (#DOC-891)',
      targetType: 'وثيقة قانونية',
      details: 'إضافة ونشر التعديلات الأخيرة على المادة (14) من قانون ضريبة المبيعات',
      severity: 'medium',
      status: 'success',
      payload: {
        articleId: 'doc_891',
        title: 'دليل ضريبة المبيعات المعدل 2026',
        category: 'تشريعات ضريبية',
        wordCount: 1420,
        publishedState: 'Live'
      }
    },
    {
      id: 'log_105',
      timestamp: '2026-08-29 12:15:44',
      relativeTime: 'منذ ساعتين',
      actor: 'م. خلدون شاهين',
      actorRole: 'مشرف الدعم الفني',
      actorEmail: 'k.shaheen@diwan.jo',
      ip: '192.168.1.112 (عمان، الأردن)',
      device: 'Edge / Windows 11',
      actionCode: 'ticket.escalate.consultant_change',
      actionCategory: 'جلسات واستشارات',
      actionLabel: 'تغيير المستشار المتابع للجلسة',
      target: 'التذكرة #TCK-1003 — الجلسة #SES-1029',
      targetType: 'جلسة استشارية',
      details: 'تغيير المستشار المعين للجلسة وإعادة جدولتها بناءً على طلب العميل',
      severity: 'medium',
      status: 'success',
      payload: {
        ticketId: 't_1003',
        sessionId: 'ses_1029',
        previousConsultant: 'غير محدد',
        newConsultant: 'أ. سارة المجالي',
        reason: 'Client Request for Video Reschedule'
      }
    },
    {
      id: 'log_106',
      timestamp: '2026-08-29 10:05:12',
      relativeTime: 'منذ 4 ساعات',
      actor: 'جدار الحماية والـ WAF',
      actorRole: 'نظام الحماية',
      actorEmail: 'waf-shield@diwan.jo',
      ip: '185.220.101.4 (Frankfurt, DE)',
      device: 'Python-requests / Bot',
      actionCode: 'security.rate_limit.blocked',
      actionCategory: 'توثيق ودخول',
      actionLabel: 'حظر محاولة تخمين كلمة المرور (Brute Force)',
      target: 'نقطة النهاية: /api/auth/login',
      targetType: 'طلب غير مصرح',
      details: 'حظر فوري للعنوان بعد 5 محاولات فاشلة متتالية خلال 10 ثوانٍ',
      severity: 'urgent',
      status: 'blocked',
      payload: {
        ipAddress: '185.220.101.4',
        attemptsCount: 5,
        targetAccount: 'info@unknown.com',
        firewallAction: 'Banned 60 Minutes',
        mitigation: 'Redis Vault Auto-drop'
      }
    }
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTER STATES
  // ══════════════════════════════════════════════════════════════════════════
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');

  // Payload Inspector Modal
  const [inspectModalLog, setInspectModalLog] = useState(null);

  // Load from Backend on mount
  useEffect(() => {
    let mounted = true;
    async function loadBackendLogs() {
      try {
        const data = await getAuditLogs(50);
        if (mounted && Array.isArray(data) && data.length > 0) {
          setLogs(prev => {
            const mapped = data.map((d, idx) => ({
              id: d.id || `log_api_${idx}`,
              timestamp: d.created_at ? new Date(d.created_at).toLocaleString('ar-JO') : '2026-08-29 14:00:00',
              relativeTime: 'اليوم',
              actor: d.admin_name || 'مدير النظام',
              actorRole: 'مسؤول إداري',
              actorEmail: d.admin_email || 'admin@diwan.jo',
              ip: d.ip_address || '192.168.1.100',
              device: 'Admin Console',
              actionCode: d.action || 'system.operation',
              actionCategory: 'صلاحيات ومستخدمين',
              actionLabel: d.action_label || d.action || 'عملية إدارية',
              target: d.resource || 'النظام',
              targetType: 'كيان إداري',
              details: d.details || 'تم تنفيذ العملية بنجاح',
              severity: d.severity || 'low',
              status: 'success',
              payload: d.payload || { details: d.details }
            }));
            return [...prev, ...mapped.filter(m => !prev.some(p => p.id === m.id))];
          });
        }
      } catch (err) {
        console.warn('Audit logs backend sync:', err);
      }
    }
    loadBackendLogs();
    return () => { mounted = false; };
  }, []);

  // Filter computation
  const filteredLogs = logs.filter(log => {
    const matchSearch = searchQuery === '' || 
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = categoryFilter === 'all' || log.actionCategory === categoryFilter;
    const matchSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchActor = actorFilter === 'all' || log.actor.includes(actorFilter);

    return matchSearch && matchCategory && matchSeverity && matchActor;
  });

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + "التوقيت,المستخدم / المشرف,الدور,عنوان IP,نوع العملية,القسم,الكيان المتأثر,التفاصيل,الحالة\n"
      + logs.map(l => `"${l.timestamp}","${l.actor}","${l.actorRole}","${l.ip}","${l.actionCode}","${l.actionCategory}","${l.target}","${l.details}","${l.status}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `سجل_التدقيق_والعمليات_ديوان_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSeverityFilter('all');
    setActorFilter('all');
  };

  return (
    <div>
      {/* 1. Header Command Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div className="admin-banner-sub-tag">SYSTEM AUDIT TRAIL & ACTIVITY LOGS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-banner-title" style={{ fontSize: '24px', margin: 0 }}>سجل التدقيق والعمليات الحساسة</h1>
            <span style={{ fontSize: '20px' }}>🛡️</span>
          </div>
          <p className="admin-banner-desc" style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#64748B' }}>
            تتبع دقيق وتوثيق مشفر لكافة العمليات الإدارية وتعديلات الصلاحيات وحركات الأموال والولوج للنظام (ISO-27001).
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={handleExportCSV}
            className="admin-btn-action-primary"
            style={{ fontSize: '12.5px', padding: '7px 16px', background: '#E58A13', borderColor: '#E58A13', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <span>+ تصدير السجل الكامل</span>
            <span>📥</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div 
          className="admin-card" 
          style={{ padding: '14px 16px', borderTop: '3px solid #0A3C64', cursor: 'pointer' }}
          onClick={() => { setCategoryFilter('all'); setSeverityFilter('all'); }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>إجمالي العمليات</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0A3C64', margin: '4px 0' }}>1,420</div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>موثقة ومحفوظة بالكامل ✓</div>
        </div>

        <div 
          className="admin-card" 
          style={{ padding: '14px 16px', borderTop: '3px solid #E58A13', cursor: 'pointer' }}
          onClick={() => setCategoryFilter('صلاحيات ومستخدمين')}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>عمليات الصلاحيات</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#E58A13', margin: '4px 0' }}>84</div>
          <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: '700' }}>تعديل وتعيين أدوار 🛡️</div>
        </div>

        <div 
          className="admin-card" 
          style={{ padding: '14px 16px', borderTop: '3px solid #059669', cursor: 'pointer' }}
          onClick={() => setCategoryFilter('سحوبات وأموال')}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>حركات مالية وسحوبات</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', margin: '4px 0' }}>312</div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>معاملات محفظة وبنوك 💳</div>
        </div>

        <div 
          className="admin-card" 
          style={{ padding: '14px 16px', borderTop: '3px solid #0284C7', cursor: 'pointer' }}
          onClick={() => setCategoryFilter('توثيق ودخول')}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>جلسات دخول وتوثيق</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284C7', margin: '4px 0' }}>890</div>
          <div style={{ fontSize: '10.5px', color: '#0284C7', fontWeight: '700' }}>مصادقة JWT آمنة 🔑</div>
        </div>

        <div 
          className="admin-card" 
          style={{ padding: '14px 16px', borderTop: '3px solid #DC2626', cursor: 'pointer' }}
          onClick={() => setSeverityFilter('urgent')}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>تجاوزات أمنية محجوبة</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#DC2626', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>1</span>
            <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#DC2626', padding: '1px 6px', borderRadius: '4px' }}>WAF Blocked</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>تم الحظر الفوري 100% 🛡️</div>
        </div>
      </div>

      {/* 3. Advanced Search & Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <input 
            type="text"
            className="admin-search-input"
            placeholder="بحث بالمستخدم، نوع العملية، الكيان المتأثر، أو عنوان IP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingRight: '12px', height: '36px', fontSize: '12.5px' }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>القسم:</span>
          <select 
            className="admin-select-input" 
            style={{ width: '140px', height: '36px', fontSize: '12px' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">كافة الأقسام</option>
            <option value="صلاحيات ومستخدمين">صلاحيات ومستخدمين</option>
            <option value="سحوبات وأموال">سحوبات وأموال</option>
            <option value="توثيق ودخول">توثيق ودخول</option>
            <option value="جلسات واستشارات">جلسات واستشارات</option>
            <option value="قاعدة المعرفة">قاعدة المعرفة</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>مستوى الحساسية:</span>
          <select 
            className="admin-select-input" 
            style={{ width: '130px', height: '36px', fontSize: '12px' }}
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="all">كافة المستويات</option>
            <option value="urgent">🔴 حرجة / محجوبة</option>
            <option value="high">🟠 حساسة / مالية</option>
            <option value="medium">🟡 متوسطة</option>
            <option value="low">🟢 روتينية</option>
          </select>
        </div>

        {/* Actor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>المنفذ:</span>
          <select 
            className="admin-select-input" 
            style={{ width: '130px', height: '36px', fontSize: '12px' }}
            value={actorFilter}
            onChange={e => setActorFilter(e.target.value)}
          >
            <option value="all">الجميع</option>
            <option value="خالد">خالد (Super Admin)</option>
            <option value="سعد هارون">سعد هارون</option>
            <option value="خلدون شاهين">م. خلدون شاهين</option>
            <option value="نظام">الأنظمة الآلية</option>
          </select>
        </div>

        {/* Clear filters */}
        {(searchQuery || categoryFilter !== 'all' || severityFilter !== 'all' || actorFilter !== 'all') && (
          <button 
            type="button" 
            onClick={clearAllFilters}
            className="admin-btn-action-outline"
            style={{ fontSize: '11.5px', padding: '6px 12px', color: '#DC2626', borderColor: '#FCA5A5', cursor: 'pointer' }}
          >
            مسح الفلاتر ✕
          </button>
        )}
      </div>

      {/* 4. Rich Audit Data Grid */}
      <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
            سجلات العمليات والحركات الموثقة ({filteredLogs.length})
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
            مرتبة تنازلياً حسب التوقيت اللحظي | انقر على أي صف لمعاينة البايلود الفني
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>الوقت والتاريخ</th>
                <th style={{ width: '160px' }}>المستخدم / المشرف</th>
                <th style={{ width: '180px' }}>نوع العملية</th>
                <th style={{ width: '180px' }}>الكيان المتأثر</th>
                <th>التفاصيل والإجراء</th>
                <th style={{ width: '120px' }}>عنوان IP</th>
                <th style={{ width: '90px' }}>الحالة</th>
                <th style={{ width: '80px', textAlign: 'center' }}>البايلود</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                    لا توجد سجلات تدقيق مطابقة لخيارات البحث المحددة.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr 
                    key={log.id} 
                    style={{ 
                      background: log.status === 'blocked' ? '#FEF2F2' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => setInspectModalLog(log)}
                  >
                    {/* Timestamp */}
                    <td>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '12.5px', fontFamily: 'monospace' }}>
                        {log.timestamp.split(' ')[1] || log.timestamp}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                        {log.timestamp.split(' ')[0]} ({log.relativeTime})
                      </div>
                    </td>

                    {/* Actor */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '12.5px', color: '#0A3C64' }}>{log.actor}</strong>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                        {log.actorRole}
                      </div>
                    </td>

                    {/* Action Code & Category */}
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '2px' }}>
                        {log.actionLabel}
                      </div>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', fontFamily: 'monospace' }}>
                        {log.actionCode}
                      </span>
                    </td>

                    {/* Affected Target */}
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                        {log.target}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                        {log.targetType}
                      </div>
                    </td>

                    {/* Details */}
                    <td>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                        {log.details}
                      </div>
                    </td>

                    {/* IP Address */}
                    <td>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0A3C64', fontWeight: '700' }}>
                        {log.ip.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                        {log.device}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td>
                      {log.status === 'success' ? (
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', background: '#DCFCE7', color: '#15803D' }}>
                          ✓ ناجح
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', background: '#FEE2E2', color: '#DC2626' }}>
                          ✕ محجوب
                        </span>
                      )}
                    </td>

                    {/* Action Payload button */}
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button 
                        type="button"
                        onClick={() => setInspectModalLog(log)}
                        className="admin-btn-action-outline"
                        style={{ fontSize: '11px', padding: '4px 8px', background: '#FFFFFF', cursor: 'pointer' }}
                        title="معاينة تفاصيل البايلود الفني"
                      >
                        🔍 فحص
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          5. INSPECT AUDIT PAYLOAD MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {inspectModalLog && (
        <div className="admin-modal-overlay" onClick={() => setInspectModalLog(null)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '92%', padding: '24px', borderRadius: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0A3C64' }}>
                  🔍 تفاصيل سجل التدقيق والبايلود الفني
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  معرف السجل: {inspectModalLog.id} — {inspectModalLog.timestamp}
                </span>
              </div>
              <button 
                type="button"
                className="admin-icon-btn-minimal" 
                style={{ fontSize: '16px', color: '#64748B', background: '#F1F5F9', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer' }}
                onClick={() => setInspectModalLog(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px', fontSize: '12.5px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>المنفذ:</span>
                <strong>{inspectModalLog.actor}</strong> ({inspectModalLog.actorRole})
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>نوع العملية:</span>
                <strong style={{ color: '#0A3C64' }}>{inspectModalLog.actionCode}</strong>
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>الكيان المتأثر:</span>
                <strong>{inspectModalLog.target}</strong>
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>عنوان IP والجهاز:</span>
                <span style={{ fontFamily: 'monospace' }}>{inspectModalLog.ip}</span>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '6px' }}>
                حمولة البيانات الفنية (JSON Payload & Audit Parameters):
              </label>
              <pre style={{
                background: '#0F172A',
                color: '#38BDF8',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                maxHeight: '220px',
                overflowY: 'auto',
                direction: 'ltr',
                textAlign: 'left'
              }}>
                {JSON.stringify(inspectModalLog.payload, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => setInspectModalLog(null)}
                className="admin-btn-action-outline"
                style={{ fontSize: '12px', padding: '6px 18px', cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
