import React from 'react';

export default function RegistryCardView({
  pageData,
  loading,
  statusesState,
  getStatusCls,
  getInitials,
  openRecord,
  quickChat,
  quickAction
}) {
  return (
    <div className="cards-grid">
      {pageData.length > 0 ? (
        pageData.map((r) => {
          const curStatus = statusesState[r.id] || r.status;
          return (
            <div className="record-card" key={r.id} onClick={() => openRecord(r)}>
              <div className="rc-top">
                <div className="rc-person">
                  <div className="rc-avatar">{getInitials(r.title)}</div>
                  <div>
                    <div className="rc-title">{r.title}</div>
                    <div className="rc-sub">{r.type} · {r.sub}</div>
                  </div>
                </div>
                <span className={`status ${getStatusCls(curStatus)}`}>
                  {curStatus}
                </span>
              </div>

              <div className="rc-meta">
                <div>صاحب العلاقة<b>{r.owner}</b></div>
                <div>المرجع<b dir="ltr">{r.ref}</b></div>
                <div>آخر نشاط<b>{r.last}</b></div>
                <div>الأولوية<b>{r.priority}</b></div>
              </div>

              <div className="rc-bottom">
                <span className="rc-sub" dir="ltr">{r.date}</span>
                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="icon-btn light small" title="المحادثات" onClick={() => quickChat(r)}>
                    <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
                  </button>
                  <button className="icon-btn light small" title="تغيير الحالة" onClick={() => quickAction(r)}>
                    <svg viewBox="0 0 24 24"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
          {loading ? 'جاري تحميل السجلات من قاعدة البيانات...' : 'لا توجد سجلات مطابقة'}
        </div>
      )}
    </div>
  );
}
