import React from 'react';

export default function RegistryTable({
  pageData,
  loading,
  statusesState,
  getStatusCls,
  renderPriority,
  openRecord,
  quickChat,
  quickAction
}) {
  return (
    <div className="table-wrap">
      <table>
        <colgroup>
          <col style={{ width: '22%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '6%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>السجل</th>
            <th>النوع</th>
            <th>التاريخ</th>
            <th>صاحب العلاقة</th>
            <th>المرجع</th>
            <th>الحالة</th>
            <th>الأولوية</th>
            <th>آخر نشاط</th>
            <th style={{ textAlign: 'center' }}>إجراء</th>
          </tr>
        </thead>
        <tbody>
          {pageData.length > 0 ? (
            pageData.map((r) => {
              const curStatus = statusesState[r.id] || r.status;
              return (
                <tr key={r.id}>
                  <td title={`${r.title} - ${r.sub}`}>
                    <span className="record-name">{r.title}</span>
                    <span className="record-sub">{r.sub}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#334155' }}>
                      {r.type}
                    </span>
                  </td>
                  <td>
                    <span dir="ltr" style={{ fontSize: '10.5px' }}>{r.date}</span>
                  </td>
                  <td title={r.owner}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.owner}
                    </span>
                  </td>
                  <td>
                    <span dir="ltr" style={{ fontWeight: 700, color: '#005D9C', fontSize: '10.5px' }}>{r.ref}</span>
                  </td>
                  <td>
                    <span className={`status ${getStatusCls(curStatus)}`}>
                      {curStatus}
                    </span>
                  </td>
                  <td>{renderPriority(r.priority)}</td>
                  <td title={r.last}>
                    <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.last}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-set" style={{ justifyContent: 'center' }}>
                      <button
                        className="icon-btn light small"
                        title="فتح السجل"
                        onClick={() => openRecord(r)}
                      >
                        <svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                      <button
                        className="icon-btn light small"
                        title="المحادثات"
                        onClick={() => quickChat(r)}
                      >
                        <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
                      </button>
                      <button
                        className="icon-btn light small"
                        title="تغيير الحالة"
                        onClick={() => quickAction(r)}
                      >
                        <svg viewBox="0 0 24 24"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                {loading ? 'جاري تحميل السجلات من قاعدة البيانات...' : 'لا توجد سجلات مطابقة لمعايير البحث الحالية'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
