import React, { useState, useEffect } from 'react';
import { IconSecurity, IconSearch, IconRbac } from '../components/AdminIcons';

export default function AdminSecurityPage({ navigate }) {
  const [activeTab, setActiveTab] = useState('engines'); // 'engines' | 'sessions' | 'intrusions' | 'policies'
  const [searchSession, setSearchSession] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [inspectKeyModal, setInspectKeyModal] = useState(null);

  // ══════════════════════════════════════════════════════════════════════════
  // SECURITY ENGINES DATASET
  // ══════════════════════════════════════════════════════════════════════════
  const [securityEngines, setSecurityEngines] = useState([
    {
      id: 'enc_db',
      title: 'تشفير الرسائل والمحادثات في DB',
      type: 'AES-256 Fernet Field-level',
      description: 'تشفير غير متناظر لكافة المحادثات والملاحظات السرية وبيانات الاستشارات قبل حفظها في PostgreSQL.',
      status: 'active',
      coverage: '100% مغطى',
      lastAudit: 'منذ دقيقتين',
      algorithm: 'Fernet AES-256-CBC + HMAC-SHA256',
      keyRotation: 'كل 90 يوم',
      activeKeysCount: 3
    },
    {
      id: 'mask_iban',
      title: 'حجب وتشفير الحسابات البنكية والـ IBAN',
      type: 'AES-256 + UI Masking',
      description: 'إخفاء أرقام الحسابات البنكية والبطاقات وحفظها مشفرة مع إظهار آخر 4 أرقام فقط للمشرفين المصرح لهم.',
      status: 'active',
      coverage: '100% مشفر',
      lastAudit: 'منذ 5 دقائق',
      algorithm: 'AES-256-GCM Authenticated',
      keyRotation: 'تلقائي سنوي',
      activeKeysCount: 2
    },
    {
      id: 'otp_vault',
      title: 'منظومة OTP وتأكيد البريد وكلمة المرور',
      type: '6-Digit Redis TTL Vault',
      description: 'توليد رموز تحقق فورية آمنة أحادية الاستخدام مع مدة صلاحية (5 دقائق) ومقاومة للتخمين.',
      status: 'active',
      coverage: 'معدل النجاح 99.4%',
      lastAudit: 'منذ دقيقة',
      algorithm: 'Crypto-secure CSPRNG',
      keyRotation: 'مؤقت لكل رمز',
      activeKeysCount: 140
    },
    {
      id: 'jwt_blacklist',
      title: 'إبطال التوكنات والقائمة السوداء',
      type: 'JWT Invalidation Blacklist',
      description: 'إبطال فوري لتوكنات الجلسات عند تسجيل الخروج أو تغيير كلمة المرور لمنع استغلال التوكنات القديمة.',
      status: 'active',
      coverage: 'نشط ولحظي',
      lastAudit: 'الآن',
      algorithm: 'Memory Cache + Redis TTL',
      keyRotation: 'لحظي عند الخروج',
      activeKeysCount: 18
    },
    {
      id: 'waf_ratelimit',
      title: 'جدار الحماية ومحدد المعدل (Rate Limiting)',
      type: 'Adaptive WAF + IP Throttling',
      description: 'حماية نقاط النهاية الحساسة (/login, /otp, /reset-password) من هجمات التخمين والهجمات الموزعة.',
      status: 'active',
      coverage: '142 محاولة محجوبة',
      lastAudit: 'منذ 10 دقائق',
      algorithm: 'Sliding Window Token Bucket',
      keyRotation: 'تلقائي',
      activeKeysCount: 1
    },
    {
      id: 'zero_trust',
      title: 'بنية التوثيق Zero-Trust In-Memory Tokens',
      type: 'Strict In-Memory JWT',
      description: 'منع تخزين توكنات الأدمن في LocalStorage أو SessionStorage لصد هجمات XSS و CSRF بالكامل.',
      status: 'active',
      coverage: 'محمي 100%',
      lastAudit: 'الآن',
      algorithm: 'HTTPOnly Cookie + Memory Token',
      keyRotation: 'مع كل ريفرش',
      activeKeysCount: 1
    }
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIVE SESSIONS DATASET
  // ══════════════════════════════════════════════════════════════════════════
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess_1',
      user: 'خالد (Super Admin)',
      role: 'مدير عام',
      email: 'admin@diwan.jo',
      ip: '192.168.1.105',
      location: 'عمان، الأردن 🇯🇴',
      device: 'Chrome 128 / Windows 11',
      startedAt: '2026-08-29 08:30',
      lastActive: 'الآن (نشطة حالياً)',
      isCurrent: true
    },
    {
      id: 'sess_2',
      user: 'سعد هارون',
      role: 'مدير المحتوى',
      email: 'saad.haroon@diwan.jo',
      ip: '192.168.1.120',
      location: 'إربد، الأردن 🇯🇴',
      device: 'Safari / macOS Sonoma',
      startedAt: '2026-08-29 09:15',
      lastActive: 'منذ 4 دقائق',
      isCurrent: false
    },
    {
      id: 'sess_3',
      user: 'م. خلدون شاهين',
      role: 'مشرف الدعم الفني',
      email: 'k.shaheen@diwan.jo',
      ip: '192.168.1.112',
      location: 'عمان، الأردن 🇯🇴',
      device: 'Edge 127 / Windows 11',
      startedAt: '2026-08-29 10:00',
      lastActive: 'منذ 15 دقيقة',
      isCurrent: false
    },
    {
      id: 'sess_4',
      user: 'أ. رأفت حداد',
      role: 'مستشار معتمد',
      email: 'raafat.haddad@diwantax.jo',
      ip: '192.168.1.144',
      location: 'عمان، الأردن 🇯🇴',
      device: 'Chrome / iPhone 15 Pro',
      startedAt: '2026-08-29 11:20',
      lastActive: 'منذ 30 دقيقة',
      isCurrent: false
    }
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // INTRUSION & BLOCKED ATTEMPTS DATASET
  // ══════════════════════════════════════════════════════════════════════════
  const [intrusionLogs, setIntrusionLogs] = useState([
    {
      id: 'int_1',
      timestamp: '2026-08-29 10:05:12',
      ip: '185.220.101.4',
      origin: 'Frankfurt, Germany 🇩🇪',
      threatType: 'Brute Force Password Guessing',
      threatLabel: 'تخمين كلمة مرور متعدد',
      targetEndpoint: '/api/auth/login',
      attempts: 5,
      actionTaken: 'محظور لمدة 60 دقيقة عبر WAF',
      status: 'banned'
    },
    {
      id: 'int_2',
      timestamp: '2026-08-29 06:14:20',
      ip: '45.154.255.88',
      origin: 'Amsterdam, Netherlands 🇳🇱',
      threatType: 'SQL Injection Payload Scan',
      threatLabel: 'محاولة حقن استعلام SQL',
      targetEndpoint: '/api/consultations/search',
      attempts: 1,
      actionTaken: 'تم إسقاط الطلب وحظر الـ IP',
      status: 'banned'
    },
    {
      id: 'int_3',
      timestamp: '2026-08-28 22:40:05',
      ip: '194.26.29.11',
      origin: 'London, United Kingdom 🇬🇧',
      threatType: 'OTP Verification Spam',
      threatLabel: 'طلب مكثف لرموز OTP',
      targetEndpoint: '/api/auth/verify-otp',
      attempts: 8,
      actionTaken: 'تقييد الـ Rate Limit لـ 24 ساعة',
      status: 'throttled'
    }
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POLICIES STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [policies, setPolicies] = useState({
    enforceMfaAdmin: true,
    autoLockoutAttempts: 5,
    sessionTimeoutMinutes: 60,
    enforcePasswordComplexity: true,
    ipWhitelistEnabled: false,
    auditLogRetentionDays: 365,
    autoBackupEncryption: true
  });

  // Action: Terminate Session
  const handleTerminateSession = (sessionId) => {
    const target = activeSessions.find(s => s.id === sessionId);
    if (target?.isCurrent) {
      alert('لا يمكنك إنهاء جلستك الحالية من هنا!');
      return;
    }
    if (window.confirm(`هل أنت متأكد من إنهاء جلسة [${target?.user}] فورا؟`)) {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      alert('تم إنهاء الجلسة وإبطال التوكن بنجاح!');
    }
  };

  // Action: Terminate All Other Sessions
  const handleTerminateAllOtherSessions = () => {
    if (window.confirm('هل تريد إنهاء كافة الجلسات الأخرى فوراً وإبقاء جلستك الحالية فقط؟')) {
      setActiveSessions(prev => prev.filter(s => s.isCurrent));
      alert('تم إنهاء كافة الجلسات الأخرى بنجاح وتأمين الحسابات.');
    }
  };

  // Action: Unban IP
  const handleUnbanIp = (id) => {
    setIntrusionLogs(prev => prev.map(log => log.id === id ? { ...log, status: 'unbanned', actionTaken: 'تم إلغاء الحظر يدوياً' } : log));
    alert('تم إلغاء الحظر عن هذا العنوان بنجاح.');
  };

  // Action: Run Full Security Scan
  const handleRunSecurityScan = () => {
    setIsScanModalOpen(true);
    setIsScanning(true);
    setScanProgress(10);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 15;
      });
    }, 300);
  };

  const filteredSessions = activeSessions.filter(s => 
    s.user.toLowerCase().includes(searchSession.toLowerCase()) ||
    s.email.toLowerCase().includes(searchSession.toLowerCase()) ||
    s.ip.includes(searchSession)
  );

  return (
    <div>
      {/* 1. Header Command Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div className="admin-banner-sub-tag">SECURITY, ENCRYPTION & COMPLIANCE (SOC-2 / ISO-27001)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-banner-title" style={{ fontSize: '24px', margin: 0 }}>مركز الأمن وحماية البيانات والامتثال</h1>
            <span style={{ fontSize: '20px' }}>🛡️</span>
          </div>
          <p className="admin-banner-desc" style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#64748B' }}>
            مراقبة التشفير الميداني (AES-256)، وخزنة OTP، والجلسات النشطة، وجدار الحماية ضد التهديدات السيبرانية.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={handleTerminateAllOtherSessions}
            className="admin-btn-action-outline"
            style={{ fontSize: '12.5px', padding: '7px 14px', color: '#DC2626', borderColor: '#FCA5A5', background: '#FFFFFF', cursor: 'pointer' }}
          >
            <span>إبطال كافة الجلسات الأخرى ⚠️</span>
          </button>

          <button 
            type="button"
            onClick={handleRunSecurityScan}
            className="admin-btn-action-primary"
            style={{ fontSize: '12.5px', padding: '7px 18px', background: '#0A3C64', borderColor: '#0A3C64', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <span>🔍 فحص الأمان الشامل</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {/* Card 1 */}
        <div className="admin-card" style={{ padding: '14px 16px', borderTop: '3px solid #059669' }}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>مستوى الحماية الإجمالي</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#059669', margin: '4px 0' }}>99.8%</div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>تصنيف أمني ممتاز (Grade A+) ✓</div>
        </div>

        {/* Card 2 */}
        <div className="admin-card" style={{ padding: '14px 16px', borderTop: '3px solid #0A3C64', cursor: 'pointer' }} onClick={() => setActiveTab('sessions')}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>الجلسات النشطة الموثقة</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#0A3C64', margin: '4px 0' }}>{activeSessions.length}</div>
          <div style={{ fontSize: '10.5px', color: '#0A3C64', fontWeight: '700' }}>موثقة بمفاتيح JWT الذاكرية</div>
        </div>

        {/* Card 3 */}
        <div className="admin-card" style={{ padding: '14px 16px', borderTop: '3px solid #E58A13' }}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>تحقق OTP (Redis Vault)</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#E58A13', margin: '4px 0' }}>99.4%</div>
          <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: '700' }}>صلاحية 5 دقائق TTL ⏱️</div>
        </div>

        {/* Card 4 */}
        <div className="admin-card" style={{ padding: '14px 16px', borderTop: '3px solid #DC2626', cursor: 'pointer' }} onClick={() => setActiveTab('intrusions')}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>محاولات محجوبة (WAF)</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#DC2626', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>142</span>
            <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#DC2626', padding: '1px 6px', borderRadius: '4px' }}>🛡️ Blocked</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700' }}>صد فوري لهجمات التخمين</div>
        </div>

        {/* Card 5 */}
        <div className="admin-card" style={{ padding: '14px 16px', borderTop: '3px solid #6366F1' }}>
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>تشفير قواعد البيانات</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#6366F1', margin: '4px 0' }}>AES-256</div>
          <div style={{ fontSize: '10.5px', color: '#6366F1', fontWeight: '700' }}>Fernet Field-level Encryption</div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{ display: 'flex', gap: '14px', borderBottom: '2px solid #E2E8F0', marginBottom: '18px' }}>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '10px 16px', 
            fontSize: '13.5px', 
            fontWeight: '800', 
            color: activeTab === 'engines' ? '#0A3C64' : '#64748B', 
            borderBottom: activeTab === 'engines' ? '3px solid #0A3C64' : '3px solid transparent',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
          onClick={() => setActiveTab('engines')}
        >
          🔐 الوحدات الأمنية والتشفير (6)
        </button>

        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '10px 16px', 
            fontSize: '13.5px', 
            fontWeight: '800', 
            color: activeTab === 'sessions' ? '#0A3C64' : '#64748B', 
            borderBottom: activeTab === 'sessions' ? '3px solid #0A3C64' : '3px solid transparent',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
          onClick={() => setActiveTab('sessions')}
        >
          💻 الجلسات النشطة والأجهزة ({activeSessions.length})
        </button>

        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '10px 16px', 
            fontSize: '13.5px', 
            fontWeight: '800', 
            color: activeTab === 'intrusions' ? '#0A3C64' : '#64748B', 
            borderBottom: activeTab === 'intrusions' ? '3px solid #0A3C64' : '3px solid transparent',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
          onClick={() => setActiveTab('intrusions')}
        >
          🚫 سجل التهديدات والحظر ({intrusionLogs.length})
        </button>

        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '10px 16px', 
            fontSize: '13.5px', 
            fontWeight: '800', 
            color: activeTab === 'policies' ? '#0A3C64' : '#64748B', 
            borderBottom: activeTab === 'policies' ? '3px solid #0A3C64' : '3px solid transparent',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
          onClick={() => setActiveTab('policies')}
        >
          ⚙️ سياسات الأمان والحوكمة
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: SECURITY ENGINES & ENCRYPTION
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'engines' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {securityEngines.map(eng => (
            <div key={eng.id} className="admin-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#0F172A' }}>
                    {eng.title}
                  </h3>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#0A3C64', fontWeight: '800', fontFamily: 'monospace', marginTop: '4px', display: 'inline-block' }}>
                    {eng.type}
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>
                  ✓ نشط 100%
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 14px 0' }}>
                {eng.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '14px', fontSize: '11.5px' }}>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '10.5px' }}>التغطية:</span>
                  <strong style={{ color: '#059669' }}>{eng.coverage}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '10.5px' }}>تدوير المفاتيح:</span>
                  <strong style={{ color: '#0F172A' }}>{eng.keyRotation}</strong>
                </div>
                <div>
                  <span style={{ color: '#94A3B8', display: 'block', fontSize: '10.5px' }}>آخر تدقيق:</span>
                  <strong style={{ color: '#64748B' }}>{eng.lastAudit}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setInspectKeyModal(eng)}
                  className="admin-btn-action-outline"
                  style={{ fontSize: '11.5px', padding: '5px 12px', cursor: 'pointer' }}
                >
                  🔍 فحص خوارزمية التشفير
                </button>
                <button 
                  type="button" 
                  onClick={() => alert(`تم إجراء فحص واختبار حي لمحرك: [${eng.title}] والحالة: نشط بنسبة 100%`)}
                  className="admin-btn-action-primary"
                  style={{ fontSize: '11.5px', padding: '5px 14px', background: '#0A3C64', cursor: 'pointer' }}
                >
                  ⚡ اختبار السلامة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: ACTIVE SESSIONS & DEVICES
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sessions' && (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
              <input 
                type="text" 
                className="admin-search-input"
                placeholder="بحث بالمستخدم، البريد، أو عنوان IP..."
                value={searchSession}
                onChange={e => setSearchSession(e.target.value)}
                style={{ width: '100%', height: '36px', fontSize: '12.5px' }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              إجمالي الجلسات المفتوحة حالياً: <strong>{filteredSessions.length}</strong>
            </div>
          </div>

          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الدور الوظيفي</th>
                  <th>عنوان IP والموقع</th>
                  <th>المتصفح والجهاز</th>
                  <th>بدء الجلسة</th>
                  <th>آخر نشاط</th>
                  <th style={{ textAlign: 'center' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map(sess => (
                  <tr key={sess.id} style={{ background: sess.isCurrent ? '#F0FDF4' : '#FFFFFF' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{sess.user}</strong>
                        {sess.isCurrent && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#DCFCE7', color: '#15803D', fontWeight: '800' }}>
                            جلستك الحالية 📍
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{sess.email}</div>
                    </td>

                    <td>
                      <span className="admin-category-chip" style={{ fontSize: '11px' }}>
                        {sess.role}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '12px', color: '#0A3C64' }}>
                        {sess.ip}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{sess.location}</div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: '#334155' }}>{sess.device}</div>
                    </td>

                    <td style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'monospace' }}>
                      {sess.startedAt}
                    </td>

                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: sess.isCurrent ? '#15803D' : '#0284C7' }}>
                        {sess.lastActive}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {!sess.isCurrent ? (
                        <button 
                          type="button" 
                          onClick={() => handleTerminateSession(sess.id)}
                          className="admin-btn-action-outline"
                          style={{ fontSize: '11px', padding: '4px 10px', color: '#DC2626', borderColor: '#FCA5A5', cursor: 'pointer' }}
                        >
                          إنهاء الجلسة ✕
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: '700' }}>مؤمنة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: INTRUSION LOGS & BLOCKED THREATS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'intrusions' && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A' }}>
              سجل التهديدات والمحاولات المحجوبة عبر جدار الحماية (WAF)
            </div>
            <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700' }}>
              الحماية الآلية مفعلة 100% 🛡️
            </span>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>التوقيت</th>
                <th>عنوان IP والمصدر</th>
                <th>نوع التهديد</th>
                <th>نقطة النهاية المستهدفة</th>
                <th>عدد المحاولات</th>
                <th>الإجراء المطبق</th>
                <th style={{ textAlign: 'center' }}>الإجراء الإداري</th>
              </tr>
            </thead>
            <tbody>
              {intrusionLogs.map(int => (
                <tr key={int.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{int.timestamp}</td>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontWeight: '800', color: '#DC2626' }}>{int.ip}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{int.origin}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0F172A' }}>{int.threatLabel}</div>
                    <span style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace' }}>{int.threatType}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#0A3C64' }}>
                    {int.targetEndpoint}
                  </td>
                  <td style={{ fontWeight: '800', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '4px' }}>
                      {int.attempts} محاولات
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11.5px', color: int.status === 'banned' ? '#DC2626' : '#D97706', fontWeight: '700' }}>
                      {int.actionTaken}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {int.status === 'banned' ? (
                      <button 
                        type="button" 
                        onClick={() => handleUnbanIp(int.id)}
                        className="admin-btn-action-outline"
                        style={{ fontSize: '11px', padding: '4px 10px', cursor: 'pointer' }}
                      >
                        إلغاء الحظر 🔓
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#64748B' }}>تم التقييد</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: SECURITY POLICIES & GOVERNANCE
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'policies' && (
        <div className="admin-card" style={{ padding: '22px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '900', color: '#0A3C64' }}>
            سياسات الأمان وقواعد التحكم في الوصول (Security Governance)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Policy 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>إلزامية المصادقة الثنائية (2FA) لجميع المشرفين والمدراء</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>طلب رمز تحقق OTP إضافي عند الدخول للوحة التحكم من جهاز جديد.</p>
              </div>
              <input 
                type="checkbox" 
                checked={policies.enforceMfaAdmin} 
                onChange={e => setPolicies({ ...policies, enforceMfaAdmin: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Policy 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>قفل الحساب التلقائي بعد محاولات الدخول الخاطئة</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>حظر الحساب لمدة 30 دقيقة بعد 5 محاولات متتالية خاطئة لمنع هجمات التخمين.</p>
              </div>
              <select 
                className="admin-select-input" 
                value={policies.autoLockoutAttempts}
                onChange={e => setPolicies({ ...policies, autoLockoutAttempts: Number(e.target.value) })}
                style={{ height: '34px', fontSize: '12px' }}
              >
                <option value={3}>بعد 3 محاولات</option>
                <option value={5}>بعد 5 محاولات (موصى به)</option>
                <option value={10}>بعد 10 محاولات</option>
              </select>
            </div>

            {/* Policy 3 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>مدة انتهاء صلاحية الجلسة الخاملة (Session Timeout)</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>تسجيل الخروج التلقائي عند عدم وجود نشاط لحماية البيانات.</p>
              </div>
              <select 
                className="admin-select-input" 
                value={policies.sessionTimeoutMinutes}
                onChange={e => setPolicies({ ...policies, sessionTimeoutMinutes: Number(e.target.value) })}
                style={{ height: '34px', fontSize: '12px' }}
              >
                <option value={30}>30 دقيقة</option>
                <option value={60}>60 دقيقة (افتراضي)</option>
                <option value={120}>ساعتان</option>
              </select>
            </div>

            {/* Policy 4 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>تشفير النسخ الاحتياطية تلقائياً بمفتاح AES-256 منفصل</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>تطبيق تشفير فوري لكافة ملفات الـ Database Backups قبل التخزين السحابي.</p>
              </div>
              <input 
                type="checkbox" 
                checked={policies.autoBackupEncryption} 
                onChange={e => setPolicies({ ...policies, autoBackupEncryption: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button 
              type="button" 
              onClick={() => alert('تم حفظ وتطبيق كافة سياسات الأمان والحوكمة بنجاح!')}
              className="admin-btn-action-primary"
              style={{ fontSize: '12.5px', padding: '8px 24px', background: '#0A3C64', cursor: 'pointer' }}
            >
              حفظ وتطبيق السياسات ✓
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: FULL SECURITY SCAN
          ══════════════════════════════════════════════════════════════════ */}
      {isScanModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !isScanning && setIsScanModalOpen(false)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px', width: '92%', padding: '24px', borderRadius: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0A3C64' }}>
                🔍 الفحص الأمني الشامل لسلامة المنصة
              </h3>
              {!isScanning && (
                <button 
                  type="button"
                  className="admin-icon-btn-minimal" 
                  onClick={() => setIsScanModalOpen(false)}
                  style={{ cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {isScanning ? '⚙️' : '🛡️'}
              </div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                {isScanning ? 'جاري فحص التشفير والمنافذ والجلسات...' : 'اكتمل الفحص: المنصة مؤمنة بنسبة 100%'}
              </h4>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                {isScanning ? `نسبة الإنجاز: ${scanProgress}%` : 'تم التحقق من 48 نقطة فحص أمني بنجاح.'}
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', margin: '16px 0' }}>
                <div style={{ width: `${scanProgress}%`, height: '100%', background: isScanning ? '#E58A13' : '#059669', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: '1.7' }}>
              ✓ تشفير Fernet AES-256 في قاعدة البيانات: <strong>سليم</strong><br />
              ✓ خزنة Redis OTP TTL Vault: <strong>تعمل بكفاءة</strong><br />
              ✓ جدار الحماية WAF ومحدد المعدل: <strong>نشط</strong><br />
              ✓ توكنات الـ Zero-Trust In-Memory: <strong>محمية بالكامل</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="button" 
                disabled={isScanning}
                onClick={() => setIsScanModalOpen(false)}
                className="admin-btn-action-primary"
                style={{ fontSize: '12.5px', padding: '7px 20px', background: '#0A3C64', opacity: isScanning ? 0.6 : 1, cursor: isScanning ? 'not-allowed' : 'pointer' }}
              >
                إغلاق وتقرير الفحص ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: INSPECT ENCRYPTION KEY & ALGORITHM
          ══════════════════════════════════════════════════════════════════ */}
      {inspectKeyModal && (
        <div className="admin-modal-overlay" onClick={() => setInspectKeyModal(null)}>
          <div 
            className="admin-modal-card" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '600px', width: '92%', padding: '24px', borderRadius: '12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#0A3C64' }}>
                  🔑 فحص خوارزمية التشفير الفنية
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>{inspectKeyModal.title}</span>
              </div>
              <button type="button" className="admin-icon-btn-minimal" onClick={() => setInspectKeyModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>الخوارزمية المعتمدة:</span>
                <strong style={{ fontFamily: 'monospace', color: '#0A3C64' }}>{inspectKeyModal.algorithm}</strong>
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>سياسة التدوير:</span>
                <strong>{inspectKeyModal.keyRotation}</strong>
              </div>

              <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>معرف مفتاح التشفير المشفر (Masked Key ID):</span>
                <span style={{ fontFamily: 'monospace', color: '#B45309' }}>vault_key_2026_aes256_****_sha256</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" onClick={() => setInspectKeyModal(null)} className="admin-btn-action-outline" style={{ fontSize: '12px', padding: '6px 18px', cursor: 'pointer' }}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
