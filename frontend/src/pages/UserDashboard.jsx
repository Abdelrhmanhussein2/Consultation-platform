import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { notificationService } from '../services/notificationService';

export default function UserDashboard({ navigate }) {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Ask state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch real backend data
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const [apptsData, cntData, notifsData] = await Promise.all([
        appointmentService.getMyAppointments(token).catch(() => []),
        notificationService.getUnreadCount(token).catch(() => ({ unread_count: 0 })),
        notificationService.getMyNotifications(token).catch(() => [])
      ]);
      setAppointments(apptsData || []);
      setUnreadNotifs(cntData.unread_count || 0);
      setNotifications(notifsData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Handle live ask AI
  const handleAiAsk = async (e) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;
    
    setAiLoading(true);
    setAiResponse('');
    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: aiQuery.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.answer || data.response || 'تم استلام الإجابة.');
      } else {
        setAiResponse('عذراً، حدث خطأ أثناء الاستعلام من المساعد الذكي.');
      }
    } catch (err) {
      setAiResponse('عذراً، تعذر الاتصال بالمساعد الذكي حالياً.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#005D9C', fontWeight: '700' }}>
        جاري تحميل لوحة التحكم والبيانات الضريبية الخاصة بك...
      </div>
    );
  }

  // Pre-populate AI input from quick chips
  const handleChipClick = (text) => {
    setAiQuery(text);
  };

  // Format first name / prefix
  const displayName = user?.full_name || 'المستفيد';

  // Format notification relative times or fallback
  const getAlertTime = (notif, index) => {
    if (!notif.created_at) {
      return index === 0 ? 'منذ ساعة' : index === 1 ? 'اليوم' : 'أمس';
    }
    const diffMs = new Date() - new Date(notif.created_at);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return new Date(notif.created_at).toLocaleDateString('ar-EG');
  };

  return (
    <div style={{ direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif', color: '#1E293B', paddingBottom: '40px' }}>
      
      {/* 1. Header & Quick Recommendations */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ color: '#F5A52A', fontSize: '11px', fontWeight: '800', background: '#FFF7ED', padding: '4px 10px', borderRadius: '12px' }}>
          لوحة المستفيد
        </span>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C', margin: '6px 0 8px 0' }}>
          مرحباً {displayName}، هذه أولوياتك الضريبية اليوم
        </h1>
        <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 20px 0' }}>
          مستجدات. أثر على ملفك. أدوات تنفيذ. واستشارة مباشرة في شاشة واحدة.
        </p>

        {/* Quick action recommendation chips */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            'حلل أثر هذا القرار على شركتي',
            'لخّص آخر تعديلات ضريبة الدخل',
            'جهّز أسئلة للمستشار',
            'راجع مستند ضريبي'
          ].map((text, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(text)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#F5A52A';
                e.target.style.color = '#F5A52A';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.color = '#475569';
              }}
            >
              {text} ✨
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 320px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column (AI Ask, Alerts, Stats Summary) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Ask AI Directly */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>اسأل مباشرة AI</h3>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#F5A52A', background: '#FFFBEB', padding: '2px 8px', borderRadius: '10px' }}>AI</span>
            </div>
            
            <form onSubmit={handleAiAsk}>
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="اسأل عن تشريع، قرار أو مخاطرة..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#F8FAFC',
                  marginBottom: '10px'
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', color: '#94A3B8', fontSize: '16px' }}>
                  <span style={{ cursor: 'pointer' }} title="إرفاق ملف">📎</span>
                  <span style={{ cursor: 'pointer' }} title="تسجيل صوتي">🎙️</span>
                </div>
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuery.trim()}
                  style={{
                    backgroundColor: '#F5A52A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(245, 165, 42, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {aiLoading ? 'جاري...' : 'إرسال ✈️'}
                </button>
              </div>
            </form>

            {/* AI Response Block */}
            {aiResponse && (
              <div style={{ 
                marginTop: '16px', 
                background: '#E5EFF5', 
                border: '1px solid #BAE6FD', 
                borderRadius: '12px', 
                padding: '14px',
                position: 'relative'
              }}>
                <button 
                  onClick={() => setAiResponse('')}
                  style={{ position: 'absolute', left: '10px', top: '10px', border: 'none', background: 'none', color: '#005D9C', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                >
                  ✕
                </button>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#005D9C', margin: '0 0 6px 0' }}>إجابة ديوان AI:</h4>
                <p style={{ fontSize: '11px', lineHeight: '1.5', color: '#1E293B', margin: 0, maxHeight: '180px', overflowY: 'auto' }}>
                  {aiResponse}
                </p>
              </div>
            )}
          </div>

          {/* Alerts Box */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔔</span>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>تنبيهاتك</h3>
              </div>
              <span style={{ background: '#FEE2E2', color: '#EF4444', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                {unreadNotifs}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notif, idx) => (
                  <div key={notif.id} style={{ display: 'flex', gap: '10px', borderBottom: idx < 2 ? '1px solid #F1F5F9' : 'none', paddingBottom: idx < 2 ? '12px' : 0 }}>
                    <span style={{ fontSize: '16px', color: '#F5A52A' }}>⚠️</span>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: '0 0 4px 0' }}>{notif.title || 'إشعار جديد'}</h4>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 2px 0' }}>{notif.content || notif.message}</p>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>{getAlertTime(notif, idx)}</span>
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback custom mock alerts matching the Lovable screenshot */
                <>
                  <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '16px', color: '#F5A52A' }}>⚠️</span>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: '0 0 4px 0' }}>تعديل قد يؤثر على قطاعك</h4>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 2px 0' }}>المادة (12) - قطاع التكنولوجيا</p>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>منذ ساعة</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '16px', color: '#10B981' }}>📈</span>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: '0 0 4px 0' }}>تقرير أثر جاهز</h4>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 2px 0' }}>ملخص مخاطر شهر يونيو</p>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>اليوم</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '16px', color: '#3B82F6' }}>📅</span>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: '0 0 4px 0' }}>استشارة مؤكدة</h4>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: '0 0 2px 0' }}>الخميس 2:00 م</p>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>أمس</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Profile Summary Stats */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px' }}>🏛️</span>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>ملخص ملفك</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>
                  {appointments.length}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>استشارة</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>28</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>مستند</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>2</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>مخاطرة</span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#0D3C5C', display: 'block' }}>12</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>محفوظ</span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column (Cards Grid, Action Steps, AI Analysis, Quick Tools, Expert opinions) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 3 cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            
            {/* Card 1: judicial decision */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#F5A52A', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>حكم قضائي</span>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>منذ 5 ساعات</span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 8px 0' }}>إلغاء تقدير ضريبي لقصور التسبيب</h4>
                <p style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                  محكمة التمييز تؤكد ضرورة بيان الأساس الواقعي والقانوني قبل فرض أي مطالبة.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>الأثر مرتفع</span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>←</span>
              </div>
            </div>

            {/* Card 2: legislative amendment */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#F5A52A', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>تعديل تشريعي</span>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>منذ 3 ساعات</span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 8px 0' }}>تعديل نطاق الخصم للشركات الصناعية</h4>
                <p style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                  توسيع شروط الخصم يتطلب تحديث سياسة المصاريف والعقود قبل نهاية الربع.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>الأثر يتطلب مراجعة</span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>←</span>
              </div>
            </div>

            {/* Card 3: explanatory decision */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#F5A52A', backgroundColor: '#FFFBEB', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>قرار تفسيري</span>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>منذ ساعتين</span>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 8px 0' }}>معالجة خدمات البرمجيات السحابية</h4>
                <p style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                  تفسير جديد لطريقة تصنيف الإيرادات الرقمية والاشتراكات العابرة للحدود.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #F8FAFC' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>الأثر متوسط</span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>←</span>
              </div>
            </div>

          </div>

          {/* Workflow Journey & AI Impact Analysis Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Step Workflow */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <span style={{ fontSize: '18px' }}>⚖️</span>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>رحلة العمل التالية</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { num: '1', text: 'اقرأ المستجد المؤثر' },
                  { num: '2', text: 'اطلب تحليل مستند' },
                  { num: '3', text: 'احجز مستشاراً إذا ظهرت مخاطرة' }
                ].map((step, index) => (
                  <div 
                    key={index}
                    onClick={() => {
                      if (step.num === '3') navigate('/consultants');
                      if (step.num === '2') navigate('/ai-assistant');
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      background: '#F8FAFC', 
                      padding: '12px 16px', 
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#F8FAFC'}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#FFF0D9',
                      color: '#F5A52A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}>{step.num}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Impact */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#F5A52A', fontWeight: '800' }}>تحليل التأثير بالذكاء الاصطناعي</span>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: '4px 0 0 0' }}>ماذا يعني الجديد لملفك؟</h3>
                  </div>
                  <div style={{ 
                    background: '#E0F2FE', 
                    color: '#0369A1', 
                    width: '42px', 
                    height: '42px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: '800', 
                    fontSize: '14px' 
                  }}>
                    96%
                  </div>
                </div>
                
                <p style={{ fontSize: '11px', lineHeight: '1.6', color: '#64748B', margin: 0 }}>
                  بناءً على قطاعك وملفك، التعديل الأخير يرفع أهمية مراجعة سياسة الخصم ومرفقات المصاريف. الأولوية الآن: تدقيق المستندات، تحديد المخاطر، ثم حجز جلسة متخصصة إذا وجد تعارض.
                </p>
              </div>

              {/* Progress items */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                {[
                  { text: 'أكمل ملفك', percent: 74, width: '74%' },
                  { text: 'راجع مستنداتك', percent: 42, width: '42%' },
                  { text: 'احجز مستشاراً', percent: 18, width: '18%' }
                ].map((item, idx) => (
                  <div key={idx} style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
                      <span>{item.text}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: item.width, height: '100%', background: '#F5A52A' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Tools */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', marginBottom: '14px' }}>أدوات سريعة</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
              {[
                { title: 'تحليل مستند', icon: '📄', path: '/ai-assistant' },
                { title: 'حجز استشارة', icon: '👥', path: '/consultants' },
                { title: 'الحاسبة', icon: '🧮', path: '/consultant/earnings' },
                { title: 'التشريعات', icon: '📚', path: '/regulations' },
                { title: 'ملفاتي', icon: '📁', path: '/consultant/earnings' }
              ].map((tool, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(tool.path)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F5A52A';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '8px' }}>{tool.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>{tool.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expert opinions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>آراء الخبراء</h3>
              <button 
                onClick={() => navigate('/consultants')}
                style={{ background: 'none', border: 'none', color: '#005D9C', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                عرض المستشارين &lt;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { 
                  name: 'أ. محمد العزام', 
                  initials: 'م',
                  spec: 'ضريبة دخل الشركات', 
                  text: 'ابدأوا بمراجعة بنود المصاريف الرأسمالية قبل تطبيق التعديل الجديد.',
                  likes: 27,
                  comments: 6
                },
                { 
                  name: 'د. سارة المجالي', 
                  initials: 'س',
                  spec: 'نزاعات ضريبية', 
                  text: 'أي مطالبة لا توضح الأساس الواقعي تفتح باباً قوياً للاعتراض الإداري.',
                  likes: 39,
                  comments: 8
                },
                { 
                  name: 'أ. ليان الحوراني', 
                  initials: 'ل',
                  spec: 'ضريبة المبيعات', 
                  text: 'الشركات الرقمية تحتاج فصل الإيرادات المحلية عن الاشتراكات العابرة للحدود.',
                  likes: 21,
                  comments: 5
                }
              ].map((expert, idx) => (
                <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '150px' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', justifyContent: 'flex-end' }}>
                      <div style={{ textAlign: 'left', marginRight: 'auto' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: 0 }}>{expert.name}</h4>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>{expert.spec}</span>
                      </div>
                      
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#FFF0D9', 
                        color: '#F5A52A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '12px'
                      }}>
                        {expert.initials}
                      </div>
                    </div>

                    <p style={{ fontSize: '11px', lineHeight: '1.5', color: '#475569', margin: 0, textAlign: 'right' }}>
                      {expert.text}
                    </p>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid #F1F5F9', paddingTop: '8px', fontSize: '10px', color: '#94A3B8' }}>
                    <span style={{ cursor: 'pointer' }}>🔖</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span>💬 {expert.comments}</span>
                      <span>👍 {expert.likes}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
