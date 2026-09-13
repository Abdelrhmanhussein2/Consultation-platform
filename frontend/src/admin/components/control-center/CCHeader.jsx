import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';

export default function CCHeader({
  summaryCounts,
  activeTab,
  switchMain,
  showToastMsg,
  entriesPerPage,
  setEntriesPerPage,
  setR360Page,
  r360Search,
  setR360Search,
  exportCurrent,
  fetchLiveDatabaseData,
  onOpenAlertsModal
}) {
  return (
    <>
      {/* 1. Page Title & Breadcrumb */}
      <h1 className="title">مركز التحكم الإداري المتقدم</h1>
      <div className="breadcrumb">
        <span className="active">لوحة التحكم</span>
        <span>‹</span>
        <span>الإدارة المتقدمة</span>
        <span style={{ opacity: 0.55 }}>· V10</span>
      </div>

      {/* 2. Top Summary 5 Cards (Exact Prototype Layout) */}
      <div className="summary">
        <div className="sum" onClick={() => switchMain('r360')}>
          <span>السجلات المترابطة</span>
          <strong>{summaryCounts.r360Total}</strong>
          <small>{summaryCounts.r360Sub}</small>
        </div>
        <div className="sum" onClick={() => switchMain('automation')}>
          <span>قواعد التشغيل النشطة</span>
          <strong>{summaryCounts.activeRules}</strong>
          <small>{summaryCounts.stoppedRules} قواعد متوقفة</small>
        </div>
        <div className="sum" onClick={() => switchMain('ai')}>
          <span>أسئلة منخفضة الثقة</span>
          <strong>{summaryCounts.lowConfidenceQuestions ?? 0}</strong>
          <small>{summaryCounts.lowConfidenceSub || '0 عالية الأولوية'}</small>
        </div>
        <div className="sum" onClick={() => switchMain('credential')}>
          <span>اعتمادات المستشارين</span>
          <strong>{summaryCounts.pendingCreds}</strong>
          <small>{summaryCounts.credsSub}</small>
        </div>
        <div
          className="sum"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            if (onOpenAlertsModal) {
              onOpenAlertsModal();
            } else {
              showToastMsg(`التنبيهات التشغيلية الحية: ${summaryCounts.operationalAlerts}`);
            }
          }}
        >
          <span>تنبيهات تشغيلية</span>
          <strong>{summaryCounts.operationalAlerts}</strong>
          <small>{summaryCounts.alertsSub}</small>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-right entries" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ModernSelect
            style={{ width: '80px' }}
            value={entriesPerPage}
            onChange={(val) => {
              setEntriesPerPage(Number(val));
              setR360Page(1);
            }}
            options={[
              { value: 10, label: '10' },
              { value: 15, label: '15' },
              { value: 25, label: '25' }
            ]}
          />
          <span>سجل لكل صفحة</span>
        </div>

        <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          {/* Search Input with embedded icon */}
          <div style={{ position: 'relative', width: '220px' }}>
            <svg
              style={{
                position: 'absolute',
                right: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="search"
              type="text"
              className="search"
              placeholder="بحث في السجلات..."
              value={r360Search}
              onChange={(e) => {
                setR360Search(e.target.value);
                setR360Page(1);
              }}
              style={{
                width: '100%',
                height: '38px',
                paddingRight: '34px',
                paddingLeft: '12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                fontSize: '12px',
                color: '#0F172A',
                outline: 'none',
                transition: 'all 0.18s ease'
              }}
            />
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={() => {
              fetchLiveDatabaseData();
              showToastMsg('تم تحديث البيانات من قاعدة البيانات');
            }}
            title="تحديث البيانات الحية"
            aria-label="تحديث البيانات"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#005D9C',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F0F7FD';
              e.currentTarget.style.borderColor = '#BAE6FD';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11a8 8 0 1 0 2 5" />
              <path d="M20 4v7h-7" />
            </svg>
          </button>

          {/* Reset Search Button */}
          {r360Search && (
            <FilterResetButton
              onClick={() => {
                setR360Search('');
                setR360Page(1);
              }}
              size={38}
              title="إعادة ضبط البحث"
            />
          )}

          {/* Export Action Button */}
          <button
            type="button"
            onClick={exportCurrent}
            title="تصدير البيانات إلى CSV"
            aria-label="تصدير البيانات"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#005D9C',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F0F7FD';
              e.currentTarget.style.borderColor = '#BAE6FD';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="tabs" id="mainTabs">
        <button
          className={`tab ${activeTab === 'r360' ? 'active' : ''}`}
          onClick={() => switchMain('r360')}
        >
          العلاقات 360°
        </button>
        <button
          className={`tab ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => switchMain('automation')}
        >
          الأتمتة وتوقعات التشغيل
        </button>
        <button
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => switchMain('ai')}
        >
          تحكم الذكاء الاصطناعي
        </button>
        <button
          className={`tab ${activeTab === 'credential' ? 'active' : ''}`}
          onClick={() => switchMain('credential')}
        >
          إدارة المستشارين
        </button>
      </div>
    </>
  );
}
