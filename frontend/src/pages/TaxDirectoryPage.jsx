// frontend/src/pages/TaxDirectoryPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../components/TaxDirectory/taxDirectory.css';
import TaxDirectoryStats from '../components/TaxDirectory/TaxDirectoryStats';
import TaxDirectoryToolbar from '../components/TaxDirectory/TaxDirectoryToolbar';
import TaxDirectoryTable from '../components/TaxDirectory/TaxDirectoryTable';
import TaxDirectoryPagination from '../components/TaxDirectory/TaxDirectoryPagination';
import TaxDirectoryModal from '../components/TaxDirectory/TaxDirectoryModal';
import TaxDirectoryRecordModal from '../components/TaxDirectory/TaxDirectoryRecordModal';
import ConfirmModal from '../components/ConfirmModal';

const PAGE_SIZE = 15;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapRecord = (r) => ({ id: r.id, name: r.name, tax: r.tax_number, tax_number: r.tax_number, type: r.entity_type, entity_type: r.entity_type, is_active: r.is_active });

export default function TaxDirectoryPage({ isAdmin = false }) {
  const isEffectiveAdmin =
    isAdmin || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  const [recordsList, setRecordsList] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRecord, setActiveRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const showNotification = useCallback((msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/tax-directory/stats', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.categories) setAvailableTypes(data.categories);
      }
    } catch {}
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: String(PAGE_SIZE)
      });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedType && selectedType !== 'الكل') params.set('entity_type', selectedType);

      const res = await fetch(`/api/tax-directory/?${params.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('فشل جلب البيانات');
      const data = await res.json();
      setRecordsList(Array.isArray(data.items) ? data.items.map(mapRecord) : []);
      setTotalRecords(data.total || 0);
    } catch {
      showNotification('تعذر تحميل بيانات الكشف الضريبي من الخادم');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedType, showNotification]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadRecords(); }, [loadRecords]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  const handleSaveRecord = async (recordData, isEdit) => {
    try {
      if (isEdit && editingRecord) {
        const res = await fetch(`/api/tax-directory/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ name: recordData.name, tax_number: recordData.tax, entity_type: recordData.type })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'فشل تحديث السجل');
        }
        showNotification('تم تحديث بيانات المكلف بنجاح');
      } else {
        const res = await fetch('/api/tax-directory/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ name: recordData.name, tax_number: recordData.tax, entity_type: recordData.type })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'فشل إضافة السجل');
        }
        showNotification('تمت إضافة المكلف بنجاح');
      }
      loadRecords();
      loadStats();
    } catch (err) {
      showNotification(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const executeDeleteRecord = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/tax-directory/${deleteTarget.id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('فشل الحذف');
      showNotification('تم حذف السجل من الكشف');
      loadRecords();
      loadStats();
    } catch (err) { showNotification(err.message || 'حدث خطأ أثناء الحذف'); }
    finally { setDeleteTarget(null); }
  };

  const handleImportFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      showNotification('جاري استيراد ومعالجة الملف...');
      const res = await fetch('/api/tax-directory/import', { method: 'POST', headers: getAuthHeaders(), body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'فشل استيراد الملف');
      }
      const data = await res.json();
      showNotification(data.message || 'تم الاستيراد بنجاح');
      loadRecords();
      loadStats();
    } catch (err) {
      showNotification(err.message || 'خطأ أثناء استيراد الملف');
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/tax-directory/export', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('فشل التصدير');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax_directory_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('تم تصدير الكشف إلى ملف CSV');
    } catch {
      showNotification('حدث خطأ أثناء التصدير');
    }
  };

  const handleCopyTax = async (tax) => {
    if (!tax) return showNotification('لا يوجد رقم ضريبي لنسخه');
    try {
      await navigator.clipboard.writeText(tax);
      showNotification('تم نسخ الرقم الضريبي');
    } catch {
      showNotification('تعذّر النسخ تلقائياً');
    }
  };

  return (
    <div className="td-shell">
      <div className="td-topbar">
        <div className="td-breadcrumb">
          <span>الرئيسية</span><span>/</span><span>النماذج الضريبية</span><span>/</span><b>الكشف الضريبي</b>
        </div>
        <div className="td-top-actions">
          <div className="td-top-chip"><span className="td-dot" aria-hidden="true" /><span>الكشف والبيانات الضريبية</span></div>
        </div>
      </div>
      <section className="td-hero">
        <div>
          <h1 className="td-title">مكتبة الكشف الضريبي</h1>
          <p className="td-desc">دليل مرجعي موحد للوصول إلى بيانات الجهات والأرقام الضريبية بدقة من قاعدة البيانات.</p>
        </div>
      </section>
      <TaxDirectoryStats totalCount={totalRecords} resultCount={recordsList.length} typeCount={availableTypes.length} />
      <section className="td-panel">
        <TaxDirectoryToolbar
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
          selectedType={selectedType}
          onTypeChange={(v) => { setSelectedType(v); setCurrentPage(1); }}
          availableTypes={availableTypes}
          totalFiltered={totalRecords}
          onReset={() => { setSearchQuery(''); setSelectedType(''); setCurrentPage(1); showNotification('تمت إعادة الضبط'); }}
          isAdmin={isEffectiveAdmin}
          onOpenAdd={() => { setEditingRecord(null); setIsRecordModalOpen(true); }}
          onImportCsv={handleImportFile}
          onExportCsv={handleExportCsv}
        />
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontWeight: 600 }}>
            جاري جلب بيانات الكشف الضريبي...
          </div>
        ) : (
          <TaxDirectoryTable
            items={recordsList}
            onSelectRecord={setActiveRecord}
            isAdmin={isEffectiveAdmin}
            onEditRecord={(r) => { setEditingRecord(r); setIsRecordModalOpen(true); }}
            onDeleteRecord={(r) => setDeleteTarget(r)}
          />
        )}
        <TaxDirectoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalRecords}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </section>
      {activeRecord && (
        <TaxDirectoryModal record={activeRecord} onClose={() => setActiveRecord(null)} onCopyTax={handleCopyTax} />
      )}
      {isEffectiveAdmin && (
        <TaxDirectoryRecordModal
          isOpen={isRecordModalOpen}
          initialRecord={editingRecord}
          availableTypes={availableTypes}
          onClose={() => { setIsRecordModalOpen(false); setEditingRecord(null); }}
          onSave={handleSaveRecord}
        />
      )}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="تأكيد حذف الجهة"
        message={`هل أنت متأكد من حذف جهة "${deleteTarget?.name}" من الكشف الضريبي نهائياً؟`}
        confirmText="حذف الجهة"
        onConfirm={executeDeleteRecord}
        onClose={() => setDeleteTarget(null)}
      />
      <div className={`td-toast ${showToast ? 'show' : ''}`} role="status">{toastMessage}</div>
    </div>
  );
}
