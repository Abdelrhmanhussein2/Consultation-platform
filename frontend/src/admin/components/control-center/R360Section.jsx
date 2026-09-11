import React from 'react';
import { cls } from './utils/controlCenterHelpers';

export default function R360Section({
  activeTab,
  r360Type,
  setR360Type,
  r360Status,
  setR360Status,
  r360View,
  setR360View,
  r360Page,
  setR360Page,
  filteredR360,
  paginatedR360,
  totalPages,
  startIdx,
  entriesPerPage,
  open360
}) {
  if (activeTab !== 'r360') return null;

  return (
    <section className="section active">
      <div className="filters">
        <select
          id="entityType"
          className="filter-select"
          value={r360Type}
          onChange={(e) => {
            setR360Type(e.target.value);
            setR360Page(1);
          }}
        >
          <option value="الكل">كل السجلات</option>
          <option value="مستخدم">مستخدم</option>
          <option value="مستشار">مستشار</option>
          <option value="مدير منصة">مدير منصة</option>
          <option value="استشارة">استشارة</option>
        </select>

        <select
          id="entityStatus"
          className="filter-select"
          value={r360Status}
          onChange={(e) => {
            setR360Status(e.target.value);
            setR360Page(1);
          }}
        >
          <option value="الكل">كل الحالات</option>
          <option value="نشط">نشط</option>
          <option value="تحتاج متابعة">تحتاج متابعة</option>
          <option value="قيد التوثيق">قيد التوثيق</option>
          <option value="قيد التجديد">قيد التجديد</option>
          <option value="مؤكدة">مؤكدة</option>
          <option value="معلقة">معلقة</option>
        </select>

        <div className="view-switch">
          <button
            type="button"
            className={`icon-btn ${r360View === 'list' ? 'active' : 'light'}`}
            onClick={() => setR360View('list')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M8 6h12" />
              <path d="M8 12h12" />
              <path d="M8 18h12" />
              <circle cx="4" cy="6" r="1" />
              <circle cx="4" cy="12" r="1" />
              <circle cx="4" cy="18" r="1" />
            </svg>
            <span className="tooltip">قائمة</span>
          </button>
          <button
            type="button"
            className={`icon-btn ${r360View === 'cards' ? 'active' : 'light'}`}
            onClick={() => setR360View('cards')}
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="tooltip">بطاقات</span>
          </button>
          <button
            type="button"
            className={`icon-btn ${r360View === 'kanban' ? 'active' : 'light'}`}
            onClick={() => setR360View('kanban')}
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="5" height="16" rx="1" />
              <rect x="10" y="4" width="5" height="10" rx="1" />
              <rect x="17" y="4" width="4" height="13" rx="1" />
            </svg>
            <span className="tooltip">كانبان</span>
          </button>
        </div>
      </div>

      <div className="section-title">
        <h3>السجلات المترابطة 360°</h3>
        <span id="count360">{filteredR360.length} سجل</span>
      </div>

      {/* List View */}
      {r360View === 'list' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>السجل</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>الوصف</th>
                <th>الاستشارات</th>
                <th>التذاكر</th>
                <th>الاستخدام الذكي</th>
                <th>التقييم</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {paginatedR360.map((r) => (
                <tr key={`${r.type}-${r.id}`}>
                  <td>
                    <span className="name link" onClick={() => open360(r.type, r.id)}>
                      {r.title}
                    </span>
                    <span className="sub">{r.subtitle}</span>
                  </td>
                  <td>{r.type}</td>
                  <td>
                    <span className={`status ${cls(r.status)}`}>{r.status}</span>
                  </td>
                  <td>{r.desc}</td>
                  <td>{r.consultations}</td>
                  <td>{r.tickets}</td>
                  <td>{r.ai}</td>
                  <td>{r.rating}</td>
                  <td>
                    <button className="icon-btn slate" onClick={() => open360(r.type, r.id)}>
                      <svg viewBox="0 0 24 24">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="tooltip">فتح</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards View */}
      {r360View === 'cards' && (
        <div className="cards show">
          {paginatedR360.map((r) => (
            <div
              className="entity-card"
              key={`${r.type}-${r.id}`}
              onClick={() => open360(r.type, r.id)}
            >
              <div
                className={`entity-band ${
                  r.status === 'تحتاج متابعة' || r.status === 'قيد التوثيق'
                    ? 'danger'
                    : r.status === 'معلقة'
                    ? 'warn'
                    : ''
                }`}
              ></div>
              <div className="entity-main">
                <div className="entity-top">
                  <div style={{ display: 'flex', gap: '9px' }}>
                    <div className="avatar">{(r.title || 'U').slice(0, 2)}</div>
                    <div>
                      <div className="name">{r.title}</div>
                      <div className="sub">
                        {r.type} · {r.id}
                      </div>
                    </div>
                  </div>
                  <span className={`status ${cls(r.status)}`}>{r.status}</span>
                </div>

                <div className="entity-meta">
                  <div>
                    <span>الوصف</span>
                    <b>{r.desc}</b>
                  </div>
                  <div>
                    <span>الاستشارات</span>
                    <b>{r.consultations}</b>
                  </div>
                  <div>
                    <span>الاستخدام الذكي</span>
                    <b>{r.ai}</b>
                  </div>
                  <div>
                    <span>التقييم</span>
                    <b>{r.rating}</b>
                  </div>
                </div>
              </div>
              <div className="entity-footer">
                <span className="hint">اضغط للعرض · زر يمين للإجراءات</span>
                <div className="entity-actions">
                  <span className="entity-chip">360°</span>
                  <span className="link">فتح الملف</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban View */}
      {r360View === 'kanban' && (
        <div className="kanban show">
          {['نشط', 'تحتاج متابعة', 'أخرى'].map((lane) => {
            const laneItems = filteredR360.filter((r) => {
              if (lane === 'نشط') return r.status === 'نشط' || r.status === 'مؤكدة' || r.status === 'موثق';
              if (lane === 'تحتاج متابعة')
                return (
                  r.status === 'تحتاج متابعة' ||
                  r.status === 'قيد التوثيق' ||
                  r.status === 'قيد التجديد'
                );
              return (
                r.status !== 'نشط' &&
                r.status !== 'مؤكدة' &&
                r.status !== 'موثق' &&
                r.status !== 'تحتاج متابعة' &&
                r.status !== 'قيد التوثيق'
              );
            });

            return (
              <div className="lane" key={lane}>
                <h4>{lane}</h4>
                {laneItems.map((r) => (
                  <div
                    className="entity-card"
                    key={`${r.type}-${r.id}`}
                    onClick={() => open360(r.type, r.id)}
                    style={{ marginBottom: '8px' }}
                  >
                    <div className="entity-main">
                      <div className="entity-top">
                        <div className="name">{r.title}</div>
                        <span className={`status ${cls(r.status)}`}>{r.status}</span>
                      </div>
                      <div className="sub">{r.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer & Pagination */}
      <div className="footer">
        <div>
          عرض {startIdx + 1} إلى {Math.min(startIdx + entriesPerPage, filteredR360.length)} من أصل{' '}
          {filteredR360.length} سجل
        </div>
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${r360Page === i + 1 ? 'active' : ''}`}
              onClick={() => setR360Page(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
