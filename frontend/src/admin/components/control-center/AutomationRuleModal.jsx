import React, { useState, useEffect } from 'react';
import { createAutomationRule, updateAutomationRule } from '../../services/adminApi';

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
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={formData.trigger_event}
                onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
              >
                <option value="rating_submitted">إضافة تقييم جلسة (rating_submitted)</option>
                <option value="appointment_cancelled">إلغاء موعد (appointment_cancelled)</option>
                <option value="ticket_escalated">تصعيد تذكرة (ticket_escalated)</option>
                <option value="consultant_registered">تسجيل مستشار جديد (consultant_registered)</option>
                <option value="payout_requested">طلب سحب رصيد (payout_requested)</option>
              </select>
            </div>

            <div className="cc-form-group">
              <label>حقل الشرط (Condition Field)</label>
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={formData.condition_field}
                onChange={(e) => setFormData({ ...formData, condition_field: e.target.value })}
              >
                <option value="rating">درجة التقييم (rating)</option>
                <option value="amount">المبلغ / القيمة (amount)</option>
                <option value="cancellation_count">عدد الإلغاءات (cancellation_count)</option>
                <option value="status">الحالة (status)</option>
              </select>
            </div>
          </div>

          <div className="cc-form-row">
            <div className="cc-form-group">
              <label>المعامل الشرطي (Operator)</label>
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={formData.condition_op}
                onChange={(e) => setFormData({ ...formData, condition_op: e.target.value })}
              >
                <option value="lte">أقل من أو يساوي (&le;)</option>
                <option value="gte">أكبر من أو يساوي (&ge;)</option>
                <option value="eq">يساوي (=)</option>
                <option value="contains">يحتوي على (contains)</option>
                <option value="always">دائماً بدون شرط (always)</option>
              </select>
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
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={formData.action_type}
                onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
              >
                <option value="notify_admin">إرسال إشعار فوري للأدمن (notify_admin)</option>
                <option value="notify_consultant">إرسال تنبيه للمستشار (notify_consultant)</option>
                <option value="escalate_ticket">تصعيد التذكرة تلقائياً (escalate_ticket)</option>
                <option value="pause_consultant">تجميد حساب المستشار مؤقتاً (pause_consultant)</option>
                <option value="flag_risk">وضع علامة مخاطر high_risk (flag_risk)</option>
                <option value="send_email">إرسال بريد إلكتروني (send_email)</option>
              </select>
            </div>

            <div className="cc-form-group">
              <label>حالة القاعدة</label>
              <select
                className="cc-select"
                style={{ width: '100%' }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">نشط (Active)</option>
                <option value="paused">متوقف (Paused)</option>
                <option value="needs_review">تحتاج مراجعة (Needs Review)</option>
              </select>
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
