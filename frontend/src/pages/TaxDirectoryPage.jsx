// frontend/src/pages/TaxDirectoryPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import '../components/TaxDirectory/taxDirectory.css';
import { TAX_DIRECTORY_RECORDS } from '../components/TaxDirectory/taxDirectoryData';
import TaxDirectoryStats from '../components/TaxDirectory/TaxDirectoryStats';
import TaxDirectoryToolbar from '../components/TaxDirectory/TaxDirectoryToolbar';
import TaxDirectoryTable from '../components/TaxDirectory/TaxDirectoryTable';
import TaxDirectoryPagination from '../components/TaxDirectory/TaxDirectoryPagination';
import TaxDirectoryModal from '../components/TaxDirectory/TaxDirectoryModal';

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

export default function TaxDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRecord, setActiveRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const showNotification = useCallback((msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  }, []);

  // Sorted unique types for filter
  const availableTypes = useMemo(() => {
    const set = new Set(TAX_DIRECTORY_RECORDS.map((r) => r.type).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const q = normalizeArabic(searchQuery);
    return TAX_DIRECTORY_RECORDS.filter((r) => {
      const matchesType = !selectedType || r.type === selectedType;
      const matchesQuery =
        !q ||
        normalizeArabic([r.name, r.tax, r.type].join(' ')).includes(q);
      return matchesType && matchesQuery;
    });
  }, [searchQuery, selectedType]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (val) => {
    setSelectedType(val);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedType('');
    setCurrentPage(1);
    showNotification('تمت إعادة ضبط البحث والتصفية');
  };

  const handleCopyTax = async (tax) => {
    if (!tax) {
      showNotification('لا يوجد رقم ضريبي لنسخه');
      return;
    }
    try {
      await navigator.clipboard.writeText(tax);
      showNotification('تم نسخ الرقم الضريبي');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tax;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      showNotification(ok ? 'تم نسخ الرقم الضريبي' : 'تعذّر النسخ؛ انسخ الرقم يدوياً');
    }
  };

  const todayStr = useMemo(
    () =>
      new Date().toLocaleDateString('ar-JO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
    []
  );

  return (
    <div className="td-shell">
      {/* Top Bar with Breadcrumb and Actions */}
      <div className="td-topbar">
        <div className="td-breadcrumb">
          <span>الرئيسية</span>
          <span>/</span>
          <span>النماذج الضريبية</span>
          <span>/</span>
          <b>الكشف الضريبي</b>
        </div>
        <div className="td-top-actions">
          <div className="td-top-chip">
            <span className="td-dot" aria-hidden="true" />
            <span>الكشف والبيانات الضريبية</span>
          </div>
          <div className="td-top-chip">
            <span>◷ {todayStr}</span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="td-hero">
        <div>
          <h1 className="td-title">الكشف الضريبي</h1>
          <p className="td-desc">دليل مرجعي موحد للوصول إلى بيانات الجهات والأرقام الضريبية والكشف الضريبي بدقة.</p>
        </div>
      </section>

      {/* Stats Section */}
      <TaxDirectoryStats
        totalCount={TAX_DIRECTORY_RECORDS.length}
        resultCount={filteredRecords.length}
        typeCount={availableTypes.length}
      />

      {/* Main Panel: Toolbar + Table + Pagination */}
      <section className="td-panel">
        <TaxDirectoryToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
          availableTypes={availableTypes}
          totalFiltered={filteredRecords.length}
          onReset={handleReset}
        />

        <TaxDirectoryTable
          items={paginatedItems}
          onSelectRecord={setActiveRecord}
        />

        <TaxDirectoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRecords.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* Footnote */}
      <div className="td-footnote">
        <span>●</span>
        <span>
          هذه الصفحة مرجعية للمعلومات المدرجة في ملف البيانات المعتمد، ويمكن استخدام البحث والتصفية لاستعراض السجلات.
        </span>
      </div>

      {/* Details Modal */}
      {activeRecord && (
        <TaxDirectoryModal
          record={activeRecord}
          onClose={() => setActiveRecord(null)}
          onCopyTax={handleCopyTax}
        />
      )}

      {/* Toast Notification */}
      <div className={`td-toast ${showToast ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>
    </div>
  );
}

