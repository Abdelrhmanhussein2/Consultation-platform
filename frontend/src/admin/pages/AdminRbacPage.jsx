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
      permissionsKeys: ['manage_users', 'manage_consultants', 'manage_sessions', 'reply_tickets', 'send_notifications', 'manage_payouts', 'manage_settings', 'view_analytics', 'manage_admins'],
      permissions: ['الكل (Super Admin Full Access)'],
      createdAt: '2026-08-01'
    },
    {
      id: 'adm_2',
      name: 'عبدالرحمن حسين',
      email: 'abdelrhman@diwan.jo',
      role: 'admin',
      permissionsKeys: ['manage_users', 'manage_consultants', 'manage_sessions', 'manage_payouts'],
      permissions: ['إدارة المستخدمين', 'اعتماد المستشارين', 'إدارة الجلسات', 'إدارة السحوبات والماليات'],
      createdAt: '2026-08-15'
    }
  ]);

  const [createModal, setCreateModal] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState('');
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    permissions: []
  });

  const availablePerms = [
    { key: 'manage_users', label: 'إدارة المستخدمين والشركات (Users & Companies)' },
    { key: 'manage_consultants', label: 'اعتماد ومراجعة المستشارين والشهادات (Consultants & Credentials)' },
    { key: 'manage_payouts', label: 'معالجة وتنفيذ طلبات سحب الأرباح والماليات (Financial & Payouts)' },
    { key: 'manage_sessions', label: 'إدارة جلسات الاستشارات وغرفة المراقب (Sessions & Live Observer)' },
    { key: 'reply_tickets', label: 'الرد على تذاكر الدعم والملاحظات السرية (Support & Internal Notes)' },
    { key: 'send_notifications', label: 'إرسال الإذاعات والإشعارات العامة (Live Broadcasts)' },
    { key: 'manage_settings', label: 'تعديل إعدادات المنصة وبوابات الدفع (Platform Settings)' },
    { key: 'view_analytics', label: 'الاطلاع على تحليلات واستفسارات AI (Analytics & AI Oversight)' },
    { key: 'manage_admins', label: 'إدارة صلاحيات المشرفين وسجل التدقيق (Admins & Audit Trail)' }
  ];

  // Presets
  const presets = [
    { name: 'مشرف مالي وحسابات', perms: ['manage_payouts', 'manage_users', 'manage_settings'] },
    { name: 'مشرف جودة ودعم فني', perms: ['reply_tickets', 'manage_sessions', 'send_notifications'] },
    { name: 'مشرف تدقيق المستشارين', perms: ['manage_consultants', 'manage_users', 'view_analytics'] },
    { name: 'مشرف شامل (All Permissions)', perms: availablePerms.map(p => p.key) }
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
            permissionsKeys: a.permissions || ['manage_users', 'manage_consultants'],
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

  // Clone / Import permissions from existing admin
  const handleClonePermissions = (adminId) => {
    setCloneSourceId(adminId);
    if (!adminId) return;

    const source = admins.find(a => a.id === adminId);
    if (source) {
      if (source.role === 'super_admin') {
        setNewAdmin(prev => ({
          ...prev,
          permissions: availablePerms.map(p => p.key)
        }));
      } else {
        setNewAdmin(prev => ({
          ...prev,
          permissions: [...(source.permissionsKeys || [])]
        }));
      }
    }
  };

  const handleApplyPreset = (presetPerms) => {
    setNewAdmin(prev => ({
      ...prev,
      permissions: [...presetPerms]
    }));
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      alert('يرجى ملء كافة الحقول الأساسية (الاسم، البريد، كلمة المرور)');
      return;
    }

    try {
      await apiCreateAdmin({
        full_name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        password: newAdmin.password,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      });
    } catch (e) {}

    const permLabels = newAdmin.permissions.map(k => availablePerms.find(p => p.key === k)?.label?.split(' (')[0] || k);

    setAdmins([...admins, {
      id: `adm_${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      permissionsKeys: newAdmin.permissions,
      permissions: newAdmin.role === 'super_admin' ? ['الكل (Super Admin Full Access)'] : permLabels,
      createdAt: new Date().toISOString().split('T')[0]
    }]);

    setCreateModal(false);
    setNewAdmin({ name: '', email: '', phone: '', password: '', role: 'admin', permissions: [] });
    setCloneSourceId('');
    alert(`تم إنشاء حساب المشرف [${newAdmin.name}] بنجاح وتطبيق الصلاحيات المختارة.`);
  };

  return (
    <div>
      <div className="admin-command-banner">
        <div>
          <div className="admin-banner-sub-tag">ROLE-BASED ACCESS CONTROL (RBAC)</div>
          <h1 className="admin-banner-title">صلاحيات الأدوار والمشرفين</h1>
          <p className="admin-banner-desc">
            إدارة حسابات المشرفين وتوزيع الصلاحيات الدقيقة، مع إمكانية استيراد ونسخ الصلاحيات من أي حساب والتعديل عليها.
          </p>
        </div>
        <button 
          className="admin-btn-action-primary" 
          onClick={() => {
            setNewAdmin({ name: '', email: '', phone: '', password: '', role: 'admin', permissions: [] });
            setCloneSourceId('');
            setCreateModal(true);
          }}
        >
          <span>+ إنشاء مشرف جديد / استيراد صلاحيات</span>
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
              <th>الإجراء</th>
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
                <td>
                  <button 
                    className="admin-btn-action-outline"
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    onClick={() => {
                      setNewAdmin({
                        name: `نسخة من ${a.name}`,
                        email: '',
                        phone: '',
                        password: '',
                        role: 'admin',
                        permissions: a.role === 'super_admin' ? availablePerms.map(p => p.key) : [...(a.permissionsKeys || [])]
                      });
                      setCloneSourceId(a.id);
                      setCreateModal(true);
                    }}
                  >
                    📋 نسخ الصلاحيات لإنشاء مشرف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create & Clone Admin with Dynamic Permissions */}
      {createModal && (
        <div className="admin-modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                إنشاء مشرف جديد وتعيين الصلاحيات
              </h3>
              <button className="admin-icon-btn-minimal" onClick={() => setCreateModal(false)}>✕</button>
            </div>

            {/* Feature 1: Clone / Import Permissions Box */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', fontWeight: '800', color: '#92400E' }}>
                <span>📋 استيراد ونسخ الصلاحيات من حساب آخر (Clone Permissions):</span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#78350F', margin: '0 0 10px 0' }}>
                اختر مشرفاً لنسخ صلاحياته فوراً، ثم يمكنك التعديل عليها بحرية (إضافة أو تقليل أي صلاحية).
              </p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  className="admin-select-input" 
                  style={{ flex: 1, height: '36px', background: '#FFFFFF' }}
                  value={cloneSourceId}
                  onChange={e => handleClonePermissions(e.target.value)}
                >
                  <option value="">-- اختر حساب المشرف المراد الاستيراد منه --</option>
                  {admins.map(adm => (
                    <option key={adm.id} value={adm.id}>
                      {adm.name} ({adm.role === 'super_admin' ? 'Super Admin - كامل الصلاحيات' : `${adm.permissions.length} صلاحيات`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: '#92400E', fontWeight: '700', alignSelf: 'center' }}>أو اختر قالباً جاهزاً:</span>
                {presets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    className="admin-category-chip"
                    style={{ fontSize: '11px', padding: '3px 8px', cursor: 'pointer', background: '#FFFFFF' }}
                    onClick={() => handleApplyPreset(preset.perms)}
                  >
                    ⚡ {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>الاسم الكامل:</label>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="مثال: م. علي الأحمد"
                  value={newAdmin.name} 
                  onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>البريد الإلكتروني:</label>
                <input 
                  type="email" 
                  className="admin-search-input" 
                  placeholder="ali@diwan.jo"
                  value={newAdmin.email} 
                  onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>رقم الهاتف:</label>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="0791234567"
                  value={newAdmin.phone} 
                  onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>كلمة المرور:</label>
                <input 
                  type="password" 
                  className="admin-search-input" 
                  placeholder="••••••••••••"
                  value={newAdmin.password} 
                  onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} 
                />
              </div>
            </div>

            {/* Granular Permissions Checkboxes */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                  تخصيص الصلاحيات ({newAdmin.permissions.length} محددة من أصل {availablePerms.length}):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    style={{ fontSize: '11px', color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                    onClick={() => setNewAdmin({ ...newAdmin, permissions: availablePerms.map(p => p.key) })}
                  >
                    تحديد الكل
                  </button>
                  <span style={{ color: '#CBD5E1' }}>|</span>
                  <button 
                    type="button" 
                    style={{ fontSize: '11px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                    onClick={() => setNewAdmin({ ...newAdmin, permissions: [] })}
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '8px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                {availablePerms.map(p => {
                  const isChecked = newAdmin.permissions.includes(p.key);
                  return (
                    <label 
                      key={p.key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        fontSize: '12.5px', 
                        color: isChecked ? '#0F172A' : '#64748B', 
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isChecked ? '#FFFFFF' : 'transparent',
                        border: isChecked ? '1px solid #CBD5E1' : '1px solid transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewAdmin({ ...newAdmin, permissions: [...newAdmin.permissions, p.key] });
                          } else {
                            setNewAdmin({ ...newAdmin, permissions: newAdmin.permissions.filter(x => x !== p.key) });
                          }
                        }}
                      />
                      <span style={{ fontWeight: isChecked ? '700' : '400' }}>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="admin-btn-action-outline" onClick={() => setCreateModal(false)}>إلغاء</button>
              <button className="admin-btn-action-primary" onClick={handleCreateAdmin}>
                ✓ إنشاء وتطبيق الصلاحيات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
