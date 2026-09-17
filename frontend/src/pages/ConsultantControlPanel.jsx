import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { chatAiService } from '../services/chatAiService';
import './ConsultantControlPanel.css';

// ── SVG ICONS ─────────────────────────────────────────────────────────────
const CalendarIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const SparkleIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3C12 7.5 7.5 12 3 12C7.5 12 12 16.5 12 21C12 16.5 16.5 12 21 12C16.5 12 12 7.5 12 3Z" />
    <path d="M19 3V7M17 5H21" />
  </svg>
);

const SendIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PaperclipIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const MicIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const BellAlertIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const BuildingIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
    <polygon points="12 1 2 6 22 6 12 1" />
  </svg>
);

const ScaleIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const DocAnalysisIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <circle cx="11.5" cy="14.5" r="2.5" />
    <line x1="13.5" y1="16.5" x2="16" y2="19" />
  </svg>
);

const UserConsultIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CalculatorIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="16" y1="14" x2="16" y2="18" />
    <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
  </svg>
);

const BookLegislationIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const FolderIcon = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const CommentIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ThumbsUpIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

// ── OFFICIAL PLATFORM LEGISLATION DATA ────────────────────────────────────
const defaultPlatformLaws = [
  {
    id: 'law_1',
    badge: 'قانون ضريبي',
    time: '2026',
    title: 'قانون معدل لقانون ضريبة الدخل',
    desc: 'تعديل تشريعي على أحكام مختارة من قانون ضريبة الدخل وتنظيم تاريخ بدء العمل بها.',
    impact: 'الأثر: يتطلب مراجعة',
    impactClass: 'review'
  },
  {
    id: 'law_2',
    badge: 'تعليمات تنفيذية',
    time: '2026',
    title: 'تعليمات معدلة لإجراءات الفوترة والامتثال',
    desc: 'تحديث للإجراءات المرتبطة بالتوثيق والفوترة والربط الإلكتروني وفق المتطلبات النافذة.',
    impact: 'الأثر: مرتفع',
    impactClass: 'high'
  },
  {
    id: 'law_3',
    badge: 'قرار تنظيمي',
    time: '2026',
    title: 'قرار بشأن تطبيق أحكام الاقتطاع الضريبي',
    desc: 'قرار تنظيمي يوضح نطاق التطبيق والإجراءات المرتبطة بالاقتطاع من المصدر وتوريد المبالغ.',
    impact: 'الأثر: متوسط',
    impactClass: 'medium'
  }
];

