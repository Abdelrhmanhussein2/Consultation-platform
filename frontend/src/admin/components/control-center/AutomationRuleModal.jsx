import React, { useState, useEffect } from 'react';
import { createAutomationRule, updateAutomationRule } from '../../services/adminApi';
import ModernSelect from '../../../components/ModernSelect';

export default function AutomationRuleModal({ rule, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    trigger_event: 'rating_submitted',
    condition_field: 'rating',
    condition_op: 'lte',
    condition_value: '2',
    action_type: 'notify_admin',
    message: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        trigger_event: rule.trigger_event || 'rating_submitted',
        condition_field: rule.condition_field || 'rating',
        condition_op: rule.condition_op || 'lte',
        condition_value: rule.condition_value || '',
        action_type: rule.action_type || 'notify_admin',
        message: rule.action_config?.message || '',
        status: rule.status || 'active'
      });
    }
  }, [rule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name: formData.name,
      trigger_event: formData.trigger_event,
      condition_field: formData.condition_field,
      condition_op: formData.condition_op,
      condition_value: formData.condition_value,
      action_type: formData.action_type,
      action_config: { message: formData.message },
      status: formData.status
    };

    try {
      if (rule && rule.id) {
        await updateAutomationRule(rule.id, payload);
      } else {
        await createAutomationRule(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حفظ قاعدة الأتمتة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cc-modal-overlay">
      <div className="cc-modal-content">
        <div className="cc-modal-header">
          <h2>{rule ? 'تعديل قاعدة الأتمتة' : 'إنشاء قاعدة أتمتة جديدة ⚙️'}</h2>
          <button className="cc-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="cc-modal-body">
          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="cc-form-group">
            <label>اسم القاعدة (الوصف التعريفى)</label>
            <input
              type="text"
              className="cc-input"
              style={{ width: '100%' }}
              placeholder="مثال: تنبيه الإدارة عند تقييم أقل من أو يساوي 2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="cc-form-row">
            <div className="cc-form-group">
              <label>حدث التشغيل (Trigger Event)</label>
              <ModernSelect
                style={{ width: '100%' }}
                value={formData.trigger_event}
                onChange={(val) => setFormData({ ...formData, trigger_event: val })}
                options={[
                  { value: 'rating_submitted', label: 'إضافة تقييم جلسة (rating_submitted)' },
                  { value: 'appointment_cancelled', label: 'إلغاء موعد (appointment_cancelled)' },
                  { value: 'ticket_escalated', label: 'تصعيد تذكرة (ticket_escalated)' },
                  { value: 'consultant_registered', label: 'تسجيل مستشار جديد (consultant_registered)' },
                  { value: 'payout_requested', label: 'طلب سحب رصيد (payout_requested)' }
                ]}
              />
            </div>

            <div className="cc-form-group">
              <label>حقل الشرط (Condition Field)</label>
              <ModernSelect
                style={{ width: '100%' }}
                value={formData.condition_field}
                onChange={(val) => setFormData({ ...formData, condition_field: val })}
                options={[
                  { value: 'rating', label: 'درجة التقييم (rating)' },
                  { value: 'amount', label: 'المبلغ / القيمة (amount)' },
                  { value: 'cancellation_count', label: 'عدد الإلغاءات (cancellation_count)' },
                  { value: 'status', label: 'الحالة (status)' }
                ]}
              />
            </div>
          </div>

          <div className="cc-form-row">
            <div className="cc-form-group">
              <label>المعامل الشرطي (Operator)</label>
              <ModernSelect
                style={{ width: '100%' }}
                value={formData.condition_op}
                onChange={(val) => setFormData({ ...formData, condition_op: val })}
                options={[
                  { value: 'lte', label: 'أقل من أو يساوي (≤)' },
                  { value: 'gte', label: 'أكبر من أو يساوي (≥)' },
                  { value: 'eq', label: 'يساوي (=)' },
                  { value: 'contains', label: 'يحتوي على (contains)' },
                  { value: 'always', label: 'دائماً بدون شرط (always)' }
                ]}
              />
            </div>

            <div className="cc-form-group">
              <label>القيمة المقارنة (Condition Value)</label>
              <input
                type="text"
                className="cc-input"
                style={{ width: '100%' }}
                placeholder="2"
                value={formData.condition_value}
                onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
              />
            </div>
          </div>

          <div className="cc-form-row">
            <div className="cc-form-group">
              <label>الإجراء التلقائي (Action Type)</label>
              <ModernSelect
                style={{ width: '100%' }}
                value={formData.action_type}
                onChange={(val) => setFormData({ ...formData, action_type: val })}
                options={[
                  { value: 'notify_admin', label: 'إرسال إشعار فوري للأدمن (notify_admin)' },
                  { value: 'notify_consultant', label: 'إرسال تنبيه للمستشار (notify_consultant)' },
                  { value: 'escalate_ticket', label: 'تصعيد التذكرة تلقائياً (escalate_ticket)' },
                  { value: 'pause_consultant', label: 'تجميد حساب المستشار مؤقتاً (pause_consultant)' },
                  { value: 'flag_risk', label: 'وضع علامة مخاطر high_risk (flag_risk)' },
                  { value: 'send_email', label: 'إرسال بريد إلكتروني (send_email)' }
                ]}
              />
            </div>

            <div className="cc-form-group">
              <label>حالة القاعدة</label>
              <ModernSelect
                style={{ width: '100%' }}
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={[
                  { value: 'active', label: 'نشط (Active)' },
                  { value: 'paused', label: 'متوقف (Paused)' },
                  { value: 'needs_review', label: 'تحتاج مراجعة (Needs Review)' }
                ]}
              />
            </div>
          </div>

          <div className="cc-form-group">
            <label>نص الرسالة / تفاصيل الإجراء</label>
            <textarea
              className="cc-input"
              style={{ width: '100%', height: '80px', resize: 'vertical' }}
              placeholder="نص التنبيه الذي يصل في الإشعارات عند تحقق القاعدة..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="cc-btn-secondary" onClick={onClose} disabled={loading}>
              إلغاء
            </button>
            <button type="submit" className="cc-btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : rule ? 'حفظ التعديلات' : 'إنشاء القاعدة الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
