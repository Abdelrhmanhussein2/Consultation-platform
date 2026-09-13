import React from 'react';
import ModernSelect from '../../../components/ModernSelect';
import FilterResetButton from '../../../components/FilterResetButton';

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
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div className="toolbar-right entries" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '130px' }}>
            <ModernSelect
              options={[
                { value: 10, label: '10 سجلات' },
                { value: 20, label: '20 سجل' },
                { value: 50, label: '50 سجل' },
                { value: 100, label: 'الكل (100)' }
              ]}
              value={entriesPerPage}
              onChange={(val) => {
                setEntriesPerPage(Number(val));
                setCurrentPage(1);
              }}
              placeholder="20 سجل"
            />
          </div>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>لكل صفحة</span>
        </div>

        <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          {/* 1. Search Bar with embedded icon */}
          <div style={{ position: 'relative', width: '220px' }}>
            <svg
              style={{
                position: 'absolute',
                right: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search"
              placeholder="بحث في السجلات..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                height: '38px',
                paddingRight: '34px',
                paddingLeft: '12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                fontSize: '12px',
                color: '#0F172A',
                outline: 'none',
                transition: 'all 0.18s ease'
              }}
            />
          </div>

          {/* 2. Segmented View Switcher (Pill Style) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '9px',
              padding: '2px',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="عرض قائمة"
              aria-label="عرض قائمة"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '7px',
                border: 'none',
                background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'list' ? '#005D9C' : '#64748B',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13" />
                <path d="M8 12h13" />
                <path d="M8 18h13" />
                <path d="M3 6h.01" />
                <path d="M3 12h.01" />
                <path d="M3 18h.01" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="عرض بطاقات"
              aria-label="عرض بطاقات"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '7px',
                border: 'none',
                background: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'cards' ? '#005D9C' : '#64748B',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
          </div>

          {/* 3. Action Buttons: Refresh, Reset, Export */}
          <button
            type="button"
            onClick={onRefresh}
            title="تحديث البيانات الحية"
            aria-label="تحديث البيانات"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#005D9C',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F0F7FD';
              e.currentTarget.style.borderColor = '#BAE6FD';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 11a8 8 0 1 0 2 5" />
              <path d="M20 4v7h-7" />
            </svg>
          </button>

          <FilterResetButton onClick={handleResetFilters} size={38} title="إعادة ضبط وتصفير الفلاتر" />

          <button
            type="button"
            onClick={handleExportCSV}
            title="تصدير البيانات إلى CSV"
            aria-label="تصدير البيانات"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#005D9C',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F0F7FD';
              e.currentTarget.style.borderColor = '#BAE6FD';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </button>
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

      {/* Filter Controls with ModernSelect */}
      <div className="filters" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span className="filter-label" style={{ fontWeight: 700, color: '#475569', fontSize: '11.5px' }}>تصفية:</span>

        <div style={{ width: '138px' }}>
          <ModernSelect
            options={[
              { value: 'الكل', label: 'كل الحالات' },
              { value: 'نشط', label: 'نشط' },
              { value: 'مؤكدة', label: 'مؤكدة' },
              { value: 'مكتملة', label: 'مكتملة' },
              { value: 'مفتوحة', label: 'مفتوحة' },
              { value: 'معلقة', label: 'معلقة' },
              { value: 'تحتاج متابعة', label: 'تحتاج متابعة' }
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            placeholder="كل الحالات"
          />
        </div>

        <div style={{ width: '130px' }}>
          <ModernSelect
            options={[
              { value: 'الكل', label: 'كل الأولويات' },
              { value: 'مرتفعة', label: 'مرتفعة' },
              { value: 'متوسطة', label: 'متوسطة' },
              { value: 'عادية', label: 'عادية' }
            ]}
            value={priorityFilter}
            onChange={(val) => {
              setPriorityFilter(val);
              setCurrentPage(1);
            }}
            placeholder="كل الأولويات"
          />
        </div>

        <div style={{ width: '130px' }}>
          <ModernSelect
            options={[
              { value: 'الكل', label: 'كل الفترات' },
              { value: 'اليوم', label: 'اليوم' },
              { value: 'هذا الأسبوع', label: 'هذا الأسبوع' },
              { value: 'هذا الشهر', label: 'هذا الشهر' }
            ]}
            value={dateFilter}
            onChange={(val) => {
              setDateFilter(val);
              setCurrentPage(1);
            }}
            placeholder="كل الفترات"
          />
        </div>

        <button className="tab" style={{ padding: '7px 14px', fontSize: '11.5px', height: '40px', display: 'flex', alignItems: 'center', borderRadius: '10px' }} onClick={openAdvancedFilter}>
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
