import React, { useState, useEffect } from 'react';
import { getAutomationRules, updateAutomationRule, deleteAutomationRule, getAutomationRuleEffects } from '../../services/adminApi';
import AutomationRuleModal from './AutomationRuleModal';

export default function AutomationTab() {
  const [rules, setRules] = useState([]);
  const [effects, setEffects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchRulesAndEffects = async () => {
    setLoading(true);
    try {
      const [rulesData, effectsData] = await Promise.all([
        getAutomationRules(statusFilter, searchQuery),
        getAutomationRuleEffects(20)
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
      {/* Top Action & Filter Bar */}
      <div className="cc-section-header">
        <div className="cc-filters">
          <input
            type="text"
            className="cc-input"
            placeholder="بحث بالاسم أو حدث التشغيل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="cc-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط (Active)</option>
            <option value="paused">متوقف (Paused)</option>
            <option value="needs_review">تحتاج مراجعة (Needs Review)</option>
          </select>
        </div>

        <button
          className="cc-btn-primary"
          onClick={() => { setEditingRule(null); setShowModal(true); }}
        >
          <span>➕</span> إنشاء قاعدة أتمتة جديدة
        </button>
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>جاري تحميل قواعد الأتمتة...</div>
      ) : rules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          لا توجد قواعد أتمتة مطابقة للفلتر الحالى.
        </div>
      ) : (
        <div className="cc-rules-grid">
          {rules.map((rule) => (
            <div className="cc-rule-card" key={rule.id}>
              <div>
                <div className="cc-rule-card-header">
                  <h3 className="cc-rule-title">{rule.name}</h3>
                  <span className={`cc-status-badge ${rule.status}`}>
                    {rule.status === 'active' ? 'نشط' : rule.status === 'paused' ? 'متوقف' : 'تحتاج مراجعة'}
                  </span>
                </div>
                <div className="cc-rule-trigger">
                  ⚡ Event: <strong>{rule.trigger_event}</strong>
                </div>

                <div className="cc-rule-body">
                  <div className="cc-rule-row">
                    <span className="label">الشرط:</span>
                    <span className="val">{rule.condition_field} {rule.condition_op} {rule.condition_value}</span>
                  </div>
                  <div className="cc-rule-row">
                    <span className="label">الإجراء:</span>
                    <span className="val">{rule.action_type}</span>
                  </div>
                  <div className="cc-rule-row">
                    <span className="label">مرات التشغيل:</span>
                    <span className="val">{rule.run_count || 0} مرة</span>
                  </div>
                </div>
              </div>

              <div className="cc-rule-actions">
                <button
                  className={`cc-btn-toggle ${rule.status === 'active' ? 'pause' : 'activate'}`}
                  onClick={() => handleToggleStatus(rule)}
                >
                  {rule.status === 'active' ? 'إيقاف مؤقت' : 'تفعيل'}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{ background: '#F1F5F9', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                    onClick={() => { setEditingRule(rule); setShowModal(true); }}
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                    onClick={() => handleDelete(rule.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit & Effect Stream */}
      <div style={{ marginTop: '36px' }}>
        <h3 className="cc-section-title" style={{ marginBottom: '16px' }}>
          📜 سجل أفعال وتأثيرات الأتمتة الأخيرة (Automation Effect Stream)
        </h3>
        <div className="cc-log-list">
          {effects.length === 0 ? (
            <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: '12px', color: '#64748B', fontSize: '13px' }}>
              لا توجد أفعال تشغيل حديثة مسجلة.
            </div>
          ) : (
            effects.map((eff, index) => (
              <div className="cc-log-item success" key={eff.id || index}>
                <div>
                  <strong>{eff.action_name || eff.rule_name || 'تطبيق قاعدة أتمتة'}</strong> — {eff.description || eff.details || JSON.stringify(eff.action_payload || {})}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  {eff.created_at ? new Date(eff.created_at).toLocaleString('ar-EG') : 'الآن'}
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
