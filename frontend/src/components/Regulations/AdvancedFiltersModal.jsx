// frontend/src/components/Regulations/AdvancedFiltersModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import ModernDatePicker from '../ModernDatePicker/ModernDatePicker';
import ModernSelect from '../ModernSelect';
import FilterResetButton from '../FilterResetButton';

const STATUSES = ["الكل", "ساري", "معدل", "ملغى"];
const TYPES = ["الكل", "قانون", "نظام", "تعليمات", "قرارات", "أحكام قضائية", "أحكام تفسيرية", "نماذج"];

export default function AdvancedFiltersModal({ isOpen, onClose, filters, setFilters, onApply }) {
  if (!isOpen) return null;

  const handleStatusChange = (val) => {
    setFilters(prev => ({ ...prev, status: val }));
  };

  const handleTypeChange = (val) => {
    setFilters(prev => ({ ...prev, type: val }));
  };

  const handleReset = () => {
    setFilters({
      status: "الكل",
      type: "الكل",
      dateFrom: "",
      dateTo: ""
    });
  };

  return ReactDOM.createPortal(
    <div className="home-filter-backdrop" onClick={onClose}>
      <div
        className="home-filter-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.target.closest('.modern-date-picker-wrap')) {
            e.preventDefault();
            onApply();
          }
        }}
      >
        {/* Modal Header */}
        <div className="home-filter-head">
          <div>
            <strong>البحث المتقدم</strong>
            <small>حدد نطاق البحث ثم اكتب الكلمة أو المصطلح في شريط البحث</small>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilterResetButton
              onClick={handleReset}
              title="إعادة تعيين الفلاتر"
              size={32}
            />
            <button className="home-filter-close" onClick={onClose} title="إغلاق">×</button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="home-filter-body">
          {/* Legislation Status */}
          <div className="filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="filter-group-label" style={{ margin: 0 }}>حالة التشريع</label>
              <div style={{ width: '160px' }}>
                <ModernSelect
                  options={STATUSES.map(s => ({ value: s, label: s === 'الكل' ? 'كافة الحالات' : s }))}
                  value={filters.status || 'الكل'}
                  onChange={handleStatusChange}
                  placeholder="حالة التشريع"
                  dropdownWidth="160px"
                />
              </div>
            </div>
            <div className="filter-pills">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`filter-pill-btn ${(filters.status || 'الكل') === st ? 'active' : ''}`}
                  onClick={() => handleStatusChange(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Legislation Type */}
          <div className="filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="filter-group-label" style={{ margin: 0 }}>نوع التشريع</label>
              <div style={{ width: '180px' }}>
                <ModernSelect
                  options={TYPES.map(t => ({ value: t, label: t === 'الكل' ? 'كافة الأنواع' : t }))}
                  value={filters.type || 'الكل'}
                  onChange={handleTypeChange}
                  placeholder="نوع التشريع"
                  dropdownWidth="180px"
                />
              </div>
            </div>
            <div className="filter-pills">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`filter-pill-btn ${(filters.type || 'الكل') === t ? 'active' : ''}`}
                  onClick={() => handleTypeChange(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Time Period using ModernDatePicker */}
          <div className="filter-group">
            <label className="filter-group-label">الفترة الزمنية (السنة أو الشهر/السنة أو التاريخ الكامل - اليوم اختياري)</label>
            <div className="date-range-grid">
              <div>
                <ModernDatePicker
                  label="من تاريخ"
                  placement="top"
                  align="right"
                  value={filters.dateFrom || ''}
                  onChange={(val) => setFilters(prev => ({ ...prev, dateFrom: val }))}
                  placeholder="DD/MM/YYYY أو MM/YYYY أو YYYY"
                />
              </div>
              <div>
                <ModernDatePicker
                  label="إلى تاريخ"
                  placement="top"
                  align="left"
                  value={filters.dateTo || ''}
                  onChange={(val) => setFilters(prev => ({ ...prev, dateTo: val }))}
                  placeholder="DD/MM/YYYY أو MM/YYYY أو YYYY"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="home-filter-actions">
          <button type="button" className="filter-apply-btn" onClick={onApply}>
            تطبيق الفلتر
          </button>
          <button type="button" className="filter-reset-btn" onClick={handleReset}>
            إعادة تعيين
          </button>
          <FilterResetButton
            onClick={handleReset}
            title="إعادة تعيين الفلاتر"
            size={38}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
