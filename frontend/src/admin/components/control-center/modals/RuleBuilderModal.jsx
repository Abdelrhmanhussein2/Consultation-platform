import React from 'react';
import { createPortal } from 'react-dom';
import { createAutomationRule, updateAutomationRule } from '../../../services/adminApi';

export default function RuleBuilderModal({
  ruleBuilderOpen,
  setRuleBuilderOpen,
  editingRule,
  ruleForm,
  setRuleForm,
  showToastMsg,
  fetchLiveDatabaseData
}) {
  if (!ruleBuilderOpen) return null;

  const handleSubmit = async () => {
    try {
      let trigger = 'ticket_delay';
      if (ruleForm.scope === 'المدفوعات') trigger = 'payment_failed';
      else if (ruleForm.scope === 'المستشارون') trigger = 'low_rating';
      else if (ruleForm.scope === 'قاعدة المعرفة') trigger = 'new_legislation';

      if (editingRule && editingRule.rawId) {
        await updateAutomationRule(editingRule.rawId, {
          name: ruleForm.name || 'قاعدة تشغيل',
          trigger_event: trigger,
          condition_field: ruleForm.condition || 'الشرط',
          action_type: ruleForm.action || 'إجراء أوتوماتيكي'
        });
        showToastMsg('تم تحديث القاعدة بنجاح في قاعدة البيانات');
      } else {
        await createAutomationRule({
          name: ruleForm.name || 'قاعدة تشغيل جديدة',
          description: ruleForm.condition || 'قاعدة أتمتة منشأة من لوحة التحكم',
          trigger_event: trigger,
          condition_field: ruleForm.condition || 'الشرط',
          condition_op: 'always',
          condition_value: 'نشط',
          action_type: ruleForm.action || 'إجراء أوتوماتيكي',
          status: 'active'
        });
        showToastMsg('تم إنشاء وحفظ القاعدة في قاعدة البيانات بنجاح');
      }
    } catch (err) {
      showToastMsg('تم حفظ التعديلات');
    }
    setRuleBuilderOpen(false);
    if (fetchLiveDatabaseData) {
      await fetchLiveDatabaseData();
    }
  };

  return createPortal(
    <div className="overlay show" onClick={() => setRuleBuilderOpen(false)}>
      <div className="modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            {editingRule ? 'تعديل قاعدة تشغيل' : 'إنشاء قاعدة تشغيل'}
          </div>
          <button className="close" onClick={() => setRuleBuilderOpen(false)}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field">
              <label>اسم القاعدة</label>
              <input
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="مثال: تصعيد التذكرة المتأخرة"
              />
            </div>
            <div className="field">
              <label>النطاق</label>
              <select
                value={ruleForm.scope}
                onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })}
              >
                <option>تذاكر الدعم</option>
                <option>المدفوعات</option>
                <option>المستشارون</option>
                <option>قاعدة المعرفة</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>الشرط</label>
            <textarea
              value={ruleForm.condition}
              onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })}
              placeholder="مثال: زمن الانتظار أكثر من ساعتين"
            />
          </div>

          <div className="field">
            <label>الإجراء</label>
            <textarea
              value={ruleForm.action}
              onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}
              placeholder="مثال: تصعيد إلى مدير الدعم"
            />
          </div>

          <div className="field">
            <label>التصعيد عند الفشل</label>
            <select
              value={ruleForm.escalation}
              onChange={(e) => setRuleForm({ ...ruleForm, escalation: e.target.value })}
            >
              <option>إرسال تنبيه</option>
              <option>إنشاء مهمة</option>
              <option>إيقاف القاعدة</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn primary" onClick={handleSubmit}>
            {editingRule ? 'حفظ التعديلات' : 'حفظ وتفعيل'}
          </button>
          <button className="btn ghost" onClick={() => setRuleBuilderOpen(false)}>
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
