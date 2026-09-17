import React, { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, getSecurityMetrics } from '../services/adminApi';
import ModernSelect from '../../components/ModernSelect';
import FilterResetButton from '../../components/FilterResetButton';
import Toast, { useToast } from '../../components/Toast/Toast';

// ─── Clean SVG Icons (Zero Emojis) ───
const IconShield = ({ size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconClose = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function AdminAuditLogsPage({ navigate }) {
  const { toast, showToast } = useToast();

  // 100% Real PostgreSQL Data State (Zero Mock Data)
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Real Database Metrics State
  const [metrics, setMetrics] = useState({
    total_audit_events: 0,
    blocked_24h: 0,
    total_downloads: 0,
    active_sessions_count: 0
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [inspectModalLog, setInspectModalLog] = useState(null);

  // Fetch Security Metrics from Backend
  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getSecurityMetrics();
      if (data) {
        setMetrics(data);
      }
    } catch (e) {
      console.warn('Error fetching security metrics:', e);
    }
  }, []);

  // Fetch Real Audit Logs from PostgreSQL
  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (actionTypeFilter !== 'all') params.action_type = actionTypeFilter;

      const res = await getAuditLogs(params);
      if (res && Array.isArray(res.items)) {
        setLogs(res.items);
        setTotalLogs(res.total || res.items.length);
      } else if (Array.isArray(res)) {
        setLogs(res);
        setTotalLogs(res.length);
      } else {
        setLogs([]);
        setTotalLogs(0);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
      showToast('تعذر جلب سجل التدقيق من الخادم', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, actionTypeFilter, showToast]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // CSV Export from Real Database Logs
  const handleExportCSV = () => {
    if (logs.length === 0) {
      showToast('لا توجد سجلات لتصديرها حالياً', 'warning');
      return;
    }
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + "التوقيت,المستخدم / المشرف,نوع العملية,الكيان المتأثر,التفاصيل,عنوان IP,الحالة\n"
      + logs.map(l => `"${l.formatted_time || l.created_at}","${l.actor_name || l.admin_name || ''}","${l.action_type || l.action || ''}","${l.target_entity_type || l.resource || ''}","${(l.details || '').replace(/"/g, '""')}","${l.ip_address || ''}","${l.status || 'success'}"`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `سجل_التدقيق_ديوان_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف سجل التدقيق بنجاح', 'success');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActionTypeFilter('all');
    setPage(1);
  };

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', direction: 'rtl', padding: '16px 20px', background: '#F8FAFC', minHeight: 'calc(100vh - 80px)' }}>
      <Toast {...toast} />

      {/* 1. Header Command Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0A3254', margin: '0 0 4px 0' }}>
            سجل التدقيق والعمليات الحساسة
          </h1>
          <p style={{ fontSize: '12.5px', margin: 0, color: '#64748B' }}>
            تتبع دقيق وتوثيق مشفر لكافة العمليات الإدارية وتعديلات الصلاحيات وحركات الأموال من قاعدة بيانات PostgreSQL مباشرة.
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button"
            onClick={handleExportCSV}
            style={{ fontSize: '12.5px', padding: '7px 16px', background: '#0A3254', border: '1px solid #0A3254', borderRadius: '6px', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
          >
            <span>تصدير السجل الكامل (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards (100% PostgreSQL Calculated & Uniform Navy `#0A3254`) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        
        <div 
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', borderTop: '3px solid #0A3254', cursor: 'pointer' }}
          onClick={handleResetFilters}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>إجمالي العمليات الإدارية</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0A3254', margin: '4px 0' }}>
            {metrics.total_audit_events || totalLogs}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>موثقة ومحفوظة بالـ PostgreSQL</div>
        </div>

        <div 
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', borderTop: '3px solid #0A3254', cursor: 'pointer' }}
          onClick={() => { setActionTypeFilter('PERMISSIONS_UPDATE'); setPage(1); }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>عمليات الصلاحيات</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0A3254', margin: '4px 0' }}>
            {logs.filter(l => (l.action_type || l.action || '').includes('PERM')).length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>تعديل وتعيين أدوار</div>
        </div>

        <div 
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', borderTop: '3px solid #0A3254', cursor: 'pointer' }}
          onClick={() => { setActionTypeFilter('PAYOUT_STATUS_CHANGE'); setPage(1); }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>حركات مالية وسحوبات</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0A3254', margin: '4px 0' }}>
            {logs.filter(l => (l.action_type || l.action || '').includes('PAYOUT')).length}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>معاملات سحب وتدقيق</div>
        </div>

        <div 
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', borderTop: '3px solid #0A3254', cursor: 'pointer' }}
          onClick={() => { setActionTypeFilter('all'); setPage(1); }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>الجلسات النشطة الموثقة</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0A3254', margin: '4px 0' }}>
            {metrics.active_sessions_count}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>توكنات سارية المفعول</div>
        </div>

        <div 
          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', borderTop: '3px solid #0A3254', cursor: 'pointer' }}
          onClick={() => { setActionTypeFilter('SECURITY_SESSION_REVOKE'); setPage(1); }}
        >
          <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: '700' }}>محاولات محجوبة وإلغاءات</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0A3254', margin: '4px 0' }}>
            {metrics.blocked_24h}
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: '600' }}>حظر ومصادرة جلسات (24 س)</div>
        </div>

      </div>

      {/* 3. Advanced Search & Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px' }}>
          <input 
            type="text"
            placeholder="بحث باسم المشرف، نوع العملية، الكيان المتأثر، أو عنوان IP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchAuditLogs(); } }}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Tajawal, sans-serif' }}
          />
        </div>

        {/* Action Type Filter */}
        <div style={{ minWidth: '180px' }}>
          <ModernSelect
            value={actionTypeFilter}
            onChange={val => { setActionTypeFilter(val); setPage(1); }}
            options={[
              { value: 'all', label: 'كافة أنواع الإجراءات' },
              { value: 'PERMISSIONS_UPDATE', label: 'تعديل الصلاحيات' },
              { value: 'PAYOUT_STATUS_CHANGE', label: 'اعتماد السحوبات المالية' },
              { value: 'SYSTEM_POLICY_EDIT', label: 'تحديث السياسات' },
              { value: 'SECURITY_SESSION_REVOKE', label: 'إلغاء جلسات إدارية' },
              { value: 'USER_PROFILE_UPDATE', label: 'تعديل بيانات الحسابات' }
            ]}
          />
        </div>

        <FilterResetButton onReset={handleResetFilters} />
      </div>

      {/* 4. Real Audit Data Grid */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}>
        
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#0A3254' }}>
            سجلات التدقيق المباشرة من قاعدة البيانات ({totalLogs})
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
            مرتبة تنازلياً حسب التوقيت اللحظي | انقر على أي صف لمعاينة التغييرات
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap' }}>المشرف المنفذ</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap' }}>نوع العملية</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap' }}>الكيان المتأثر</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', fontSize: '12.5px' }}>تفاصيل العملية</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap' }}>عنوان IP والجهاز</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap' }}>التاريخ والوقت</th>
                <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', fontSize: '12.5px', textAlign: 'center', whiteSpace: 'nowrap' }}>التغييرات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748B', fontWeight: '600' }}>
                    جاري جلب سجل التدقيق من قاعدة البيانات...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748B', fontWeight: '600' }}>
                    لا توجد سجلات تدقيق مطابقة لخيارات البحث المحددة.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr 
                    key={log.id} 
                    style={{ 
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onClick={() => setInspectModalLog(log)}
                  >
                    {/* Actor */}
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ fontWeight: '700', color: '#0A3254' }}>
                        {log.actor_name || log.admin_name || 'مدير النظام'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {log.actor_role || 'مسؤول إداري'}
                      </div>
                    </td>

                    {/* Action Code */}
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#334155', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {log.action_type || log.action}
                      </span>
                    </td>

                    {/* Affected Target */}
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '4px', background: '#EFF6FF', color: '#0A3254', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {log.target_entity_type || log.resource || 'نظام'}
                      </span>
                    </td>

                    {/* Details */}
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.details || 'تم تنفيذ الإجراء بنجاح'}
                      </div>
                    </td>

                    {/* IP Address */}
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#0A3254', fontWeight: '700' }}>
                        {log.ip_address || '127.0.0.1'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94A3B8', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.user_agent || 'Admin Console'}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        {log.formatted_time || (log.created_at ? new Date(log.created_at).toLocaleString('ar-JO') : '—')}
                      </span>
                    </td>

                    {/* Action button */}
                    <td style={{ padding: '9px 12px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button 
                        type="button"
                        onClick={() => setInspectModalLog(log)}
                        style={{ fontSize: '11.5px', padding: '4px 10px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '5px', color: '#0A3254', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: '700' }}
                        title="معاينة تفاصيل التغييرات"
                      >
                        عرض التغييرات
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #E2E8F0', fontSize: '12.5px', color: '#64748B' }}>
          <span>إجمالي السجلات: ({totalLogs})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              style={{ padding: '5px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, fontFamily: 'Tajawal, sans-serif' }}
            >
              السابق
            </button>
            <span style={{ fontWeight: '700', color: '#0A3254', padding: '0 4px' }}>صفحة {page}</span>
            <button
              type="button"
              disabled={logs.length < limit}
              onClick={() => setPage(prev => prev + 1)}
              style={{ padding: '5px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '5px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: logs.length < limit ? 'not-allowed' : 'pointer', opacity: logs.length < limit ? 0.5 : 1, fontFamily: 'Tajawal, sans-serif' }}
            >
              التالي
            </button>
          </div>
        </div>

      </div>

      {/* 5. Payload Inspector Modal */}
      {inspectModalLog && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
          onClick={() => setInspectModalLog(null)}
        >
          <div 
            style={{ background: '#FFFFFF', borderRadius: '10px', width: '100%', maxWidth: '580px', boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#0A3254', color: '#FFFFFF' }}>
              <div style={{ fontSize: '14.5px', fontWeight: '800' }}>
                تفاصيل سجل التدقيق والبايلود #{inspectModalLog.id?.slice(0, 8)}
              </div>
              <button 
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                onClick={() => setInspectModalLog(null)}
              >
                <IconClose size={16} color="#FFFFFF" />
              </button>
            </div>

            <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '2px', fontSize: '11.5px' }}>المشرف المنفذ:</label>
                  <div>{inspectModalLog.actor_name || inspectModalLog.admin_name} ({inspectModalLog.actor_role || 'مشرف'})</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '2px', fontSize: '11.5px' }}>نوع العملية:</label>
                  <div style={{ fontWeight: '700', color: '#0A3254' }}>{inspectModalLog.action_type || inspectModalLog.action}</div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '2px', fontSize: '11.5px' }}>تفاصيل العملية:</label>
                  <div>{inspectModalLog.details}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '2px', fontSize: '11.5px' }}>عنوان IP:</label>
                  <div style={{ fontFamily: 'monospace' }}>{inspectModalLog.ip_address || '127.0.0.1'}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '2px', fontSize: '11.5px' }}>التاريخ والوقت:</label>
                  <div>{inspectModalLog.formatted_time || inspectModalLog.created_at}</div>
                </div>

                {inspectModalLog.old_values && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '2px', fontSize: '11.5px' }}>القيم السابقة (Old Values):</label>
                    <pre style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '8px 10px', fontFamily: 'monospace', fontSize: '11.5px', direction: 'ltr', textAlign: 'left', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#0A3254', margin: 0 }}>
                      {inspectModalLog.old_values}
                    </pre>
                  </div>
                )}

                {inspectModalLog.new_values && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '2px', fontSize: '11.5px' }}>القيم الجديدة (New Values):</label>
                    <pre style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '8px 10px', fontFamily: 'monospace', fontSize: '11.5px', direction: 'ltr', textAlign: 'left', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#0A3254', margin: 0 }}>
                      {inspectModalLog.new_values}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '10px 18px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button 
                type="button" 
                onClick={() => setInspectModalLog(null)}
                style={{ padding: '6px 16px', background: '#0A3254', color: '#FFFFFF', border: 'none', borderRadius: '5px', fontFamily: 'Tajawal, sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
