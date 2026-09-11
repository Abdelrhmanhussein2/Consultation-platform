import React from 'react';
import { cls } from './utils/controlCenterHelpers';

export default function AutomationSection({
  activeTab,
  rules,
  ruleEffects,
  autoView,
  setAutoView,
  setEditingRule,
  setRuleForm,
  setRuleBuilderOpen,
  handleToggleRule,
  handleDeleteRule,
  handleDuplicateRule,
  showToastMsg
}) {
  if (activeTab !== 'automation') return null;

  return (
    <section className="section active">
      <div className="section-title">
        <h3>قواعد التشغيل والأتمتة</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="view-icon-group">
            <button
              type="button"
              className={`view-icon-btn ${autoView === 'list' ? 'active' : ''}`}
              onClick={() => setAutoView('list')}
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
              className={`view-icon-btn ${autoView === 'cards' ? 'active' : ''}`}
              onClick={() => setAutoView('cards')}
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
              className={`view-icon-btn ${autoView === 'kanban' ? 'active' : ''}`}
              onClick={() => setAutoView('kanban')}
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
            className="btn primary"
            onClick={() => {
              setEditingRule(null);
              setRuleForm({
                name: '',
                scope: 'تذاكر الدعم',
                condition: '',
                action: '',
                escalation: 'إرسال تنبيه'
              });
              setRuleBuilderOpen(true);
            }}
          >
            + إنشاء قاعدة
          </button>
        </div>
      </div>

      {/* Automation Cards View */}
      {autoView === 'cards' && (
        <div className="auto-cards">
          {rules.map((r) => (
            <div className={`rule-card-v11 ${r.status === 'متوقف' ? 'stop' : ''}`} key={r.id}>
              <div className="accent"></div>
              <div className="body">
                <div className="row">
                  <div>
                    <div className="rtitle">{r.name}</div>
                    <div className="rmeta">
                      {r.scope} · {r.id} · آخر تشغيل {r.last}
                    </div>
                  </div>
                  <span className={`status ${cls(r.status)}`}>{r.status}</span>
                </div>

                <div className="flow-v11">
                  <div className="flow-box-v11">
                    <b>إذا</b>
                    {r.condition}
                  </div>
                  <div className="arrow-v11">←</div>
                  <div className="flow-box-v11">
                    <b>إذن</b>
                    {r.action}
                  </div>
                </div>

                <div className="stats-v11">
                  <div className="stat-v11">
                    <span>مرات التشغيل</span>
                    <b>{r.runs}</b>
                  </div>
                  <div className="stat-v11">
                    <span>النجاح</span>
                    <b>{r.success}%</b>
                  </div>
                  <div className="stat-v11">
                    <span>الحالة</span>
                    <b>{r.status}</b>
                  </div>
                </div>
              </div>

              <div className="footer-v11">
                <span className="effect-v11">{r.effect}</span>
                <div className="actions-v11">
                  <button
                    title="تعديل"
                    onClick={() => {
                      setEditingRule(r);
                      setRuleForm({
                        name: r.name,
                        scope: r.scope,
                        condition: r.condition,
                        action: r.action,
                        escalation: 'إرسال تنبيه'
                      });
                      setRuleBuilderOpen(true);
                    }}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4 20h4l11-11-4-4L4 16z" />
                    </svg>
                  </button>
                  <button
                    title="عرض الأثر"
                    onClick={() => showToastMsg(`أثر القاعدة: ${r.effect}`)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button title="نسخ القاعدة" onClick={() => handleDuplicateRule(r)}>
                    <svg viewBox="0 0 24 24">
                      <rect x="8" y="8" width="10" height="10" rx="2" />
                      <path d="M6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                  <button
                    title={r.status === 'نشط' ? 'إيقاف التشغيل' : 'تفعيل التشغيل'}
                    onClick={() => handleToggleRule(r)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2v10" />
                      <path d="M6.2 5.7a8 8 0 1 0 11.6 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Automation List View */}
      {autoView === 'list' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>القاعدة</th>
                <th>النطاق</th>
                <th>الشرط والإجراء</th>
                <th>التشغيل</th>
                <th>نسبة النجاح</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="name">{r.name}</span>
                    <span className="sub">{r.id}</span>
                  </td>
                  <td>{r.scope}</td>
                  <td>
                    <small>
                      <b>إذا:</b> {r.condition} <b>← إذن:</b> {r.action}
                    </small>
                  </td>
                  <td>{r.runs} مرة</td>
                  <td>{r.success}%</td>
                  <td>
                    <span className={`status ${cls(r.status)}`}>{r.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="record-action"
                        onClick={() => {
                          setEditingRule(r);
                          setRuleForm({
                            name: r.name,
                            scope: r.scope,
                            condition: r.condition,
                            action: r.action,
                            escalation: 'إرسال تنبيه'
                          });
                          setRuleBuilderOpen(true);
                        }}
                      >
                        تعديل
                      </button>
                      <button
                        className="record-action"
                        onClick={() => handleToggleRule(r)}
                      >
                        {r.status === 'نشط' ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button
                        className="record-action"
                        style={{ color: '#ff3164' }}
                        onClick={() => handleDeleteRule(r)}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Automation Kanban View */}
      {autoView === 'kanban' && (
        <div className="auto-kanban">
          {['نشط', 'متوقف'].map((lane) => (
            <div className="auto-lane" key={lane}>
              <h4>
                {lane === 'نشط' ? 'قواعد نشطة' : 'قواعد متوقفة'} (
                {rules.filter((r) => (lane === 'نشط' ? r.status === 'نشط' : r.status !== 'نشط')).length}
                )
              </h4>
              {rules
                .filter((r) => (lane === 'نشط' ? r.status === 'نشط' : r.status !== 'نشط'))
                .map((r) => (
                  <div className="auto-card" key={r.id}>
                    <div className={`band ${lane === 'نشط' ? '' : 'stop'}`}></div>
                    <div className="auto-card-body">
                      <b>{r.name}</b>
                      <small style={{ display: 'block', color: '#89949f', margin: '4px 0' }}>
                        {r.scope} · {r.runs} تشغيل
                      </small>
                      <p style={{ fontSize: '10px', margin: 0 }}>{r.action}</p>
                    </div>
                    <div className="auto-card-footer">
                      <button
                        className="record-action"
                        onClick={() => handleToggleRule(r)}
                      >
                        {lane === 'نشط' ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <span className="effect-v11">{r.last}</span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* Direct Effects Panel */}
      <div className="panel" style={{ marginTop: '12px' }}>
        <div className="panel-head">
          <span>أثر القواعد المباشر</span>
          <span>اليوم</span>
        </div>
        <div className="panel-body">
          {ruleEffects.map((eff, i) => (
            <div
              className="effect"
              key={eff.id || i}
              onClick={() => showToastMsg('عرض تفاصيل الأثر')}
            >
              <b>{eff.rule_name || eff.action_type || 'تصعيد التذكرة المتأخرة'}</b>
              <p>{eff.details || eff.description || '142 تشغيل · 99.5% نجاح'}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
