// frontend/src/pages/TaxDirectoryPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import '../components/TaxDirectory/taxDirectory.css';
import { TAX_DIRECTORY_RECORDS } from '../components/TaxDirectory/taxDirectoryData';
import TaxDirectoryStats from '../components/TaxDirectory/TaxDirectoryStats';
import TaxDirectoryToolbar from '../components/TaxDirectory/TaxDirectoryToolbar';
import TaxDirectoryTable from '../components/TaxDirectory/TaxDirectoryTable';
import TaxDirectoryPagination from '../components/TaxDirectory/TaxDirectoryPagination';
import TaxDirectoryModal from '../components/TaxDirectory/TaxDirectoryModal';
import TaxDirectoryRecordModal from '../components/TaxDirectory/TaxDirectoryRecordModal';

const PAGE_SIZE = 10;

const normalizeArabic = (str) =>
  String(str ?? '')
    .toLocaleLowerCase('ar')
    .normalize('NFD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();

export default function TaxDirectoryPage({ isAdmin = false }) {
  const isEffectiveAdmin =
    isAdmin || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  const [recordsList, setRecordsList] = useState(TAX_DIRECTORY_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRecord, setActiveRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const showNotification = useCallback((msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  }, []);

  const availableTypes = useMemo(() => {
    const set = new Set(recordsList.map((r) => r.type).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [recordsList]);

  const filteredRecords = useMemo(() => {
    const q = normalizeArabic(searchQuery);
    return recordsList.filter((r) => {
      const matchesType = !selectedType || r.type === selectedType;
      const matchesQuery =
        !q || normalizeArabic([r.name, r.tax, r.type].join(' ')).includes(q);
      return matchesType && matchesQuery;
    });
  }, [recordsList, searchQuery, selectedType]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const handleSaveRecord = (recordData, isEdit) => {
    if (isEdit && editingRecord) {
      setRecordsList((prev) =>
        prev.map((r) => (r.tax === editingRecord.tax && r.name === editingRecord.name ? recordData : r))
      );
      showNotification('تم تحديث بيانات المكلف بنجاح');
    } else {
      setRecordsList((prev) => [recordData, ...prev]);
      showNotification('تمت إضافة المكلف بنجاح');
    }
  };

  const handleDeleteRecord = (record) => {
    setRecordsList((prev) => prev.filter((r) => !(r.tax === record.tax && r.name === record.name)));
    showNotification('تم حذف السجل من الكشف');
  };

  const handleImportCsv = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = (e.target.result || '').split(/\r?\n/).filter(Boolean);
        const imported = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || (i === 0 && line.includes('الرقم الضريبي'))) continue;
          const parts = line.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 3) imported.push({ type: parts[0], name: parts[1], tax: parts[2] });
        }
        if (imported.length > 0) {
          setRecordsList((prev) => [...imported, ...prev]);
          showNotification(`تم استيراد ${imported.length} سجل بنجاح`);
        } else {
          showNotification('لم يتم العثور على سجلات صالحة');
        }
      } catch {
        showNotification('حدث خطأ أثناء قراءة الملف');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleExportCsv = () => {
    const header = 'نوع المكلف,اسم,الرقم الضريبي\n';
    const rows = recordsList.map((r) => `"${r.type || ''}","${r.name || ''}","${r.tax || ''}"`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('تم تصدير الكشف إلى ملف CSV');
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
          <p className="td-desc">دليل مرجعي موحد للوصول إلى بيانات الجهات والأرقام الضريبية بدقة.</p>
        </div>
      </section>

      <TaxDirectoryStats totalCount={recordsList.length} resultCount={filteredRecords.length} typeCount={availableTypes.length} />

      <section className="td-panel">
        <TaxDirectoryToolbar
          searchQuery={searchQuery}
          onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
          selectedType={selectedType}
          onTypeChange={(v) => { setSelectedType(v); setCurrentPage(1); }}
          availableTypes={availableTypes}
          totalFiltered={filteredRecords.length}
          onReset={() => { setSearchQuery(''); setSelectedType(''); setCurrentPage(1); showNotification('تمت إعادة الضبط'); }}
          isAdmin={isEffectiveAdmin}
          onOpenAdd={() => { setEditingRecord(null); setIsRecordModalOpen(true); }}
          onImportCsv={handleImportCsv}
          onExportCsv={handleExportCsv}
        />

        <TaxDirectoryTable
          items={paginatedItems}
          onSelectRecord={setActiveRecord}
          isAdmin={isEffectiveAdmin}
          onEditRecord={(r) => { setEditingRecord(r); setIsRecordModalOpen(true); }}
          onDeleteRecord={handleDeleteRecord}
        />

        <TaxDirectoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRecords.length}
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

      <div className={`td-toast ${showToast ? 'show' : ''}`} role="status">{toastMessage}</div>
    </div>
  );
}
