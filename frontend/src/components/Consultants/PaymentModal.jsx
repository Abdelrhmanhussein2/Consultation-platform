import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import Toast, { useToast } from '../Toast/Toast';
import '../VideoSession/VideoSessionModal.css';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  appointmentId, 
  price = 50, 
  consultantName = 'أ. رأفت حداد', 
  serviceName = 'استشارة فيديو',
  isMock = false
}) {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('methods'); // 'methods', 'card', 'bank_transfer', 'wallet', 'cliq'

  // Card Form States
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // File Upload Simulation States
  const [uploadedFile, setUploadedFile] = useState(null);

  if (!isOpen) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ إلى الحافظة!', 'success');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0].name);
      showToast('تم إرفاق إثبات الدفع بنجاح!', 'success');
    }
  };

  const handlePaymentSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validations based on view
    if (view === 'card') {
      if (!cardNumber || !cardHolder || !expiry || !cvv) {
        showToast('يرجى تعبئة كافة بيانات البطاقة.', 'error');
        return;
      }
    } else if (view !== 'methods') {
      if (!uploadedFile) {
        showToast('يرجى إرفاق إثبات الدفع أولاً.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (isMock) {
        showToast('تمت عملية الدفع بنجاح (وضع التجربة)!', 'success');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
        return;
      }

      await appointmentService.payAppointment(appointmentId, token, view);
      showToast('تمت عملية الدفع بنجاح!', 'success');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      showToast(err.message || 'حدث خطأ أثناء معالجة الدفع.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderCopyButton = (text) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text)}
      style={{
        background: 'none',
        border: 'none',
        color: '#64748B',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '2px'
      }}
      title="نسخ"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );

  return ReactDOM.createPortal(
    <div
      className="video-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '85px',
        paddingBottom: '30px',
        paddingLeft: '16px',
        paddingRight: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      <Toast {...toast} />
      <div
        className="fade-in"
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          direction: 'rtl',
          border: '1px solid #E2E8F0',
          position: 'relative',
          boxSizing: 'border-box',
          margin: 'auto 0'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            إجراء الدفع
          </h3>
          <button 
            onClick={onClose} 
            disabled={loading}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              cursor: 'pointer', 
              color: '#64748B',
              lineHeight: '1',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Service summary card */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid #E2E8F0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>الخدمة</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C' }}>
              {serviceName} مع {consultantName} - ديوان
            </span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>المبلغ الإجمالي</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#F5A52A' }}>
              {price} <span style={{ fontSize: '12px', fontWeight: '600' }}>دينار</span>
            </span>
          </div>
        </div>

        {/* Dynamic Views */}
        {view === 'methods' && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', marginBottom: '16px' }}>
              اختر طريقة الدفع المناسبة
            </h4>

            {/* Methods Selection list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  key: 'card',
                  title: 'بطاقة بنكية',
                  sub: 'الدفع الفوري باستخدام بطاقة الائتمان',
                  badge: 'أسرع',
                  badgeBg: '#E0F2FE',
                  badgeColor: '#0369A1',
                  iconBg: '#EFF6FF',
                  iconColor: '#2563EB',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  )
                },
                {
                  key: 'bank_transfer',
                  title: 'التحويل البنكي',
                  sub: 'حوّل المبلغ مباشرة من حسابك إلى حساب المنصة',
                  badge: 'محاكاة',
                  badgeBg: '#F1F5F9',
                  badgeColor: '#475569',
                  iconBg: '#ECFDF5',
                  iconColor: '#10B981',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 22h18" />
                      <path d="M6 18v-7" />
                      <path d="M10 18v-7" />
                      <path d="M14 18v-7" />
                      <path d="M18 18v-7" />
                      <path d="M12 2L2 7h20L12 2z" />
                    </svg>
                  )
                },
                {
                  key: 'wallet',
                  title: 'المحافظ الإلكترونية',
                  sub: 'الدفع عبر محفظتك الإلكترونية المفضلة',
                  badge: 'محاكاة',
                  badgeBg: '#F1F5F9',
                  badgeColor: '#475569',
                  iconBg: '#F5F3FF',
                  iconColor: '#7C3AED',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                    </svg>
                  )
                },
                {
                  key: 'cliq',
                  title: 'الدفع عبر CliQ',
                  sub: 'إرسال فوري عبر نظام الدفع الوطني CliQ',
                  badge: 'محاكاة',
                  badgeBg: '#F1F5F9',
                  badgeColor: '#475569',
                  iconBg: '#FFF7ED',
                  iconColor: '#EA580C',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  )
                }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setView(opt.key);
                    setUploadedFile(null);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'right'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ color: '#94A3B8', fontSize: '14px', marginLeft: '6px' }}>&lt;</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{opt.title}</span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: '700',
                          backgroundColor: opt.badgeBg,
                          color: opt.badgeColor,
                          padding: '1px 6px',
                          borderRadius: '10px'
                        }}>
                          {opt.badge}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>
                        {opt.sub}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: opt.iconBg,
                    color: opt.iconColor,
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {opt.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'card' && (
          <form onSubmit={handlePaymentSubmit}>
            {/* Dark Card Preview */}
            <div style={{
              background: 'linear-gradient(135deg, #0A1C2A, #142F44)',
              borderRadius: '16px',
              padding: '20px',
              color: '#FFFFFF',
              position: 'relative',
              height: '160px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              marginBottom: '20px',
              boxShadow: '0 8px 16px rgba(10,28,42,0.15)'
            }}>
              {/* Card top chips */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: '32px',
                  height: '24px',
                  backgroundColor: '#F5A52A',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(245,165,42,0.2)'
                }} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>

              {/* Number */}
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                letterSpacing: '3px',
                textAlign: 'center',
                fontFamily: 'monospace',
                margin: '12px 0'
              }}>
                {cardNumber || '0000 0000 0000 0000'}
              </div>

              {/* Holder & Exp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <div>
                  <span style={{ display: 'block', color: '#94A3B8', fontSize: '9px' }}>اسم حامل البطاقة</span>
                  <span style={{ fontWeight: '700', textTransform: 'uppercase' }}>{cardHolder || 'FULL NAME'}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', color: '#94A3B8', fontSize: '9px' }}>تنتهي في</span>
                  <span style={{ fontWeight: '700' }}>{expiry || 'MM / YY'}</span>
                </div>
              </div>
            </div>

            {/* Inputs Box */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💳 بيانات البطاقة
              </h4>

              {/* Number Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>رقم البطاقة</label>
                <input 
                  type="text" 
                  maxLength="19"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Holder Name */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>الاسم على البطاقة</label>
                <input 
                  type="text" 
                  placeholder="FULL NAME"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Expiry & CVV */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>تاريخ الصلاحية</label>
                  <input 
                    type="text" 
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '4px' }}>CVV</label>
                  <input 
                    type="text" 
                    maxLength="3"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Warning */}
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔒 محاكاة داخلية. لا تُرسل بيانات البطاقة لأي خادم خارجي.</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🛡️ دفع {price} دينار</span>
              </button>
              <button
                type="button"
                onClick={() => setView('methods')}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>الرجوع →</span>
              </button>
            </div>
          </form>
        )}

        {view === 'bank_transfer' && (
          <div>
            {/* Account Details Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏛️ بيانات الحساب
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {[
                  { label: 'البنك', val: 'بنك الأردن' },
                  { label: 'اسم الحساب', val: 'شركة ديوان للحلول الذكية والقانونية' },
                  { label: 'رقم الحساب', val: '0123456789012' },
                  { label: 'IBAN', val: 'JO12ARAB0000000123456789012' },
                  { label: 'SWIFT', val: 'ARBKJOAX' },
                  { label: 'الفرع', val: 'فرع شميساني - عمان' }
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 5 ? '1px solid #E2E8F0' : 'none', paddingBottom: i < 5 ? '6px' : '0' }}>
                    <span style={{ color: '#64748B' }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#1E293B' }}>{row.val}</span>
                      {renderCopyButton(row.val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning yellow block */}
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#B45309',
              lineHeight: '1.4',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>بعد إجراء التحويل، ارفق إثبات الدفع للمراجعة. التأكيد يستغرق 1-2 يوم عمل.</span>
            </div>

            {/* File upload */}
            {renderUploadSection()}

            {/* Actions */}
            {renderActionButtons()}
          </div>
        )}

        {view === 'wallet' && (
          <div>
            {/* Wallet Details Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                👛 بيانات المحفظة
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {[
                  { label: 'المحفظة', val: 'محفظة ديوان الإلكترونية' },
                  { label: 'الرقم', val: '4567 123 0779' },
                  { label: 'المستفيد', val: 'شركة ديوان للحلول الذكية' },
                  { label: 'المزود', val: 'Orange Money' }
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 3 ? '1px solid #E2E8F0' : 'none', paddingBottom: i < 3 ? '6px' : '0' }}>
                    <span style={{ color: '#64748B' }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#1E293B' }}>{row.val}</span>
                      {renderCopyButton(row.val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning yellow block */}
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#B45309',
              lineHeight: '1.4',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>بعد الدفع من المحفظة، ارفق لقطة الشاشة أو إثبات التحويل.</span>
            </div>

            {/* File upload */}
            {renderUploadSection()}

            {/* Actions */}
            {renderActionButtons()}
          </div>
        )}

        {view === 'cliq' && (
          <div>
            {/* CliQ Details Box */}
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔄 بيانات CliQ
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                {[
                  { label: 'الاسم المعروف (Alias)', val: 'DiwanJo' },
                  { label: 'الهاتف', val: '+962 79 123 4567' },
                  { label: 'الاسم', val: 'ديوان - منصة المعرفة الضريبية' },
                  { label: 'البنك', val: 'بنك الأردن' }
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 3 ? '1px solid #E2E8F0' : 'none', paddingBottom: i < 3 ? '6px' : '0' }}>
                    <span style={{ color: '#64748B' }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#1E293B' }}>{row.val}</span>
                      {renderCopyButton(row.val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning yellow block */}
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#B45309',
              lineHeight: '1.4',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>افتح تطبيق البنك الخاص بك، اختر إرسال باستخدام Alias، وأدخل DiwanJo.</span>
            </div>

            {/* File upload */}
            {renderUploadSection()}

            {/* Actions */}
            {renderActionButtons()}
          </div>
        )}

        {/* Footer info */}
        {view === 'methods' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '20px',
            fontSize: '11px',
            color: '#94A3B8'
          }}>
            <span>🛡️ جميع عمليات الدفع مشفّرة بتشفير bit-256</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );

  function renderUploadSection() {
    return (
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginBottom: '8px' }}>
          إثبات الدفع (صورة / ملف)
        </span>
        <label style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px dashed #CBD5E1',
          borderRadius: '16px',
          padding: '20px',
          cursor: 'pointer',
          backgroundColor: '#F8FAFC',
          transition: 'all 0.2s',
          height: '60px'
        }}>
          <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
          <span style={{ fontSize: '20px', marginBottom: '4px' }}>📤</span>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700' }}>
            {uploadedFile ? `تم إرفاق: ${uploadedFile}` : 'اضغط للرفع أو اسحب ملفاً'}
          </span>
        </label>
      </div>
    );
  }

  function renderActionButtons() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
        <button
          type="button"
          disabled={loading}
          onClick={handlePaymentSubmit}
          style={{
            background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>📤 إرسال الإثبات</span>
        </button>
        <button
          type="button"
          onClick={() => setView('methods')}
          style={{
            background: '#F1F5F9',
            color: '#475569',
            border: '1px solid #CBD5E1',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>الرجوع →</span>
        </button>
      </div>
    );
  }
}
