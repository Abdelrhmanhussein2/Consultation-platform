// frontend/src/components/Regulations/AdvancedFiltersModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ModernDatePicker from '../ModernDatePicker/ModernDatePicker';
import ModernSelect from '../ModernSelect';
import FilterResetButton from '../FilterResetButton';
import { getLawDocTypes } from '../../services/legalService';

const STATUSES = ["الكل", "ساري", "معدل", "ملغي"];
const DEFAULT_TYPES = [
  "الكل",
  "نظام",
  "قرار",
  "تعليمات",
  "قانون",
  "حكم ملزم",
  "جدول",
  "ملحق",
  "تمييز حقوق",
  "تمييز جزاء",
  "قضاء دستوري",
  "قضاء إداري",
  "درجة أولى",
  "بداية حقوق"
];

const TYPE_NORM_MAP = {
  "الأنظمة": "نظام",
  "أنظمة": "نظام",
  "قرارات": "قرار",
  "أحكام ملزمة": "حكم ملزم",
  "جداول": "جدول",
  "ملاحق": "ملحق"
};

export default function AdvancedFiltersModal({ isOpen, onClose, filters, setFilters, onApply }) {
  const [types, setTypes] = useState(DEFAULT_TYPES);

  useEffect(() => {
    let isMounted = true;
    getLawDocTypes().then((res) => {
      if (isMounted && Array.isArray(res) && res.length > 0) {
        const normalized = res.map(t => TYPE_NORM_MAP[t] || t);
        const uniqueSet = new Set(["الكل", ...normalized]);
        // Preserve canonical order where possible
        const ordered = DEFAULT_TYPES.filter(t => uniqueSet.has(t));
        uniqueSet.forEach(t => {
          if (!ordered.includes(t)) ordered.push(t);
        });
        setTypes(ordered);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

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
                  options={types.map(t => ({ value: t, label: t === 'الكل' ? 'كافة الأنواع' : t }))}
                  value={filters.type || 'الكل'}
                  onChange={handleTypeChange}
                  placeholder="نوع التشريع"
                  dropdownWidth="180px"
                />
              </div>
            </div>
            <div className="filter-pills">
              {types.map((t) => (
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
                  placement="top"
                  align="right"
                  value={filters.dateFrom || ''}
                  onChange={(val) => setFilters(prev => ({ ...prev, dateFrom: val }))}
                  placeholder="اختر التاريخ..."
                />
              </div>
              <div>
                <ModernDatePicker
                  label="إلى تاريخ"
                  placement="top"
                  align="left"
                  value={filters.dateTo || ''}
                  onChange={(val) => setFilters(prev => ({ ...prev, dateTo: val }))}
                  placeholder="اختر التاريخ..."
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
