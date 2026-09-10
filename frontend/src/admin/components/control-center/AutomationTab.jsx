import React, { useState, useEffect } from 'react';
import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  getAutomationRuleEffects
} from '../../services/adminApi';
import AutomationRuleModal from './AutomationRuleModal';

export default function AutomationTab() {
  const [rules, setRules] = useState([]);
  const [effects, setEffects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list' | 'kanban'
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchRulesAndEffects = async () => {
    setLoading(true);
    try {
      const [rulesData, effectsData] = await Promise.all([
        getAutomationRules(statusFilter, searchQuery),
        getAutomationRuleEffects(30)
      ]);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setEffects(Array.isArray(effectsData) ? effectsData : []);
    } catch (err) {
      console.error('Failed to load automation rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndEffects();
  }, [statusFilter, searchQuery]);

  const handleToggleStatus = async (rule) => {
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await updateAutomationRule(rule.id, { status: newStatus });
      fetchRulesAndEffects();
    } catch (err) {
      alert('فشل تغيير حالة القاعدة: ' + err.message);
    }
  };

  const handleDuplicate = async (rule) => {
    try {
      await createAutomationRule({
        name: `${rule.name} (نسخة)`,
        scope: rule.scope || 'تذاكر الدعم',
        trigger_event: rule.trigger_event || 'on_ticket_delay',
        condition_field: rule.condition_field || 'waiting_hours',
        condition_op: rule.condition_op || '>',
        condition_value: rule.condition_value || '2',
        action_type: rule.action_type || 'escalate_ticket',
        action_payload: rule.action_payload || {},
        status: 'active'
      });
      fetchRulesAndEffects();
    } catch (err) {
      alert('فشل نسخ القاعدة: ' + err.message);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('هل أنت تأكد من حذف هذه القاعدة؟')) return;
    try {
      await deleteAutomationRule(ruleId);
      fetchRulesAndEffects();
    } catch (err) {
      alert('فشل حذف القاعدة: ' + err.message);
    }
  };

  return (
    <div>
      {/* Controls & Toolbar Row */}
      <div className="cc-toolbar">
        <div className="cc-toolbar-right">
          <select
            className="cc-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشطة (Active)</option>
            <option value="paused">متوقفة (Paused)</option>
            <option value="needs_review">تحتاج مراجعة (Needs Review)</option>
          </select>
        </div>

        <div className="cc-toolbar-left">
          <input
            type="text"
            className="cc-input cc-search-input"
            placeholder="بحث باسم القاعدة أو الإجراء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="cc-view-toggle">
            <button
              className={`cc-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="قائمة"
              onClick={() => setViewMode('list')}
            >
              <svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>
            </button>
            <button
              className={`cc-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              title="بطاقات"
              onClick={() => setViewMode('cards')}
            >
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <button
              className={`cc-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              title="كانبان"
              onClick={() => setViewMode('kanban')}
            >
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="13" rx="1" /></svg>
            </button>
          </div>

          <button
            className="cc-btn-primary"
            onClick={() => { setEditingRule(null); setShowModal(true); }}
          >
            إنشاء قاعدة أتمتة جديدة
          </button>
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="cc-content-box">
          جاري تحميل قواعد الأتمتة ومحرك التشغيل...
        </div>
      ) : rules.length === 0 ? (
        <div className="cc-content-box">
          لا توجد قواعد أتمتة مطابقة لخيارات البحث.
        </div>
      ) : (
        <>
          {viewMode === 'cards' && (
            <div className="cc-cards-grid">
              {rules.map((rule) => (
                <div className="cc-rule-card" key={rule.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 800 }}>{rule.name}</h3>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        النطاق: {rule.scope || 'تذاكر الدعم'} · المعرف: {rule.id}
                      </div>
                    </div>
                    <span className={`cc-status ${rule.status === 'active' ? 'active' : rule.status === 'paused' ? 'pending' : 'rejected'}`}>
                      {rule.status === 'active' ? 'نشطة' : rule.status === 'paused' ? 'متوقفة' : 'تحتاج مراجعة'}
                    </span>
                  </div>

                  <div className="cc-rule-flow">
                    <div className="cc-flow-box">
                      <b>إذا (الشرط)</b>
                      {rule.condition_field || 'الانتظار'} {rule.condition_op || '>'} {rule.condition_value || 'ساعتين'}
                    </div>
                    <div className="cc-flow-arrow">←</div>
                    <div className="cc-flow-box">
                      <b>إذن (الإجراء)</b>
                      {rule.action_type || 'تصعيد التذكرة'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      التشغيل: <strong>{rule.run_count || 0} مرة</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="cc-btn-ghost" style={{ height: '30px', padding: '0 10px' }} onClick={() => handleDuplicate(rule)}>
                        نسخ
                      </button>
                      <button className="cc-btn-ghost" style={{ height: '30px', padding: '0 10px' }} onClick={() => { setEditingRule(rule); setShowModal(true); }}>
                        تعديل
                      </button>
                      <button className="cc-btn-primary" style={{ height: '30px', padding: '0 10px' }} onClick={() => handleToggleStatus(rule)}>
                        {rule.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>القاعدة</th>
                    <th>النطاق</th>
                    <th>الشرط</th>
                    <th>الإجراء</th>
                    <th>الحالة</th>
                    <th>التشغيل</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <strong className="cc-link" onClick={() => { setEditingRule(rule); setShowModal(true); }}>
                          {rule.name}
                        </strong>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {rule.id}</div>
                      </td>
                      <td>{rule.scope || 'تذاكر الدعم'}</td>
                      <td>{rule.condition_field} {rule.condition_op} {rule.condition_value}</td>
                      <td>{rule.action_type}</td>
                      <td>
                        <span className={`cc-status ${rule.status === 'active' ? 'active' : 'pending'}`}>
                          {rule.status === 'active' ? 'نشطة' : 'متوقفة'}
                        </span>
                      </td>
                      <td>{rule.run_count || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="cc-btn-ghost" style={{ height: '28px', fontSize: '11px' }} onClick={() => { setEditingRule(rule); setShowModal(true); }}>
                            تعديل
                          </button>
                          <button className="cc-btn-primary" style={{ height: '28px', fontSize: '11px' }} onClick={() => handleToggleStatus(rule)}>
                            {rule.status === 'active' ? 'إيقاف' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="cc-kanban-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {['نشطة', 'تحتاج مراجعة', 'متوقفة'].map((laneName) => {
                const laneRules = rules.filter((r) => {
                  if (laneName === 'نشطة') return r.status === 'active';
                  if (laneName === 'متوقفة') return r.status === 'paused';
                  return r.status === 'needs_review';
                });

                return (
                  <div key={laneName} className="cc-kanban-lane">
                    <div className="cc-lane-header">
                      <h4>{laneName}</h4>
                      <span className="cc-lane-count">{laneRules.length}</span>
                    </div>

                    {laneRules.map((rule) => (
                      <div className="cc-rule-card" key={rule.id}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 800 }}>{rule.name}</h4>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {rule.action_type}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Effect Audit Stream Panel */}
      <div style={{ marginTop: '32px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 800, color: '#0d3859' }}>
          سجل أثر تنفيذ القواعد المباشر (Automation Effect Stream)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {effects.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '12px' }}>لا توجد تأثيرات مسجلة مؤخراً.</div>
          ) : (
            effects.map((eff, index) => (
              <div key={eff.id || index} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderRight: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <div>
                  <strong>{eff.rule_name || eff.action_name || 'تطبيق أتمتة تلقائي'}</strong> — {eff.description || eff.details || JSON.stringify(eff.action_payload || {})}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {eff.created_at ? new Date(eff.created_at).toLocaleString('ar-JO') : 'الآن'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <AutomationRuleModal
          rule={editingRule}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchRulesAndEffects();
          }}
        />
      )}
    </div>
  );
}