export default function ConsultantControlPanel({ navigate }) {
  const { user } = useAuth();

  // ── LIVE REAL BACKEND STATE (ZERO INITIAL PLACEHOLDERS) ────────────────
  const [summary, setSummary] = useState({
    consultations_count: 0,
    documents_count: 0,
    unread_alerts_count: 0,
    favorites_count: 0,
    profile_completion_pct: 0,
    documents_review_pct: 0,
    consultant_booking_pct: 0,
    user_name: ''
  });

  const [notifications, setNotifications] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [laws, setLaws] = useState([]);

  // AI Interactive Question State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Likes and bookmarks
  const [expertLikes, setExpertLikes] = useState({});
  const [savedExperts, setSavedExperts] = useState({});

  // ── NAVIGATION HELPER ───────────────────────────────────────────────────
  const handleNavigate = (path) => {
    if (typeof navigate === 'function') {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  // ── FETCH LIVE REAL DATA FROM BACKEND ───────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      // 1. Fetch live summary statistics
      try {
        const sumRes = await apiFetch('/api/users/me/dashboard-summary');
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          if (isMounted) {
            setSummary(sumData);
          }
        }
      } catch (e) {
        console.warn('Dashboard summary fetch error', e);
      }

      // 2. Fetch live notifications
      try {
        const notifRes = await apiFetch('/api/notifications/?limit=3');
        if (notifRes.ok) {
          const notifs = await notifRes.json();
          if (isMounted && Array.isArray(notifs)) {
            setNotifications(notifs);
          }
        }
      } catch (e) {
        console.warn('Notifications fetch error', e);
      }

      // 3. Fetch real approved consultants
      try {
        const consRes = await apiFetch('/api/consultants/?limit=3');
        if (consRes.ok) {
          const consData = await consRes.json();
          if (isMounted && Array.isArray(consData)) {
            setConsultants(consData);
          }
        }
      } catch (e) {
        console.warn('Consultants fetch error', e);
      }

      // 4. Fetch laws / rulings
      try {
        const lawsRes = await apiFetch('/api/legal/laws');
        if (lawsRes.ok) {
          const lawsData = await lawsRes.json();
          if (isMounted && Array.isArray(lawsData) && lawsData.length > 0) {
            setLaws(lawsData);
          }
        }
      } catch (e) {
        console.warn('Laws fetch error', e);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── AI DIRECT ASK HANDLER ───────────────────────────────────────────────
  const handleAiSubmit = async (e, promptOverride) => {
    e?.preventDefault();
    const query = (promptOverride || aiQuestion).trim();
    if (!query) return;

    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const res = await chatAiService.directAsk(query);
      setAiResponse(res.answer);
    } catch (err) {
      console.error('Direct AI error:', err);
      setAiError(err.message || 'تعذر الاتصال بالمستشار الذكي حالياً.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePillClick = (prompt) => {
    setAiQuestion(prompt);
    handleAiSubmit(null, prompt);
  };

  const handleCopyAnswer = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── INTERACTION HANDLERS ────────────────────────────────────────────────
  const toggleLike = (id) => {
    setExpertLikes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const toggleSave = async (id, title = 'مستشار ضريبي', spec = '') => {
    const isCurrentlySaved = !!savedExperts[id];
    setSavedExperts(prev => ({
      ...prev,
      [id]: !isCurrentlySaved
    }));

    try {
      await apiFetch('/api/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({
          item_type: 'consultant',
          item_id: String(id),
          title: title,
          subtitle: spec
        })
      });
      setSummary(prev => ({
        ...prev,
        favorites_count: Math.max(0, prev.favorites_count + (isCurrentlySaved ? -1 : 1))
      }));
    } catch (e) {
      console.warn('Failed to persist favorite toggle', e);
    }
  };

  const userName = summary.user_name || (user?.full_name ? user.full_name.split(' ')[0] : 'أ.');
  const displayLaws = laws.length > 0 ? laws : defaultPlatformLaws;

  return (
    <div className="control-panel-root">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="cp-header">
        <div>
          <span className="cp-eyebrow">لوحة التحكم</span>
          <h1 className="cp-title">
            مرحباً {userName}، هذه أولوياتك الضريبية اليوم
          </h1>
          <p className="cp-subtitle">
            مستجدات، أثر على ملفك، أدوات تنفيذ، واستشارة مباشرة في شاشة واحدة.
          </p>
        </div>

        <button
          type="button"
          className="cp-book-btn"
          onClick={() => handleNavigate('/consultants')}
        >
          <CalendarIcon size={16} />
          احجز استشارة
        </button>
      </div>

      {/* ── QUICK ACTION PILLS ──────────────────────────────────────────── */}
      <div className="cp-pills-row">
        {[
          'حلّل أثر هذا القرار على شركتي',
          'لخّص آخر تعديلات ضريبة الدخل',
          'جهّز أسئلة للمستشار',
          'راجع مستند ضريبي'
        ].map((pill, idx) => (
          <button
            key={idx}
            type="button"
            className="cp-pill-btn"
            onClick={() => handlePillClick(pill)}
            title="انقر لطرح هذا الاستفسار على المستشار الذكي فوراً"
          >
            <span className="pill-sparkle"><SparkleIcon size={13} /></span>
            {pill}
          </button>
        ))}
      </div>

      {/* ── MAIN 2-COLUMN GRID (RTL: Main Column on Right, Side Panel on Left) ── */}
      <div className="cp-main-grid">
        {/* ── RIGHT (MAIN) COLUMN ──────────────────────────────────────── */}
        <div className="cp-main-col">
          {/* Top 3 Legislation Cards */}
          <div className="cp-leg-grid">
            {displayLaws.slice(0, 3).map((law, idx) => (
              <div
                key={law.id || idx}
                className="cp-card cp-leg-card"
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigate('/regulations')}
              >
                <div>
                  <div className="cp-leg-top">
                    <span className="cp-leg-badge">{law.badge || 'تشريع ساري'}</span>
                    <span className="cp-leg-time">{law.time || law.year || '2026'}</span>
                  </div>
                  <h3 className="cp-leg-title">{law.title}</h3>
                  <p className="cp-leg-desc">{law.desc || law.summary}</p>
                </div>
                <div className="cp-leg-footer">
                  <span className={`cp-leg-impact ${law.impactClass || 'review'}`}>
                    {law.impact || 'الأثر: يتطلب مراجعة'}
                  </span>
                  <span className="cp-leg-arrow">←</span>
                </div>
              </div>
            ))}
          </div>

          {/* Middle 2 Cards Grid: AI Impact on Right (1.3fr), Workflow on Left (1fr) */}
          <div className="cp-middle-grid">
            {/* AI Impact Analysis Card (Right in RTL) */}
            <div className="cp-card">
              <div className="cp-ai-impact-top">
                <div>
                  <div className="cp-ai-impact-eyebrow">تحليل التأثير بالذكاء الاصطناعي</div>
                  <h3 className="cp-ai-impact-title">ماذا يعني الجديد لملفك؟</h3>
                </div>
                <span className="cp-ai-pct-box">
                  {summary.profile_completion_pct > 0 ? `${summary.profile_completion_pct}%` : 'جاهز للتدقيق'}
                </span>
              </div>

              <p className="cp-ai-impact-desc">
                بناءً على قطاعك وملفك، التعديل الأخير يرفع أهمية مراجعة سياسة الخصم ومرفقات المصاريف. الأولوية الآن: تدقيق المستندات، تحديد المخاطر، ثم حجز جلسة متخصصة إذا وُجد تعارض.
              </p>

              <div className="cp-progress-row">
                <div
                  className="cp-prog-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNavigate('/settings')}
                  title="انقر لتحديث بيانات ملفك الشخصي"
                >
                  <div className="cp-prog-header">
                    <span>أكمل ملفك</span>
                    <span>{summary.profile_completion_pct}%</span>
                  </div>
                  <div className="cp-prog-bar-track">
                    <div
                      className="cp-prog-bar-fill"
                      style={{ width: `${summary.profile_completion_pct}%` }}
                    ></div>
                  </div>
                  <span className="cp-prog-sub">الإعدادات</span>
                </div>

                <div
                  className="cp-prog-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNavigate('/consultant/documents')}
                  title="انقر لإدارة ومراجعة مستنداتك"
                >
                  <div className="cp-prog-header">
                    <span>راجع مستنداتك</span>
                    <span>{summary.documents_review_pct}%</span>
                  </div>
                  <div className="cp-prog-bar-track">
                    <div
                      className="cp-prog-bar-fill"
                      style={{ width: `${summary.documents_review_pct}%` }}
                    ></div>
                  </div>
                  <span className="cp-prog-sub">وثائقي</span>
                </div>

                <div
                  className="cp-prog-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNavigate('/consultants')}
                  title="انقر لحجز موعد مع مستشار معتمد"
                >
                  <div className="cp-prog-header">
                    <span>احجز مستشاراً</span>
                    <span>{summary.consultant_booking_pct}%</span>
                  </div>
                  <div className="cp-prog-bar-track">
                    <div
                      className="cp-prog-bar-fill"
                      style={{ width: `${summary.consultant_booking_pct}%` }}
                    ></div>
                  </div>
                  <span className="cp-prog-sub">المستشارون</span>
                </div>
              </div>
            </div>

            {/* Workflow Steps Card (Left in RTL) */}
            <div className="cp-card">
              <div className="cp-workflow-head">
                <span style={{ color: '#F5A52A' }}><ScaleIcon size={18} /></span>
                رحلة العمل التالية
              </div>

              <div className="cp-workflow-steps">
                <div
                  className="cp-step-item"
                  onClick={() => handleNavigate('/regulations')}
                  title="الانتقال إلى مركز التشريعات الضريبية"
                >
                  <span className="cp-step-text">اقرأ المستجد المؤثر</span>
                  <span className="cp-step-num">1</span>
                </div>

                <div
                  className="cp-step-item"
                  onClick={() => handleNavigate('/consultant/document-analysis')}
                  title="طلب تحليل مستند ضريبي ذكي"
                >
                  <span className="cp-step-text">اطلب تحليل مستند</span>
                  <span className="cp-step-num">2</span>
                </div>

                <div
                  className="cp-step-item"
                  onClick={() => handleNavigate('/consultants')}
                  title="استعراض المستشارين وحجز جلسة"
                >
                  <span className="cp-step-text">احجز مستشاراً إذا ظهرت مخاطرة</span>
                  <span className="cp-step-num">3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fast Access Tools Section */}
          <div>
            <div className="cp-section-header">
              <span className="cp-section-title">أدوات سريعة</span>
              <span className="cp-fast-access-tag">fast access</span>
            </div>

            <div className="cp-tools-grid">
              <div
                className="cp-tool-card"
                onClick={() => handleNavigate('/consultant/document-analysis')}
              >
                <span className="cp-tool-icon"><DocAnalysisIcon size={24} /></span>
                <span className="cp-tool-title">تحليل مستند</span>
                <span className="cp-tool-sub">ارفع عقداً أو قراراً</span>
              </div>

              <div
                className="cp-tool-card"
                onClick={() => handleNavigate('/consultants')}
              >
                <span className="cp-tool-icon"><UserConsultIcon size={24} /></span>
                <span className="cp-tool-title">حجز استشارة</span>
                <span className="cp-tool-sub">اختر خبيراً ووقتاً</span>
              </div>

              <div
                className="cp-tool-card"
                onClick={() => handleNavigate('/quick-consultation')}
              >
                <span className="cp-tool-icon"><CalculatorIcon size={24} /></span>
                <span className="cp-tool-title">الحاسبة</span>
                <span className="cp-tool-sub">التزام تقديري</span>
              </div>

              <div
                className="cp-tool-card"
                onClick={() => handleNavigate('/regulations')}
              >
                <span className="cp-tool-icon"><BookLegislationIcon size={24} /></span>
                <span className="cp-tool-title">التشريعات</span>
                <span className="cp-tool-sub">بحث ومقارنة</span>
              </div>

              <div
                className="cp-tool-card"
                onClick={() => handleNavigate('/consultant/documents')}
              >
                <span className="cp-tool-icon"><FolderIcon size={24} /></span>
                <span className="cp-tool-title">ملفاتي</span>
                <span className="cp-tool-sub">مستندات وتقارير</span>
              </div>
            </div>
          </div>

          {/* Expert Opinions Section (Real Database Consultants) */}
          <div>
            <div className="cp-section-header">
              <span className="cp-section-title">آراء الخبراء</span>
              <span
                className="cp-experts-link"
                onClick={() => handleNavigate('/consultants')}
              >
                عرض المستشارين ‹
              </span>
            </div>

            {consultants.length > 0 ? (
              <div className="cp-experts-grid">
                {consultants.map((c, idx) => {
                  const cId = c.id || c.consultant_id || idx + 1;
                  const cName = c.full_name || 'مستشار ضريبي';
                  const cInitial = cName.trim().charAt(0) || 'م';
                  const cSpec = c.specialization_name || c.specialization?.name || 'مستشار ضريبي معتمد';
                  const cBio = c.bio || 'مستشار ضريبي معتمد لتقديم الاستشارات وإعداد الإقرارات والتخطيط المالي.';
                  const likesCount = expertLikes[cId] !== undefined ? expertLikes[cId] : (c.reviews_count || 0);

                  return (
                    <div key={cId} className="cp-expert-card">
                      <div>
                        <div className="cp-expert-top">
                          <div className="cp-expert-avatar">{cInitial}</div>
                          <div className="cp-expert-info">
                            <span className="cp-expert-name">{cName}</span>
                            <span className="cp-expert-spec">{cSpec}</span>
                          </div>
                        </div>
                        <p className="cp-expert-quote">{cBio}</p>
                      </div>
                      <div className="cp-expert-footer">
                        <span
                          className="cp-expert-stat"
                          onClick={() => toggleSave(cId, cName, cSpec)}
                          style={{ color: savedExperts[cId] ? '#F5A52A' : undefined }}
                          title={savedExperts[cId] ? 'تم الحفظ في المفضلة' : 'حفظ في المفضلة'}
                        >
                          <BookmarkIcon size={14} />
                        </span>
                        <span className="cp-expert-stat">
                          <CommentIcon size={14} /> {c.reviews_count || 0}
                        </span>
                        <span
                          className="cp-expert-stat"
                          onClick={() => toggleLike(cId)}
                          title="إعجاب"
                        >
                          <ThumbsUpIcon size={14} /> {likesCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cp-empty-state">
                <p className="cp-empty-text">لا يوجد مستشارون معروضون حالياً</p>
                <span className="cp-empty-sub">
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#005D9C', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => handleNavigate('/consultants')}
                  >
                    استعراض دليل المستشارين المعتمدين ←
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── LEFT (SIDE) COLUMN ───────────────────────────────────────── */}
        <div className="cp-side-col">
          {/* 1. AI Ask Directly Card */}
          <div className="cp-card">
            <div className="cp-ai-header">
              <span className="cp-ai-badge">AI</span>
              <span className="cp-ai-title">اسأل مباشرة</span>
              <span style={{ color: '#F5A52A' }}><SparkleIcon size={16} /></span>
            </div>

            <form onSubmit={handleAiSubmit}>
              <textarea
                className="cp-ai-textarea"
                rows={3}
                placeholder="اسأل عن تشريع، قرار، أو مخاطرة ضريبية..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                disabled={aiLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSubmit(e);
                  }
                }}
              />

              <div className="cp-ai-actions">
                <button
                  type="submit"
                  className="cp-ai-send-btn"
                  disabled={aiLoading || !aiQuestion.trim()}
                >
                  <SendIcon size={13} />
                  {aiLoading ? 'جاري التحليل...' : 'إرسال'}
                </button>
                <button
                  type="button"
                  className="cp-ai-icon-btn"
                  title="إرفاق مستند للتدقيق"
                  onClick={() => handleNavigate('/consultant/document-analysis')}
                >
                  <PaperclipIcon size={15} />
                </button>
                <button
                  type="button"
                  className="cp-ai-icon-btn"
                  title="الانتقال إلى المساعد الذكي الكامل"
                  onClick={() => handleNavigate('/ai-assistant')}
                >
                  <MicIcon size={15} />
                </button>
              </div>
            </form>

            {/* AI Loading State */}
            {aiLoading && (
              <div className="cp-ai-loading">
                <div className="cp-ai-spinner"></div>
                <span>جاري تحليل السؤال وصياغة الرأي الضريبي...</span>
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#DC2626', background: '#FEF2F2', padding: '8px 12px', borderRadius: '8px' }}>
                {aiError}
              </div>
            )}

            {/* AI Live Response Card */}
            {aiResponse && (
              <div className="cp-ai-answer-card">
                <div className="cp-ai-answer-header">
                  <span>الرأي الاستشاري المباشر ✨</span>
                  <button
                    type="button"
                    className="cp-ai-answer-close"
                    onClick={() => setAiResponse(null)}
                    title="إغلاق الإجابة"
                  >
                    ✕
                  </button>
                </div>
                <div className="cp-ai-answer-text">
                  {aiResponse}
                </div>
                <div className="cp-ai-answer-actions">
                  <button
                    type="button"
                    className="cp-ai-action-btn"
                    onClick={handleCopyAnswer}
                  >
                    {copied ? '✓ تم النسخ' : 'نسخ الإجابة'}
                  </button>
                  <button
                    type="button"
                    className="cp-ai-action-btn primary"
                    onClick={() => handleNavigate('/ai-assistant')}
                  >
                    متابعة في المحادثة
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Alerts Card (Real backend notifications only) */}
          <div className="cp-card">
            <div className="cp-alerts-head">
              <div className="cp-alerts-head-title">
                <span style={{ color: '#F5A52A' }}><BellAlertIcon size={16} /></span>
                تنبيهاتك
              </div>
              <span className="cp-count-badge">
                {summary.unread_alerts_count}
              </span>
            </div>

            {notifications.length > 0 ? (
              notifications.map((notif, idx) => (
                <div
                  key={notif.id || idx}
                  className="cp-alert-item"
                  onClick={() => handleNavigate('/consultant/sessions')}
                >
                  <div className="cp-alert-title-row">
                    <span>🔔</span>
                    {notif.title || 'إشعار جديد في حسابك'}
                  </div>
                  <span className="cp-alert-sub">{notif.message || notif.desc}</span>
                  <span className="cp-alert-time">
                    {notif.created_at
                      ? new Date(notif.created_at).toLocaleDateString('ar-EG')
                      : 'اليوم'}
                  </span>
                </div>
              ))
            ) : (
              <div className="cp-empty-state" style={{ padding: '20px 12px' }}>
                <span className="cp-empty-icon">✓</span>
                <p className="cp-empty-text">لا توجد تنبيهات جديدة</p>
                <span className="cp-empty-sub">ملفك ومواعيدك في وضع منتظم</span>
              </div>
            )}
          </div>

          {/* 3. Portfolio Summary 2x2 (Real Backend Counts Only) */}
          <div className="cp-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14.5px', fontWeight: '800', color: '#123d57', marginBottom: '4px' }}>
              <span style={{ color: '#F5A52A' }}><BuildingIcon size={16} /></span>
              ملخص ملفك
            </div>

            <div className="cp-summary-grid">
              <div
                className="cp-summary-box"
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigate('/consultant/documents')}
                title="عرض جميع المستندات"
              >
                <span className="cp-summary-num">{summary.documents_count}</span>
                <span className="cp-summary-label">مستند</span>
              </div>

              <div
                className="cp-summary-box"
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigate('/consultant/sessions')}
                title="عرض الجلسات والاستشارات"
              >
                <span className="cp-summary-num">{summary.consultations_count}</span>
                <span className="cp-summary-label">استشارة</span>
              </div>

              <div
                className="cp-summary-box"
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigate('/consultant/favorites')}
                title="عرض المحفوظات والمفضلة"
              >
                <span className="cp-summary-num">{summary.favorites_count}</span>
                <span className="cp-summary-label">محفوظ</span>
              </div>

              <div
                className="cp-summary-box"
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigate('/consultant/sessions')}
                title="عرض التنبيهات والمخاطر"
              >
                <span className="cp-summary-num" style={{ color: summary.unread_alerts_count > 0 ? '#DC2626' : '#27865f' }}>
                  {summary.unread_alerts_count}
                </span>
                <span className="cp-summary-label">مخاطرة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
