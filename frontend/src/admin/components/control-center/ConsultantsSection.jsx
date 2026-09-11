import React from 'react';
import { cls } from './utils/controlCenterHelpers';

export default function ConsultantsSection({
  activeTab,
  consultants,
  credView,
  setCredView,
  open360,
  handleCredDrop,
  showToastMsg,
  onAddCredentialRequest
}) {
  if (activeTab !== 'credential') return null;

  return (
    <section className="section active">
      <div className="section-title">
        <h3>إدارة المستشارين</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="view-icon-group">
            <button
              type="button"
              className={`view-icon-btn ${credView === 'list' ? 'active' : ''}`}
              onClick={() => setCredView('list')}
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
              className={`view-icon-btn ${credView === 'cards' ? 'active' : ''}`}
              onClick={() => setCredView('cards')}
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
              className={`view-icon-btn ${credView === 'kanban' ? 'active' : ''}`}
              onClick={() => setCredView('kanban')}
            >
              <svg viewBox="0 0 24 24">
                <rect x="3" y="4" width="5" height="16" rx="1" />
                <rect x="10" y="4" width="5" height="10" rx="1" />
                <rect x="17" y="4" width="4" height="13" rx="1" />
              </svg>
              <span className="tooltip">كانبان</span>
            </button>
          </div>

          <button
            type="button"
            className="btn green"
            onClick={() => {
              if (onAddCredentialRequest) {
                onAddCredentialRequest();
              } else {
                showToastMsg('فتح نموذج طلب اعتماد جديد');
              }
            }}
          >
            + طلب اعتماد جديد
          </button>
        </div>
      </div>

      {/* Consultants List View */}
      {credView === 'list' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>المستشار</th>
                <th>الرقم الضريبي / الترخيص</th>
                <th>التخصصات</th>
                <th>الخبرة</th>
                <th>الاستشارات</th>
                <th>التقييم</th>
                <th>حالة التوثيق</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {consultants.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="name link" onClick={() => open360('مستشار', c.id, 'نظرة عامة')}>
                      {c.name}
                    </span>
                    <span className="sub">{c.degree || c.id}</span>
                  </td>
                  <td>{c.license || c.taxNo || '—'}</td>
                  <td>{c.specialties?.join('، ') || '—'}</td>
                  <td>{c.years} سنة</td>
                  <td>{c.consultations}</td>
                  <td>{c.rating} من 5</td>
                  <td>
                    <span className={`status ${cls(c.verification)}`}>{c.verification}</span>
                  </td>
                  <td>
                    <button
                      className="icon-btn slate"
                      onClick={() => open360('مستشار', c.id, 'نظرة عامة')}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="tooltip">عرض الملف</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Credential Cards View */}
      {credView === 'cards' && (
        <div className="consultants-grid-v9">
          {consultants.map((c) => (
            <div
              className={`consultant-card-v11 ${
                c.verification === 'قيد التجديد'
                  ? 'renew'
                  : c.verification === 'قيد التوثيق'
                  ? 'verify'
                  : ''
              }`}
              key={c.id}
              onClick={() => open360('مستشار', c.id, 'نظرة عامة')}
            >
              <div className="accent"></div>
              <div className="body">
                <div className="top">
                  <div className="avatar">{c.photo}</div>
                  <div>
                    <div className="name">{c.name}</div>
                    <div className="headline">
                      {c.degree || 'مستشار ضريبي'}
                      <br />
                      {c.id} · {(c.countries || ['الأردن']).join('، ')}
                    </div>
                    <div className="rating-line">
                      <span className="stars">★★★★★</span>
                      <span className="rating-number">{c.rating} من 5</span>
                    </div>
                  </div>
                  <span className={`status ${cls(c.verification)}`}>{c.verification}</span>
                </div>

                <div className="skills">
                  {(c.specialties || ['استشارات ضريبية']).map((s) => (
                    <span className="skill" key={s}>
                      {s}
                    </span>
                  ))}
                </div>

                <div className="summary">
                  <div className="summary-box">
                    <span>الخبرة</span>
                    <b>{c.years} سنة</b>
                  </div>
                  <div className="summary-box">
                    <span>الاستشارات</span>
                    <b>{c.consultations}</b>
                  </div>
                  <div className="summary-box">
                    <span>الوثائق</span>
                    <b>{c.documents}</b>
                  </div>
                </div>
              </div>

              <div className="footer">
                <span className="expiry">الاعتماد حتى: {c.expiry || '14-02-2027'}</span>
                <div className="actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      open360('مستشار', c.id, 'نظرة عامة');
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4h10l6 6v10H4z" />
                      <path d="M14 4v6h6" />
                    </svg>
                    <span className="tooltip">فتح الملف</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open360('مستشار', c.id, 'المحادثات');
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4 5h16v11H8l-4 4z" />
                    </svg>
                    <span className="tooltip">مراسلة</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open360('مستشار', c.id, 'التقييمات');
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2 7.5 14 3 9.6l6.2-.9z" />
                    </svg>
                    <span className="tooltip">التقييمات</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credential Kanban View (4 LANES WITH DRAG & DROP) */}
      {credView === 'kanban' && (
        <div className="credential-kanban-v15">
          {['قيد التوثيق', 'موثق', 'مرفوض', 'قيد التجديد'].map((lane) => {
            const laneConsultants = consultants.filter((c) => c.verification === lane);

            return (
              <div
                className={`cred-lane ${lane === 'مرفوض' ? 'rejected-lane' : ''}`}
                key={lane}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleCredDrop(e, lane)}
              >
                <div className="lane-header-v15">
                  <h4>{lane}</h4>
                  <span className="lane-count-v15">{laneConsultants.length}</span>
                </div>

                {laneConsultants.map((c) => (
                  <div
                    className={`consultant-card-v11 ${
                      c.verification === 'قيد التجديد'
                        ? 'renew'
                        : c.verification === 'قيد التوثيق'
                        ? 'verify'
                        : ''
                    }`}
                    key={c.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                    onClick={() => open360('مستشار', c.id, 'نظرة عامة')}
                    style={{ marginBottom: '10px' }}
                  >
                    <div className="accent"></div>
                    <div className="body">
                      <div className="top">
                        <div className="avatar" style={{ width: '48px', height: '48px' }}>
                          {c.photo}
                        </div>
                        <div>
                          <div className="name">{c.name}</div>
                          <div className="headline">
                            {c.id} · {c.specialties?.[0] || 'استشارات عامة'}
                          </div>
                        </div>
                        <span className={`status ${cls(c.verification)}`}>{c.verification}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
