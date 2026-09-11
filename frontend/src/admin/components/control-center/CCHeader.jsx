import React from 'react';

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
        <div className="toolbar-right entries">
          <select
            id="entries"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setR360Page(1);
            }}
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
          </select>
          <span>سجل لكل صفحة</span>
        </div>

        <div className="toolbar-left">
          <button className="icon-btn primary" onClick={exportCurrent}>
            <svg viewBox="0 0 24 24">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <span className="tooltip">تصدير</span>
          </button>

          <button
            className="icon-btn"
            onClick={() => {
              fetchLiveDatabaseData();
              showToastMsg('تم تحديث البيانات من قاعدة البيانات');
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M20 11a8 8 0 1 0 2 5" />
              <path d="M20 4v7h-7" />
            </svg>
            <span className="tooltip">تحديث</span>
          </button>

          <input
            id="search"
            className="search"
            placeholder="بحث..."
            value={r360Search}
            onChange={(e) => {
              setR360Search(e.target.value);
              setR360Page(1);
            }}
          />
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
