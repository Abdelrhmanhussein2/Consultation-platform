import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { adminAddUserDirect } from '../../services/adminApi';

export default function AddConsultantCredentialModal({ isOpen, onClose, onSuccess, showToastMsg }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    title: 'مستشار ضريبي معتمد',
    specialization: 'ضريبة المبيعات والدخل',
    years: '5',
    license: '',
    hourlyRate: '45',
    city: 'عمّان',
    verificationStatus: 'approved'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      showToastMsg('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    setLoading(true);
    try {
      await adminAddUserDirect({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || null,
        role: 'consultant',
        entity_type: 'individual',
        city: formData.city,
        title: formData.title,
        years: parseInt(formData.years, 10) || 1,
        license: formData.license.trim() || null,
        hourly_rate: parseFloat(formData.hourlyRate) || 40.0,
        verification_status: formData.verificationStatus,
        bio: `مستشار معتمد في ${formData.specialization}. خبرة ${formData.years} سنوات.`
      });

      showToastMsg('تم تسجيل واعتماد ملف المستشار في قاعدة البيانات بنجاح');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToastMsg(err.message || 'حدث خطأ أثناء حفظ المستشار');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="overlay show" onClick={onClose}>
      <div className="modal sm" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="modal-title">تسجيل طلب اعتماد مستشار جديد</div>
          <button className="close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  الاسم الكامل <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد عبد الله"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  البريد الإلكتروني <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@consultant.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  كلمة المرور المؤقتة <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  placeholder="079XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  المسمى المهني / المؤهل
                </label>
                <input
                  type="text"
                  placeholder="مثال: مستشار ضريبي معتمد JCPA"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  التخصص الرئيسي
                </label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                >
                  <option value="ضريبة المبيعات والدخل">ضريبة المبيعات والدخل</option>
                  <option value="التدقيق والامتثال المالي">التدقيق والامتثال المالي</option>
                  <option value="الاعتراضات واللجان الضريبية">الاعتراضات واللجان الضريبية</option>
                  <option value="استشارات الشركات والدمج">استشارات الشركات والدمج</option>
                  <option value="الفوترة الإلكترونية">الفوترة الإلكترونية</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  سنوات الخبرة
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years}
                  onChange={(e) => setFormData({ ...formData, years: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  رقم الترخيص / الضريبي
                </label>
                <input
                  type="text"
                  placeholder="JCPA-2028-XXX"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  سعر الاستشارة (د.أ/ساعة)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                حالة الاعتماد الأولية
              </label>
              <select
                value={formData.verificationStatus}
                onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
              >
                <option value="approved">موثق ومعتمد فورًا</option>
                <option value="pending">قيد التوثيق والمراجعة</option>
              </select>
            </div>
          </div>

          <div className="modal-actions" style={{ padding: '12px 16px' }}>
            <button type="button" className="btn ghost" onClick={onClose} disabled={loading}>
              إلغاء
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ واعتماد المستشار'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
