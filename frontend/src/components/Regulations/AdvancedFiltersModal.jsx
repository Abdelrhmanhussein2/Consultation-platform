import React from 'react';
import ReactDOM from 'react-dom';
import ModernDatePicker from '../ModernDatePicker/ModernDatePicker';

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
      <div className="home-filter-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="home-filter-head">
          <div>
            <strong>البحث المتقدم</strong>
            <small>حدد نطاق البحث ثم اكتب الكلمة أو المصطلح في شريط البحث</small>
          </div>
          <button className="home-filter-close" onClick={onClose} title="إغلاق">×</button>
        </div>

        {/* Modal Body */}
        <div className="home-filter-body">
          {/* Legislation Status */}
          <div className="filter-group">
            <label className="filter-group-label">حالة التشريع</label>
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
            <label className="filter-group-label">نوع التشريع</label>
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
            <label className="filter-group-label">الفترة الزمنية</label>
            <div className="date-range-grid">
              <div>
                <ModernDatePicker
                  label="من تاريخ"
                  value={filters.dateFrom || ''}
                  onChange={(val) => setFilters(prev => ({ ...prev, dateFrom: val }))}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div>
                <ModernDatePicker
                  label="إلى تاريخ"
                  value={filters.dateTo || ''}
                  onChange={(val) => setFilters(prev => ({ ...prev, dateTo: val }))}
                  placeholder="DD/MM/YYYY"
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
        </div>
      </div>
    </div>,
    document.body
  );
}
