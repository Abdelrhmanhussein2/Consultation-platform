import React, { useState, useEffect } from 'react';
import { IconSearch } from '../components/AdminIcons';
import { getAdminUsers, toggleUserActive, adminAddUser } from '../services/adminApi';

export default function AdminUsersPage({ navigate }) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Active Metric Card Filter: 'all' | 'active' | 'multi_role' | 'with_roles'
  const [activeCard, setActiveCard] = useState('all');

  const [users, setUsers] = useState([
    {
      id: 'u1',
      name: 'سعد هارون',
      email: 's.haroun@diwan.jo',
      phone: '00962791679444',
      roles: ['مدير المنصة'],
      status: 'مفعل',
      createdAt: '2026-03-15',
      avatarLetter: 'س'
    },
    {
      id: 'u2',
      name: 'رأفت حداد',
      email: 'r.haddad@diwan.jo',
      phone: '00962788541223',
      roles: ['مدير المنصة', 'مدير المحتوى'],
      status: 'مفعل',
      createdAt: '2026-12-01',
      avatarLetter: 'ر'
    },
    {
      id: 'u3',
      name: 'فراس عودة',
      email: 'f.oudeh@diwan.jo',
      phone: '00962771239874',
      roles: ['مستشار'],
      status: 'مفعل',
      createdAt: '2026-03-10',
      avatarLetter: 'ف'
    },
    {
      id: 'u4',
      name: 'محمد الخطيب',
      email: 'm.khatib@diwan.jo',
      phone: '00962799887766',
      roles: ['مستشار', 'مراجع المحتوى'],
      status: 'مفعل',
      createdAt: '2026-04-05',
      avatarLetter: 'م'
    },
    {
      id: 'u5',
      name: 'رولا حداد',
      email: 'rula@diwan.jo',
      phone: '00962795544332',
      roles: ['موظف دعم فني'],
      status: 'مفعل',
      createdAt: '2026-04-20',
      avatarLetter: 'ر'
    },
    {
      id: 'u6',
      name: 'باسم الشوابكة',
      email: 'bassem@diwan.jo',
      phone: '00962789900112',
      roles: ['مسؤول مالي'],
      status: 'مفعل',
      createdAt: '2026-05-03',
      avatarLetter: 'ب'
    },
    {
      id: 'u7',
      name: 'ديانا رضوان',
      email: 'diana@diwan.jo',
      phone: '00962774455667',
      roles: ['مسؤول خدمة العملاء'],
      status: 'مفعل',
      createdAt: '2026-05-12',
      avatarLetter: 'د'
    },
    {
      id: 'u8',
      name: 'محمد الجراح',
      email: 'm.jarrah@diwan.jo',
      phone: '00962792233445',
      roles: ['مستشار'],
      status: 'معطل',
      createdAt: '2026-06-01',
      avatarLetter: 'م'
    },
    {
      id: 'u9',
      name: 'صخر زيادنة',
      email: 'm.sakher@diwan.jo',
      phone: '00962783344556',
      roles: ['مستشار ضريبي'],
      status: 'مفعل',
      createdAt: '2026-11-10',
      avatarLetter: 'ص'
    },
    {
      id: 'u10',
      name: 'حمزة النعيم',
      email: 'm.hamza@diwan.jo',
      phone: '00962795551122',
      roles: ['مدير المنصة', 'مشرف عام'],
      status: 'مفعل',
      createdAt: '2026-06-20',
      avatarLetter: 'ح'
    }
  ]);

  // Modals state
  const [viewPermsModal, setViewPermsModal] = useState(null);
  const [editUserModal, setEditUserModal] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'مفعل',
    roles: []
  });

  const allAvailableRoles = [
    { key: 'مدير المنصة', label: 'مدير المنصة', type: 'دور أساسي' },
    { key: 'مدير المحتوى', label: 'مدير المحتوى', type: 'غير أساسي' },
    { key: 'مراجع المحتوى', label: 'مراجع المحتوى', type: 'غير أساسي' },
    { key: 'مستشار', label: 'مستشار', type: 'دور أساسي' },
    { key: 'موظف دعم فني', label: 'موظف دعم فني', type: 'غير أساسي' },
    { key: 'مسؤول مالي', label: 'مسؤول مالي', type: 'غير أساسي' },
    { key: 'مسؤول خدمة العملاء', label: 'مسؤول خدمة العملاء', type: 'غير أساسي' },
    { key: 'صادق للقراءة فقط', label: 'صادق للقراءة فقط', type: 'غير أساسي' }
  ];

  const permissionsList = [
    { name: 'إضافة المستخدمين', status: 'ممنوح', source: 'مدير المنصة', scope: 'الإدارة العامة' },
    { name: 'إدارة مستخدمي المنصة', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'تعديل بيانات المستخدم', status: 'ممنوح', source: 'مدير المنصة', scope: 'الإدارة العامة' },
    { name: 'تعطيل وتفعيل المستخدم', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'حذف المستخدم نهائياً', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'تعديل رتبات المستخدمين', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'إدارة أذونات المستخدم', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'عرض المحتوى', status: 'ممنوح', source: 'مدير المنصة', scope: 'الجميع' },
    { name: 'إنشاء محتوى جديد', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'تعديل المحتوى', status: 'ممنوح', source: 'مدير المنصة', scope: 'الإدارة العامة' },
    { name: 'مراجعة المحتوى', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'أرشفة المحتوى', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'نشر المحتوى إلى الموقع', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'إلغاء نشر المحتوى', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'أرشفة المحتوى وتصنيفه', status: 'ممنوح', source: 'مدير المنصة', scope: '—' },
    { name: 'حذف المحتوى', status: 'ممنوح', source: 'مدير المنصة', scope: '—' }
  ];

  // Fetch users on mount from FastAPI backend
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const data = await getAdminUsers();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(item => {
            const rawId = item.id;
            const fullName = item.full_name || item.name || 'مستخدم مسجل';
            const email = item.email || '';
            const phone = item.phone || '';
            const isAct = item.is_active !== undefined ? item.is_active : true;
            let roleList = ['عميل'];
            if (item.role === 'super_admin') roleList = ['مدير عام للنظام'];
            else if (item.role === 'admin') roleList = ['مدير المنصة'];
            else if (item.role === 'consultant' || item.role === 'platform_consultant') roleList = ['مستشار'];

            return {
              id: rawId ? rawId.toString() : `u_${Math.random()}`,
              rawId: rawId,
              name: fullName,
              email: email,
              phone: phone,
              roles: roleList,
              status: isAct ? 'مفعل' : 'معطل',
              createdAt: item.created_at ? item.created_at.split('T')[0] : '2026-03-01',
              avatarLetter: fullName.charAt(0) || 'م'
            };
          });
          setUsers(mapped);
        }
      } catch (err) {
        console.warn('Backend users offline, using verified mock state:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const handleOpenEdit = (user) => {
    setEditUserModal(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: [...user.roles]
    });
  };

  const handleToggleRoleSelection = (roleName) => {
    if (editFormData.roles.includes(roleName)) {
      setEditFormData({
        ...editFormData,
        roles: editFormData.roles.filter(r => r !== roleName)
      });
    } else {
      setEditFormData({
        ...editFormData,
        roles: [...editFormData.roles, roleName]
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name || !editFormData.email) {
      alert('يرجى إدخال الاسم والبريد الإلكتروني');
      return;
    }

    if (editUserModal) {
      setUsers(users.map(u => u.id === editUserModal.id ? {
        ...u,
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        status: editFormData.status,
        roles: editFormData.roles.length > 0 ? editFormData.roles : ['عميل']
      } : u));
      alert(`تم حفظ وتحديث بيانات المستخدم [${editFormData.name}] بنجاح`);
    } else {
      const newUser = {
        id: `u_${Date.now()}`,
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone || '00962790000000',
        roles: editFormData.roles.length > 0 ? editFormData.roles : ['عميل'],
        status: editFormData.status,
        createdAt: new Date().toISOString().split('T')[0],
        avatarLetter: editFormData.name.charAt(0)
      };
      
      try {
        await adminAddUser({
          full_name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone || '00962790000000',
          password: 'Password@2026',
          role: editFormData.roles.includes('مستشار') ? 'consultant' : 'user'
        });
      } catch (err) {
        console.warn('Direct backend save notice:', err.message);
      }

      setUsers([newUser, ...users]);
      alert(`تم إضافة المستخدم [${editFormData.name}] بنجاح`);
    }

    setEditUserModal(null);
    setCreateModalOpen(false);
  };

  const handleToggleStatus = async (id) => {
    const target = users.find(u => u.id === id);
    const newStatus = target?.status === 'مفعل' ? 'معطل' : 'مفعل';

    // 1. Optimistic UI update
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));

    // 2. Call backend if live user
    if (target && target.rawId) {
      try {
        await toggleUserActive(target.rawId);
      } catch (err) {
        console.warn('Backend toggle status error:', err.message);
      }
    }
  };

  const handleDeleteUser = (id) => {
    const target = users.find(u => u.id === id);
    if (window.confirm(`هل أنت متأكد من حذف المستخدم: ${target?.name}؟`)) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  // Filter calculation
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.status === 'مفعل').length;
  const multiRoleUsersCount = users.filter(u => u.roles.length > 1).length;
  const withRolesUsersCount = users.filter(u => u.roles.length > 0).length;

  const filteredUsers = users.filter(u => {
    // 1. Metric card filter
    if (activeCard === 'active' && u.status !== 'مفعل') return false;
    if (activeCard === 'multi_role' && u.roles.length <= 1) return false;
    if (activeCard === 'with_roles' && u.roles.length === 0) return false;

    // 2. Search filter
    const matchSearch = u.name.includes(searchTerm) || u.email.includes(searchTerm) || u.phone.includes(searchTerm);

    // 3. Dropdowns filter
    const matchRole = roleFilter === 'all' || u.roles.some(r => r.includes(roleFilter));
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div>
      {/* 1. Header Banner */}
      <div className="admin-command-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="admin-banner-title" style={{ fontSize: '24px', margin: 0 }}>إدارة المستخدمين</h1>
            <span style={{ fontSize: '20px', color: '#0A3C64' }}>👥</span>
          </div>
          <p className="admin-banner-desc" style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#64748B' }}>
            إضافة المستخدمين وتعديل رتبهم وصلاحياتهم - مع وجود زر لإنشاء مستخدم أو أدمن جديد.
          </p>
        </div>

        <button 
          className="admin-btn-action-primary"
          style={{ fontSize: '13px', padding: '8px 18px', gap: '6px' }}
          onClick={() => {
            setEditUserModal(null);
            setEditFormData({ name: '', email: '', phone: '', status: 'مفعل', roles: ['مستشار'] });
            setCreateModalOpen(true);
          }}
        >
          <span>+ إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* 2. Top 4 Interactive Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '22px' }}>
        {/* Card 1: إجمالي المستخدمين */}
        <div 
          className="admin-card" 
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderBottom: activeCard === 'all' ? '3px solid #E58A13' : '3px solid transparent',
            boxShadow: activeCard === 'all' ? '0 4px 12px rgba(229, 138, 19, 0.15)' : 'none'
          }}
          onClick={() => setActiveCard('all')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>{totalUsersCount}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>إجمالي المستخدمين</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>مستخدم مسجل في النظام</div>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: activeCard === 'all' ? '#E58A13' : '#FEF3C7', 
              color: activeCard === 'all' ? '#FFFFFF' : '#D97706', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }}>
              👤
            </div>
          </div>
        </div>

        {/* Card 2: المستخدمون النشطون */}
        <div 
          className="admin-card"
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderBottom: activeCard === 'active' ? '3px solid #E58A13' : '3px solid transparent',
            boxShadow: activeCard === 'active' ? '0 4px 12px rgba(229, 138, 19, 0.15)' : 'none'
          }}
          onClick={() => setActiveCard('active')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>{activeUsersCount}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>المستخدمون النشطون</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>حسابات فعالة</div>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: activeCard === 'active' ? '#E58A13' : '#ECFDF5', 
              color: activeCard === 'active' ? '#FFFFFF' : '#059669', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }}>
              ✓
            </div>
          </div>
        </div>

        {/* Card 3: متعدد الأدوار */}
        <div 
          className="admin-card"
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderBottom: activeCard === 'multi_role' ? '3px solid #E58A13' : '3px solid transparent',
            boxShadow: activeCard === 'multi_role' ? '0 4px 12px rgba(229, 138, 19, 0.15)' : 'none'
          }}
          onClick={() => setActiveCard('multi_role')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>{multiRoleUsersCount}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>متعدد الأدوار</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>يمتلكون أكثر من دور</div>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: activeCard === 'multi_role' ? '#E58A13' : '#EFF6FF', 
              color: activeCard === 'multi_role' ? '#FFFFFF' : '#2563EB', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }}>
              🛡️
            </div>
          </div>
        </div>

        {/* Card 4: المستخدمون المرتبطون بأدوار */}
        <div 
          className="admin-card"
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderBottom: activeCard === 'with_roles' ? '3px solid #E58A13' : '3px solid transparent',
            boxShadow: activeCard === 'with_roles' ? '0 4px 12px rgba(229, 138, 19, 0.15)' : 'none'
          }}
          onClick={() => setActiveCard('with_roles')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A' }}>{withRolesUsersCount}</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginTop: '2px' }}>المستخدمون المرتبطون بأدوار</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>مستخدمين حاليين مع رتب مفعلة</div>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: activeCard === 'with_roles' ? '#E58A13' : '#F8FAFC', 
              color: activeCard === 'with_roles' ? '#FFFFFF' : '#64748B', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px', 
              border: activeCard === 'with_roles' ? '1px solid #E58A13' : '1px solid #E2E8F0',
              transition: 'all 0.2s ease'
            }}>
              +
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar with Active Card Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div className="admin-search-wrapper" style={{ flex: 1 }}>
          <IconSearch size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="بحث بالاسم أو البريد أو الهاتف..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="admin-select-input"
          style={{ width: '160px', height: '38px' }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="all">جميع الأدوار</option>
          <option value="مستشار">مستشار</option>
          <option value="مدير">مدير المنصة</option>
          <option value="دعم">موظف دعم فني</option>
          <option value="مالي">مسؤول مالي</option>
        </select>

        <select 
          className="admin-select-input"
          style={{ width: '140px', height: '38px' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">جميع الحالات</option>
          <option value="مفعل">مفعل</option>
          <option value="معطل">معطل</option>
        </select>
      </div>

      {/* 4. Full Width Users Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>البريد الإلكتروني</th>
              <th>رقم الهاتف</th>
              <th>الأدوار</th>
              <th>الحالة</th>
              <th>تاريخ الإضافة</th>
              <th style={{ textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                  لا توجد نتائج مطابقة للتصفية المحددة.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id}>
                  {/* 1. المستخدم */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F59E0B', color: '#FFFFFF', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                        {u.avatarLetter}
                      </div>
                      <div style={{ fontWeight: '800', color: '#0F172A', fontSize: '13.5px' }}>{u.name}</div>
                    </div>
                  </td>

                  {/* 2. البريد الإلكتروني */}
                  <td style={{ direction: 'ltr', textAlign: 'right', color: '#475569', fontSize: '13px' }}>
                    {u.email}
                  </td>

                  {/* 3. رقم الهاتف */}
                  <td style={{ direction: 'ltr', textAlign: 'right', color: '#475569', fontSize: '12.5px', fontFamily: 'monospace' }}>
                    {u.phone}
                  </td>

                  {/* 4. الأدوار */}
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {u.roles.map((r, rIdx) => (
                        <span 
                          key={rIdx}
                          className="admin-category-chip"
                          style={{ fontSize: '11px', padding: '3px 9px', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: '12px' }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* 5. الحالة */}
                  <td>
                    <span 
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: u.status === 'مفعل' ? '#ECFDF5' : '#FEF2F2',
                        color: u.status === 'مفعل' ? '#059669' : '#DC2626',
                        border: u.status === 'مفعل' ? '1px solid #A7F3D0' : '1px solid #FECACA',
                        display: 'inline-block'
                      }}
                    >
                      {u.status}
                    </span>
                  </td>

                  {/* 6. تاريخ الإضافة */}
                  <td style={{ color: '#64748B', fontSize: '12.5px', fontFamily: 'monospace' }}>
                    {u.createdAt}
                  </td>

                  {/* 7. الإجراءات */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {/* View Eye */}
                      <button 
                        className="admin-icon-btn-minimal" 
                        style={{ 
                          border: '1px solid #E2E8F0', 
                          borderRadius: '6px', 
                          background: '#FFFFFF', 
                          width: '30px', 
                          height: '30px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#64748B', 
                          cursor: 'pointer' 
                        }}
                        title="معاينة الصلاحيات الفعالة"
                        onClick={() => setViewPermsModal(u)}
                      >
                        👁
                      </button>

                      {/* Edit Pencil */}
                      <button 
                        className="admin-icon-btn-minimal" 
                        style={{ 
                          border: '1px solid #E2E8F0', 
                          borderRadius: '6px', 
                          background: '#FFFFFF', 
                          width: '30px', 
                          height: '30px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#64748B', 
                          cursor: 'pointer' 
                        }}
                        title="تعديل المستخدم والأدوار"
                        onClick={() => handleOpenEdit(u)}
                      >
                        ✏️
                      </button>

                      {/* Block / Stop icon */}
                      <button 
                        className="admin-icon-btn-minimal" 
                        style={{ 
                          border: '1px solid #E2E8F0', 
                          borderRadius: '6px', 
                          background: '#FFFFFF', 
                          width: '30px', 
                          height: '30px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: u.status === 'مفعل' ? '#DC2626' : '#059669', 
                          cursor: 'pointer' 
                        }}
                        title={u.status === 'مفعل' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        onClick={() => handleToggleStatus(u.id)}
                      >
                        {u.status === 'مفعل' ? '⛔' : '✓'}
                      </button>

                      {/* Delete Trash icon */}
                      <button 
                        className="admin-icon-btn-minimal" 
                        style={{ 
                          border: '1px solid #FECACA', 
                          background: '#FEF2F2', 
                          borderRadius: '6px', 
                          width: '30px', 
                          height: '30px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#DC2626', 
                          cursor: 'pointer' 
                        }}
                        title="حذف المستخدم"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: الصلاحيات الفعالة (VIEW MODAL - EYE ICON 👁️)
          ══════════════════════════════════════════════════════════════════ */}
      {viewPermsModal && (
        <div className="admin-modal-overlay" onClick={() => setViewPermsModal(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0A3C64' }}>
                الصلاحيات الفعالة — {viewPermsModal.name}
              </h3>
              <button className="admin-icon-btn-minimal" onClick={() => setViewPermsModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>الأدوار المسندة:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {viewPermsModal.roles.map((r, i) => (
                  <span key={i} className="admin-category-chip" style={{ fontSize: '11px', padding: '3px 10px', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD' }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <table className="admin-table" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th>الصلاحية</th>
                    <th>الحالة</th>
                    <th>مصدر الصلاحية</th>
                    <th>النطاق</th>
                    <th>التخصيص</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionsList.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '700', color: '#0F172A' }}>{p.name}</td>
                      <td>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: '700' }}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <span className="admin-category-chip" style={{ fontSize: '11px', padding: '2px 8px', background: '#F0F9FF', color: '#0369A1' }}>
                          {p.source}
                        </span>
                      </td>
                      <td style={{ color: '#64748B' }}>{p.scope}</td>
                      <td>
                        <button 
                          className="admin-btn-action-outline" 
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          onClick={() => alert(`تخصيص صلاحية: ${p.name}`)}
                        >
                          إعادة ضبط
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="admin-btn-action-outline" onClick={() => setViewPermsModal(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: تعديل المستخدم (EDIT MODAL - PENCIL ICON ✏️)
          ══════════════════════════════════════════════════════════════════ */}
      {(editUserModal || createModalOpen) && (
        <div className="admin-modal-overlay" onClick={() => { setEditUserModal(null); setCreateModalOpen(false); }}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color: '#0A3C64' }}>
                {editUserModal ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button className="admin-icon-btn-minimal" onClick={() => { setEditUserModal(null); setCreateModalOpen(false); }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>الاسم الكامل *</label>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
                  placeholder="سعد هارون"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>البريد الإلكتروني *</label>
                <input 
                  type="email" 
                  className="admin-search-input" 
                  value={editFormData.email} 
                  onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} 
                  placeholder="s.haroun@diwan.jo"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>رقم الهاتف</label>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  value={editFormData.phone} 
                  onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} 
                  placeholder="00962791679444"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>حالة تسجيل الدخول</label>
                <select 
                  className="admin-select-input" 
                  style={{ width: '100%', height: '38px' }}
                  value={editFormData.status} 
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="مفعل">مفعل</option>
                  <option value="معطل">معطل</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
                الأدوار — إضافة أو إزالة أو دمج أكثر من دور:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', maxHeight: '200px', overflowY: 'auto' }}>
                {allAvailableRoles.map(role => {
                  const isChecked = editFormData.roles.includes(role.key);
                  return (
                    <label 
                      key={role.key} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        fontSize: '12.5px', 
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isChecked ? '#FFFFFF' : 'transparent',
                        border: isChecked ? '1px solid #0284C7' : '1px solid transparent',
                        boxShadow: isChecked ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setEditFormData({ ...editFormData, roles: [...editFormData.roles, role.key] });
                          } else {
                            setEditFormData({ ...editFormData, roles: editFormData.roles.filter(r => r !== role.key) });
                          }
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: isChecked ? '800' : '600', color: '#0F172A' }}>{role.label}</div>
                        <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{role.type}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="admin-btn-action-outline" 
                onClick={() => { setEditUserModal(null); setCreateModalOpen(false); }}
              >
                إلغاء
              </button>
              <button 
                className="admin-btn-action-primary" 
                style={{ padding: '8px 22px' }}
                onClick={handleSaveEdit}
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
