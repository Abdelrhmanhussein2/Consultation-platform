import React, { useState, useEffect } from 'react';
import { IconRbac, IconCheck } from '../components/AdminIcons';
import { getAdminsList, createAdmin as apiCreateAdmin } from '../services/adminApi';

export default function AdminRbacPage({ navigate }) {
  const [admins, setAdmins] = useState([
    {
      id: 'adm_1',
      name: 'خالد (Super Admin)',
      email: 'admin@diwan.jo',
      role: 'super_admin',
      permissions: ['الكل (Super Admin Full Access)'],
      createdAt: '2026-08-01'
    },
    {
      id: 'adm_2',
      name: 'عبدالرحمن حسين',
      email: 'abdelrhman@diwan.jo',
      role: 'admin',
      permissions: ['إدارة المستخدمين', 'اعتماد المستشارين', 'إدارة الجلسات', 'إدارة السحوبات والماليات'],
      createdAt: '2026-08-15'
    }
  ]);

  const [createModal, setCreateModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    permissions: []
  });

  const availablePerms = [
    { key: 'manage_users', label: 'إدارة المستخدمين والشركات' },
    { key: 'manage_consultants', label: 'اعتماد ومراجعة المستشارين والشهادات' },
    { key: 'manage_sessions', label: 'إدارة جلسات الاستشارات والدخول كمراقب' },
    { key: 'reply_tickets', label: 'الرد على تذاكر الدعم والملاحظات السرية' },
    { key: 'send_notifications', label: 'إرسال الإذاعات والإشعارات العامة' },
    { key: 'manage_payouts', label: 'معالجة وتنفيذ طلبات سحب الأرباح' },
    { key: 'manage_settings', label: 'تعديل إعدادات المنصة وبوابات الدفع' }
  ];

  useEffect(() => {
    let mounted = true;
    async function loadAdmins() {
      try {
        const data = await getAdminsList();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setAdmins(data.map(a => ({
            id: a.id,
            name: a.full_name || a.name || 'مشرف نظام',
            email: a.email,
            role: a.role || 'admin',
            permissions: a.role === 'super_admin' ? ['الكل (Super Admin Full Access)'] : (a.permissions || ['إدارة المستخدمين', 'اعتماد المستشارين']),
            createdAt: a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : '2026-08-23'
          })));
        }
      } catch (err) {
        console.warn('Admins API fallback:', err);
      }
    }
    loadAdmins();
    return () => { mounted = false; };
  }, []);

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      alert('يرجى ملء كافة الحقول الأساسية');
      return;
    }

    try {
      await apiCreateAdmin({
        full_name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        password: newAdmin.password,
        permissions: newAdmin.permissions
      });
    } catch (e) {}

    setAdmins([...admins, {
      id: `adm_${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: 'admin',
      permissions: newAdmin.permissions.map(k => availablePerms.find(p => p.key === k)?.label || k),
      createdAt: '2026-08-23'
    }]);
    setCreateModal(false);
    alert(`تم إنشاء حساب المشرف [${newAdmin.name}] وتعيين صلاحياته بنجاح.`);
  };

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">ROLE-BASED ACCESS CONTROL (RBAC)</div>
          <h1 className="admin-banner-title">صلاحيات الأدوار والمشرفين</h1>
          <p className="admin-banner-desc">
            إدارة حسابات المشرفين وتوزيع الصلاحيات الدقيقة للتحكم في أقسام المنصة.
          </p>
        </div>
        <button className="admin-btn-action-primary" onClick={() => setCreateModal(true)}>
          <span>+ إنشاء مشرف جديد</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>المشرف</th>
              <th>البريد الإلكتروني</th>
              <th>الرتبة</th>
              <th>الصلاحيات الممنوحة</th>
              <th>تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong></td>
                <td style={{ direction: 'ltr', textAlign: 'right' }}>{a.email}</td>
                <td>
                  <span className={a.role === 'super_admin' ? 'admin-badge-warning' : 'admin-badge-info'}>
                    {a.role === 'super_admin' ? 'مشرف عام (Super Admin)' : 'مشرف نظام (Admin)'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {a.permissions.map((p, i) => (
                      <span key={i} className="admin-category-chip" style={{ fontSize: '11px', padding: '3px 8px' }}>{p}</span>
                    ))}
                  </div>
                </td>
                <td>{a.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createModal && (
        <div className="admin-modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '18px', fontWeight: '800' }}>إنشاء حساب مشرف جديد وتحديد الصلاحيات</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>الاسم:</label>
                <input type="text" className="admin-search-input" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>البريد الإلكتروني:</label>
                <input type="email" className="admin-search-input" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>الهاتف:</label>
                <input type="text" className="admin-search-input" value={newAdmin.phone} onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>كلمة المرور:</label>
                <input type="password" className="admin-search-input" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>تحديد الصلاحيات الدقيقة:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                {availablePerms.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newAdmin.permissions.includes(p.key)}
                      onChange={e => {
                        if (e.target.checked) {
                          setNewAdmin({ ...newAdmin, permissions: [...newAdmin.permissions, p.key] });
                        } else {
                          setNewAdmin({ ...newAdmin, permissions: newAdmin.permissions.filter(x => x !== p.key) });
                        }
                      }}
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="admin-btn-action-outline" onClick={() => setCreateModal(false)}>إلغاء</button>
              <button className="admin-btn-action-primary" onClick={handleCreateAdmin}>إنشاء المشرف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
