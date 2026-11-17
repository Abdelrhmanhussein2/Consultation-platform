import React, { useState, useEffect } from 'react';
import { IconBroadcast, IconClose } from './KnowledgeIcons';
import ModernSelect from '../../../components/ModernSelect';
import { LEGAL_FORM_OPTIONS, SECTOR_OPTIONS, CONSULTANT_ACTIVITY_OPTIONS, CONSULTANT_SPECIALIZATION_OPTIONS } from '../notifications/broadcastConstants';
import { previewKnowledgeBroadcast, sendKnowledgeBroadcast } from './knowledgeApi';

const DEFAULT_USER_FILTERS = { legal_form: 'all', sector: 'all' };
const DEFAULT_CONSULTANT_FILTERS = { activity: 'all', specialization: 'all' };
const TARGET_TABS = [{ id: 'all', label: 'كافة المنصة' }, { id: 'users', label: 'المستخدمين والشركات' }, { id: 'consultants', label: 'المستشارين فقط' }];

const IconReset = () => (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
  </svg>
);

export default function KnowledgeBroadcastModal({ isOpen, source, onClose, onNotify }) {
  const isJudgment = source?.source_type === 'judgment' || source?.kind === 'precedent';
  const [mode, setMode] = useState('add');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState('all');
  const [userFilters, setUserFilters] = useState(DEFAULT_USER_FILTERS);
  const [consultantFilters, setConsultantFilters] = useState(DEFAULT_CONSULTANT_FILTERS);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewCount, setPreviewCount] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const buildPreset = (nextMode, src) => ({
    t: nextMode === 'edit' ? `تعديل في ${isJudgment ? 'حكم قضائي' : 'قانون'}` : `إضافة ${isJudgment ? 'حكم قضائي' : 'قانون'} جديد`,
    m: `تم ${nextMode === 'edit' ? 'إجراء تعديل' : 'إضافة'} في ${isJudgment ? 'حكم قضائي' : 'قانون'}: ${src?.title || ''}`
  });

  useEffect(() => {
    if (isOpen && source) {
      setMode('add');
      const p = buildPreset('add', source);
      setTitle(p.t); setMessage(p.m); setTargetGroup('all');
      setUserFilters(DEFAULT_USER_FILTERS); setConsultantFilters(DEFAULT_CONSULTANT_FILTERS); setErrorMsg('');
    }
  }, [isOpen, source]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    setPreviewLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await previewKnowledgeBroadcast({ targetGroup, userFilters, consultantFilters });
        if (!isCancelled) setPreviewCount(res.matching_count ?? 0);
      } catch {
        if (!isCancelled) setPreviewCount(null);
      } finally {
        if (!isCancelled) setPreviewLoading(false);
      }
    }, 200);
    return () => { isCancelled = true; clearTimeout(timer); };
  }, [isOpen, targetGroup, userFilters, consultantFilters]);

  if (!isOpen || !source) return null;

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode);
    const p = buildPreset(nextMode, source);
    setTitle(p.t); setMessage(p.m);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !title.trim()) return setErrorMsg('يرجى كتابة عنوان الإشعار ونص الرسالة');
    if (previewCount === 0) return setErrorMsg('لا يوجد أي مستخدم أو مستشار يطابق الفئات والفلاتر المحددة');
    setSending(true); setErrorMsg('');
    try {
      const res = await sendKnowledgeBroadcast({
        title, message, targetGroup, userFilters, consultantFilters,
        sourceId: source?.id || source?.law_id, sourceTitle: source?.title
      });
      if (res.ok) {
        const d = await res.json();
        onNotify(`تم إرسال التنبيه إلى ${d.sent_count ?? 0} مستلم بنجاح`);
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail || `فشل إرسال التنبيه (${res.status})`);
      }
    } catch {
      setErrorMsg('خطأ في الاتصال أثناء إرسال التنبيه');
    } finally {
      setSending(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13,60,92,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', direction: 'rtl' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', maxWidth: '540px', width: '100%', border: '1px solid #E2E8F0', boxShadow: '0 24px 60px rgba(13,60,92,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconBroadcast className="size-5 text-[#E58A13]" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0D3C5C' }}>إرسال تنبيه للمتأثرين</h2>
          </div>
          <button type="button" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><IconClose className="size-4" /></button>
        </div>

        {errorMsg && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '9px 12px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '12px' }}>{errorMsg}</div>}
        <div style={{ fontSize: '12px', color: '#0D3C5C', fontWeight: 700, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px' }}>{source.title}</div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {[['add', 'إضافة جديدة'], ['edit', 'تعديل في القانون']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => handleModeSwitch(key)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${mode === key ? '#0D3C5C' : '#E2E8F0'}`, background: mode === key ? '#0D3C5C' : '#F8FAFC', color: mode === key ? '#FFFFFF' : '#64748B', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>عنوان الإشعار</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="knowledge-input" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '4px' }}>مضمون الرسالة</label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="knowledge-textarea" style={{ minHeight: '75px' }} required />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0D3C5C', marginBottom: '6px' }}>الجمهور المستهدف</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {TARGET_TABS.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setTargetGroup(tab.id)} style={{ padding: '7px 4px', borderRadius: '8px', border: `1px solid ${targetGroup === tab.id ? '#0D3C5C' : '#E2E8F0'}`, background: targetGroup === tab.id ? '#0D3C5C' : '#FFFFFF', color: targetGroup === tab.id ? '#FFFFFF' : '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{tab.label}</button>
              ))}
            </div>
          </div>

          {targetGroup === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D3C5C' }}>فلاتر تخصيص المستخدمين والشركات</span>
                <button type="button" onClick={() => setUserFilters(DEFAULT_USER_FILTERS)} title="إعادة تعيين الفلاتر" style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}><IconReset /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>الشكل القانوني</label>
                  <ModernSelect options={LEGAL_FORM_OPTIONS} value={userFilters.legal_form} onChange={(val) => setUserFilters((p) => ({ ...p, legal_form: val }))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>نشاط المنشأة</label>
                  <ModernSelect options={SECTOR_OPTIONS} value={userFilters.sector} onChange={(val) => setUserFilters((p) => ({ ...p, sector: val }))} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {targetGroup === 'consultants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0D3C5C' }}>فلاتر تخصيص المستشارين</span>
                <button type="button" onClick={() => setConsultantFilters(DEFAULT_CONSULTANT_FILTERS)} title="إعادة تعيين الفلاتر" style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}><IconReset /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>نوع النشاط المهني</label>
                  <ModernSelect options={CONSULTANT_ACTIVITY_OPTIONS} value={consultantFilters.activity} onChange={(val) => setConsultantFilters((p) => ({ ...p, activity: val }))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>التخصص الرئيسي</label>
                  <ModernSelect options={CONSULTANT_SPECIALIZATION_OPTIONS} value={consultantFilters.specialization} onChange={(val) => setConsultantFilters((p) => ({ ...p, specialization: val }))} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {targetGroup === 'all' && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700 }}>
              سيتم إرسال هذا الإشعار لكافة حسابات المنصة المفعلة (مستخدمين، شركات، ومستشارين).
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: previewCount === 0 ? '#FEF2F2' : '#F1F5F9', borderRadius: '8px', border: `1px solid ${previewCount === 0 ? '#FECACA' : '#E2E8F0'}`, fontSize: '12px', fontWeight: 700, color: previewCount === 0 ? '#DC2626' : '#0D3C5C' }}>
            <span>{previewLoading ? 'جاري حساب عدد المستلمين...' : previewCount !== null ? (previewCount > 0 ? `سيصل إلى ${previewCount} مستلم` : 'لا يوجد مستلمون مطابقون (0 مستلم)') : 'معاينة المستلمين...'}</span>
            {previewCount !== null && !previewLoading && <span style={{ background: previewCount === 0 ? '#FEE2E2' : '#E2E8F0', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>{previewCount}</span>}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
            <button type="submit" disabled={sending || previewLoading || previewCount === 0} className="btn-primary-action" style={{ flex: 1, justifyContent: 'center', opacity: previewCount === 0 ? 0.6 : 1, cursor: previewCount === 0 ? 'not-allowed' : 'pointer' }}>
              <IconBroadcast className="size-4" />
              <span>{sending ? 'جاري الإرسال...' : previewCount === 0 ? 'لا يمكن الإرسال (0)' : 'إرسال الإشعار'}</span>
            </button>
            <button type="button" onClick={onClose} disabled={sending} className="btn-secondary-action">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
