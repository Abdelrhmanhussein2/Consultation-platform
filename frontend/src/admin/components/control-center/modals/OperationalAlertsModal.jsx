import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  markOperationalNotificationAsRead,
  markAllOperationalNotificationsAsRead,
  deleteOperationalNotification
} from '../../../services/adminApi';

export default function OperationalAlertsModal({
  isOpen,
  onClose,
  alertsData,
  loading,
  onRefresh,
  showToastMsg
}) {
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [localAlerts, setLocalAlerts] = useState(null);

  // Synchronize localAlerts when alertsData updates
  const alertsList = useMemo(() => {
    if (localAlerts) return localAlerts;
    return Array.isArray(alertsData?.alerts) ? alertsData.alerts : [];
  }, [alertsData, localAlerts]);

  if (!isOpen) return null;

  // Category counts
  const categoryCounts = {
    all: alertsList.length,
    consultants: alertsList.filter((a) => a.type === 'consultant_approval').length,
    payouts: alertsList.filter((a) => a.type === 'payout_request').length,
    tickets: alertsList.filter((a) => a.type === 'support_ticket').length,
    system: alertsList.filter((a) => a.type === 'system_notification').length,
    unread: alertsList.filter((a) => !a.is_read && a.type === 'system_notification').length
  };

  const filteredAlerts = alertsList.filter((a) => {
    const matchCategory =
      filterCategory === 'all' ||
      (filterCategory === 'consultants' && a.type === 'consultant_approval') ||
      (filterCategory === 'payouts' && a.type === 'payout_request') ||
      (filterCategory === 'tickets' && a.type === 'support_ticket') ||
      (filterCategory === 'system' && a.type === 'system_notification');

    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      [a.title, a.message, a.category, a.id, JSON.stringify(a.details || {})]
        .join(' ')
        .toLowerCase()
        .includes(q);

    return matchCategory && matchSearch;
  });

  const activeAlert =
    filteredAlerts.find((a) => a.id === selectedAlertId) ||
    filteredAlerts[0] ||
    null;

  // Mark single notification as read in DB
  const handleMarkAsRead = async (alertItem) => {
    if (!alertItem || !alertItem.db_id) return;
    try {
      setActionLoading(true);
      await markOperationalNotificationAsRead(alertItem.db_id);
      
      const updated = alertsList.map((a) =>
        a.id === alertItem.id
          ? {
              ...a,
              is_read: true,
              status: 'read',
              details: { ...a.details, is_read: 'مقروء' }
            }
          : a
      );
      setLocalAlerts(updated);

      if (showToastMsg) {
        showToastMsg('تم تعليم الإشعار كمقروء');
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToastMsg) showToastMsg('فشل تحديث حالة الإشعار');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark all notifications as read in DB
  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      const res = await markAllOperationalNotificationsAsRead();
      const updated = alertsList.map((a) =>
        a.type === 'system_notification'
          ? {
              ...a,
              is_read: true,
              status: 'read',
              details: { ...a.details, is_read: 'مقروء' }
            }
          : a
      );
      setLocalAlerts(updated);
      if (showToastMsg) {
        showToastMsg(res?.message || 'تم تعليم جميع الإشعارات كمقروءة');
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToastMsg) showToastMsg('فشل تحديث الإشعارات');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete single notification from DB
  const handleDelete = async (alertItem) => {
    if (!alertItem || !alertItem.db_id) return;
    try {
      setActionLoading(true);
      await deleteOperationalNotification(alertItem.db_id);
      const updated = alertsList.filter((a) => a.id !== alertItem.id);
      setLocalAlerts(updated);
      if (showToastMsg) showToastMsg('تم حذف الإشعار');
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToastMsg) showToastMsg('فشل حذف الإشعار');
    } finally {
      setActionLoading(false);
    }
  };

  return createPortal(
    <div
      className="overlay show"
      onClick={onClose}
      style={{
        backdropFilter: 'blur(3px)',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="modal"
        style={{
          width: '960px',
          maxWidth: '96vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(13, 60, 92, 0.12)',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          fontFamily: '"Tajawal", "Cairo", Arial, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0D3C5C' }}>
              مركز التنبيهات والإشعارات التشغيلية
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span>قاعدة البيانات المباشرة</span>
              <span>•</span>
              <span style={{ color: '#005D9C', fontWeight: 600 }}>
                {categoryCounts.all} تنبيه مسجل
              </span>
              {categoryCounts.unread > 0 && (
                <>
                  <span>•</span>
                  <span style={{ color: '#005D9C', fontWeight: 600 }}>
                    {categoryCounts.unread} غير مقروء
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn ghost"
              disabled={actionLoading || categoryCounts.unread === 0}
              onClick={handleMarkAllAsRead}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                borderRadius: '6px',
                color: categoryCounts.unread > 0 ? '#005D9C' : '#94a3b8',
                borderColor: categoryCounts.unread > 0 ? '#BAE6FD' : '#e2e8f0',
                background: categoryCounts.unread > 0 ? '#F0F7FD' : '#f8fafc',
                fontWeight: 600,
                cursor: categoryCounts.unread > 0 ? 'pointer' : 'default'
              }}
            >
              تعليم الكل كمقروء
            </button>

            <button
              type="button"
              className="btn ghost"
              style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }}
              onClick={onRefresh}
            >
              تحديث البيانات
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Categories Bar & Search */}
        <div
          style={{
            padding: '10px 18px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'الكل', count: categoryCounts.all },
              { key: 'tickets', label: 'تذاكر الدعم', count: categoryCounts.tickets },
              { key: 'consultants', label: 'اعتماد المستشارين', count: categoryCounts.consultants },
              { key: 'payouts', label: 'التسويات والمالية', count: categoryCounts.payouts },
              { key: 'system', label: 'إشعارات المنصة', count: categoryCounts.system }
            ].map((tab) => {
              const isActive = filterCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterCategory(tab.key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    border: isActive ? '1px solid #005D9C' : '1px solid #cbd5e1',
                    background: isActive ? '#005D9C' : '#ffffff',
                    color: isActive ? '#ffffff' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '0 5px',
                      borderRadius: '4px',
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                      color: isActive ? '#ffffff' : '#64748b'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="بحث في الإشعارات والتنبيهات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '11px',
              background: '#ffffff',
              color: '#0f172a',
              minWidth: '200px',
              outline: 'none'
            }}
          />
        </div>

        {/* Modal 2-Column Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '350px minmax(0, 1fr)',
            flex: 1,
            overflow: 'hidden',
            minHeight: '400px',
            background: '#ffffff'
          }}
        >
          {/* Left Column: Alerts List */}
          <div
            style={{
              borderLeft: '1px solid #e2e8f0',
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              background: '#f8fafc'
            }}
          >
            {loading ? (
              <div style={{ padding: '30px 15px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                جاري فحص الإشعارات من قاعدة البيانات...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div style={{ padding: '40px 15px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                لا توجد إشعارات أو تنبيهات معلقة حالياً.
              </div>
            ) : (
              filteredAlerts.map((item) => {
                const isSelected = activeAlert?.id === item.id;
                const isUnread = !item.is_read && item.type === 'system_notification';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAlertId(item.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #005D9C' : '1px solid #e2e8f0',
                      background: isSelected ? '#F0F7FD' : '#ffffff',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {isUnread && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#005D9C',
                              display: 'inline-block'
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {item.category || 'تنبيه'}
                        </span>
                      </div>

                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {formatArabicDate(item.created_at)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '11.5px',
                        color: isSelected ? '#005D9C' : '#0f172a',
                        marginBottom: '3px'
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        fontSize: '10.5px',
                        color: '#64748b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Alert Full Details */}
          <div
            style={{
              padding: '18px 20px',
              overflowY: 'auto',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {activeAlert ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Alert Top Bar */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#005D9C',
                          color: '#ffffff'
                        }}
                      >
                        {activeAlert.category || 'تنبيه'}
                      </span>

                      {activeAlert.type === 'system_notification' && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: activeAlert.is_read ? '#f1f5f9' : '#F0F7FD',
                            color: activeAlert.is_read ? '#64748b' : '#005D9C',
                            border: activeAlert.is_read ? '1px solid #e2e8f0' : '1px solid #BAE6FD'
                          }}
                        >
                          {activeAlert.is_read ? 'مقروء' : 'غير مقروء'}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      {activeAlert.created_at ? new Date(activeAlert.created_at).toLocaleString('ar-JO') : 'اليوم'}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: '6px 0 4px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#0D3C5C',
                      lineHeight: '1.4'
                    }}
                  >
                    {activeAlert.title}
                  </h3>

                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    المعرف: <strong style={{ color: '#334155' }}>{activeAlert.id}</strong>
                  </div>
                </div>

                {/* Message Content Box */}
                <div
                  style={{
                    background: '#ffffff',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    lineHeight: '1.7',
                    color: '#334155'
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '11.5px',
                      marginBottom: '6px',
                      color: '#0D3C5C'
                    }}
                  >
                    محتوى الإشعار:
                  </div>
                  <div style={{ whiteSpace: 'pre-line', color: '#0f172a' }}>
                    {activeAlert.message}
                  </div>
                </div>

                {/* Database Metadata Box */}
                {activeAlert.details && Object.keys(activeAlert.details).length > 0 && (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px 16px'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '11.5px',
                        marginBottom: '10px',
                        color: '#0D3C5C'
                      }}
                    >
                      البيانات المرتبطة من قاعدة البيانات:
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '8px'
                      }}
                    >
                      {Object.entries(activeAlert.details).map(([k, v]) => (
                        <div
                          key={k}
                          style={{
                            background: '#f8fafc',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <span style={{ color: '#64748b', fontSize: '10px' }}>
                            {formatDetailKey(k)}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '11.5px' }}>
                            {formatDetailValue(k, v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 15px', color: '#64748b', fontSize: '11.5px' }}>
                حدد إشعارًا من القائمة الجانبية لعرض كامل محتواه
              </div>
            )}

            {/* Bottom Actions Bar */}
            {activeAlert && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div>
                  {activeAlert.type === 'system_notification' && activeAlert.db_id && (
                    <button
                      type="button"
                      className="btn ghost"
                      disabled={actionLoading}
                      onClick={() => handleDelete(activeAlert)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        color: '#64748b',
                        borderColor: '#e2e8f0'
                      }}
                    >
                      حذف الإشعار
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ padding: '5px 14px', fontSize: '11px', borderRadius: '6px' }}
                    onClick={onClose}
                  >
                    إغلاق
                  </button>

                  {/* If system notification: show "تعليم كمقروء" / "تمت القراءة" */}
                  {activeAlert.type === 'system_notification' && (
                    activeAlert.is_read ? (
                      <button
                        type="button"
                        className="btn ghost"
                        disabled
                        style={{
                          padding: '5px 14px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          background: '#f8fafc',
                          color: '#64748b',
                          borderColor: '#e2e8f0',
                          fontWeight: 600
                        }}
                      >
                        تمت القراءة
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn primary"
                        disabled={actionLoading}
                        onClick={() => handleMarkAsRead(activeAlert)}
                        style={{
                          padding: '5px 16px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          background: '#005D9C',
                          borderColor: '#005D9C',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        تعليم كمقروء
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function formatArabicDate(dateStr) {
  if (!dateStr) return 'اليوم';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now - d) / (1000 * 60 * 60);
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ar-JO', { month: 'numeric', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function formatDetailKey(key) {
  const map = {
    consultant_name: 'اسم المستشار',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    specialization: 'التخصص المعتمد',
    years: 'سنوات الخبرة',
    amount: 'المبلغ المطلوب',
    bank_name: 'اسم البنك',
    iban: 'رقم الآيبان IBAN',
    ticket_id: 'رقم التذكرة',
    subject: 'موضوع التذكرة',
    user_name: 'اسم صاحب الطلب',
    priority: 'مستوى الأولوية',
    status: 'حالة التذكرة',
    notification_type: 'تصنيف الإشعار',
    is_read: 'حالة القراءة',
    recipient_user_id: 'المستلم'
  };
  return map[key] || key;
}

function formatDetailValue(key, value) {
  if (value === null || value === undefined) return '—';

  // Boolean or Read status
  if (key === 'is_read') {
    if (value === true || value === 'true' || value === 'مقروء') return 'مقروء';
    if (value === false || value === 'false' || value === 'غير مقروء') return 'غير مقروء';
  }

  // Notification types
  if (key === 'notification_type') {
    const typeMap = {
      general: 'إشعار نظام عام',
      ticket_update: 'تحديث تذكرة دعم',
      credential_status_update: 'تحديث حالة الاعتماد',
      payout_status_update: 'تحديث التسوية المالية',
      role_assignment: 'تعديل الصلاحيات',
      appointment_reminder: 'تذكير بموعد الجلسة'
    };
    return typeMap[String(value).toLowerCase()] || String(value);
  }

  // Priority
  if (key === 'priority') {
    const pMap = {
      high: 'عاجل ومرتفع',
      urgent: 'طارئ وعاجل',
      medium: 'متوسط',
      low: 'عادي',
      normal: 'عادي'
    };
    return pMap[String(value).toLowerCase()] || String(value);
  }

  // Status
  if (key === 'status') {
    const sMap = {
      open: 'مفتوحة',
      in_progress: 'قيد المعالجة',
      resolved: 'تم الحل',
      closed: 'مغلقة'
    };
    return sMap[String(value).toLowerCase()] || String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'نعم' : 'لا';
  }

  return String(value);
}
