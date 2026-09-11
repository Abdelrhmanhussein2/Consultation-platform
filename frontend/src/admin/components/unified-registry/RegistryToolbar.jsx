import React from 'react';

export default function RegistryToolbar({
  entriesPerPage,
  setEntriesPerPage,
  setCurrentPage,
  selectedModule,
  setSelectedModule,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  dateFilter,
  setDateFilter,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  handleExportCSV,
  handleResetFilters,
  onRefresh,
  openAdvancedFilter,
  filteredCount
}) {
  return (
    <>
      {/* Top Toolbar */}
      <div className="toolbar">
        <div className="toolbar-right entries">
          <select
            id="entries"
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>الكل (100)</option>
          </select>
          <span>سجل لكل صفحة</span>
        </div>

        <div className="toolbar-left">
          <button className="icon-btn light" onClick={handleExportCSV} aria-label="تصدير">
            <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
            <span className="tooltip">تصدير البيانات</span>
          </button>

          <button className="icon-btn light" onClick={handleResetFilters} aria-label="إعادة ضبط">
            <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            <span className="tooltip">إعادة ضبط</span>
          </button>

          <button className="icon-btn light" onClick={onRefresh} aria-label="تحديث">
            <svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0 2 5" /><path d="M20 4v7h-7" /></svg>
            <span className="tooltip">تحديث البيانات</span>
          </button>

          <button
            className={`icon-btn light ${viewMode === 'list' ? 'active-view' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="عرض قائمة"
          >
            <svg viewBox="0 0 24 24"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
            <span className="tooltip">عرض قائمة</span>
          </button>

          <button
            className={`icon-btn light ${viewMode === 'cards' ? 'active-view' : ''}`}
            onClick={() => setViewMode('cards')}
            aria-label="عرض بطاقات"
          >
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            <span className="tooltip">عرض بطاقات</span>
          </button>

          <input
            className="search"
            placeholder="بحث في السجلات..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Module Tabs */}
      <div className="tabs" id="moduleTabs">
        {[
          { key: 'الكل', label: 'الكل' },
          { key: 'مستخدم', label: 'المستخدمون' },
          { key: 'مستشار', label: 'المستشارون' },
          { key: 'استشارة', label: 'الاستشارات' },
          { key: 'تذكرة دعم', label: 'تذاكر الدعم' },
          { key: 'فاتورة', label: 'الفواتير' },
          { key: 'اعتماد', label: 'الاعتماد' },
          { key: 'أتمتة', label: 'الأتمتة' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${selectedModule === tab.key ? 'active' : ''}`}
            onClick={() => {
              setSelectedModule(tab.key);
              setCurrentPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Controls */}
      <div className="filters">
        <span className="filter-label">تصفية:</span>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="الكل">كل الحالات</option>
          <option value="نشط">نشط</option>
          <option value="مؤكدة">مؤكدة</option>
          <option value="مكتملة">مكتملة</option>
          <option value="مفتوحة">مفتوحة</option>
          <option value="معلقة">معلقة</option>
          <option value="تحتاج متابعة">تحتاج متابعة</option>
        </select>

        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="الكل">كل الأولويات</option>
          <option value="مرتفعة">مرتفعة</option>
          <option value="متوسطة">متوسطة</option>
          <option value="عادية">عادية</option>
        </select>

        <select
          className="filter-select"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
        >
          <option value="الكل">كل الفترات</option>
          <option value="اليوم">اليوم</option>
          <option value="هذا الأسبوع">هذا الأسبوع</option>
          <option value="هذا الشهر">هذا الشهر</option>
        </select>

        <button className="tab" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={openAdvancedFilter}>
          تصفية متقدمة
        </button>
      </div>

      {/* View Title */}
      <div className="view-title">
        <h3>{selectedModule === 'الكل' ? 'جميع السجلات الموحدة' : selectedModule}</h3>
        <span>{filteredCount} سجل مطابق</span>
      </div>
    </>
  );
}
