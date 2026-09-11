import React from 'react';

export default function RegistrySummaryStrip({
  summaryStats,
  selectedModule,
  statusFilter,
  onCardClick
}) {
  return (
    <div className="summary-strip">
      <div
        className={`summary-box clickable ${(selectedModule === 'الكل' && statusFilter === 'الكل') ? 'active-box' : ''}`}
        onClick={() => onCardClick && onCardClick('all')}
        title="عرض جميع السجلات"
      >
        <div className="label">إجمالي السجلات</div>
        <strong style={{ color: '#0D3C5C' }}>{summaryStats.total}</strong>
        <small>عبر جميع الوحدات والعمليات</small>
      </div>

      <div
        className={`summary-box clickable ${statusFilter === 'تحتاج متابعة' ? 'active-box' : ''}`}
        onClick={() => onCardClick && onCardClick('followUp')}
        title="عرض السجلات التي تحتاج متابعة"
      >
        <div className="label">تحتاج متابعة</div>
        <strong style={{ color: '#005D9C' }}>{summaryStats.followUp}</strong>
        <small>عالية الأولوية ومفتوحة</small>
      </div>

      <div
        className={`summary-box clickable ${selectedModule === 'استشارة' ? 'active-box' : ''}`}
        onClick={() => onCardClick && onCardClick('chats')}
        title="عرض الاستشارات والمحادثات"
      >
        <div className="label">محادثات نشطة</div>
        <strong style={{ color: '#0D3C5C' }}>{summaryStats.unreadChats}</strong>
        <small>جلسات واستشارات مباشرة</small>
      </div>

      <div
        className={`summary-box clickable ${selectedModule === 'فاتورة' ? 'active-box' : ''}`}
        onClick={() => onCardClick && onCardClick('payments')}
        title="عرض الفواتير والمدفوعات"
      >
        <div className="label">دفعات قيد المتابعة</div>
        <strong style={{ color: '#005D9C' }}>{summaryStats.pendingPaymentsCount}</strong>
        <small>بقيمة {summaryStats.pendingPaymentsAmount}</small>
      </div>

      <div
        className={`summary-box clickable ${selectedModule === 'أتمتة' ? 'active-box' : ''}`}
        onClick={() => onCardClick && onCardClick('ai')}
        title="عرض الأتمتة والذكاء الاصطناعي"
      >
        <div className="label">استخدام ذكي نشط</div>
        <strong style={{ color: '#0D3C5C' }}>{summaryStats.highAiAccounts}</strong>
        <small>قواعد الأتمتة والذكاء الاصطناعي</small>
      </div>
    </div>
  );
}
