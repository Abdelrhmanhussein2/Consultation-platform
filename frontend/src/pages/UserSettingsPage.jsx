import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SettingsIcon } from '../components/UserPortal/Icons';

export default function UserSettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [taxNumber, setTaxNumber] = useState(user?.tax_number || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          company_name: companyName.trim() || undefined,
          tax_number: taxNumber.trim() || undefined
        })
      });

      if (res.ok) {
        setMessage('تم تحديث البيانات الشخصية بنجاح!');
        refreshUser();
      }
    } catch (e) {
      setMessage('حدث خطأ أثناء حفظ التغيرات.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !token) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (res.ok) {
        setMessage('تم تغيير كلمة المرور بنجاح!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const err = await res.json();
        setMessage(err.detail || 'فشلت عملية تغيير كلمة المرور');
      }
    } catch (e) {
      setMessage('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '840px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#E5EFF5', padding: '10px', borderRadius: '12px', color: '#005D9C' }}>
          <SettingsIcon size={24} color="#005D9C" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
            إعدادات الحساب والملف الشخصي
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            تحديث اسمك، بيانات الاتصال، معلومات الشركة، وإدارة كلمة المرور والأمان.
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: '#E5EFF5', color: '#005D9C', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid #BAE6FD' }}>
          {message}
        </div>
      )}

      {/* Basic Profile Details Form */}
      <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          البيانات الأساسية
        </h3>
        <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>الاسم الكامل</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>رقم الهاتف</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>اسم الشركة (إن وجد)</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>الرقم الضريبي (إن وجد)</label>
            <input type="text" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }} />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #F5A52A, #E0921B)', color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: '25px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 165, 42, 0.3)' }}>
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Form */}
      <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
          تغيير كلمة المرور والأمان
        </h3>
        <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>كلمة المرور الحالية</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>كلمة المرور الجديدة</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px' }} />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #F5A52A, #E0921B)', color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: '25px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 165, 42, 0.3)' }}>
              تحديث كلمة المرور
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
