import React from 'react';

const FileTextIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const DownloadIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const BookmarkIcon = ({ size = 16, filled = false, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

const EditIcon = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = ({ size = 16, color = '#DC2626' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function TaxFormCard({
  form,
  isFavorite = false,
  isAdmin = false,
  onDownload,
  onToggleFavorite,
  onEdit,
  onDelete
}) {
  return (
    <article className="tax-card">
      <div>
        <div className="tax-card-top">
          <div className="tax-card-icon-box" aria-hidden="true">
            <FileTextIcon size={20} color="#E58A13" />
          </div>
          <span className="tax-cat-badge">{form.cat}</span>
        </div>

        <h3 className="tax-card-title">{form.title}</h3>
        <p className="tax-card-desc">{form.desc}</p>

        <div className="tax-meta-badges">
          <span className="tax-meta-badge">{form.lang}</span>
          <span className="tax-meta-badge">{form.format}</span>
        </div>
      </div>

      <div className="tax-card-actions">
        <button
          type="button"
          className="tax-btn-download"
          onClick={() => onDownload(form)}
          title={`تحميل ${form.title}`}
        >
          <DownloadIcon size={15} color="#FFFFFF" />
          <span>تحميل</span>
        </button>

        <button
          type="button"
          className={`tax-btn-bookmark ${isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(form)}
          title={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
          aria-label={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
        >
          <BookmarkIcon
            size={16}
            filled={isFavorite}
            color={isFavorite ? '#E58A13' : '#64748B'}
          />
        </button>

        {isAdmin && onEdit && (
          <button
            type="button"
            className="tax-btn-edit"
            onClick={() => onEdit(form)}
            title="تعديل بيانات النموذج"
            aria-label="تعديل النموذج"
          >
            <EditIcon size={15} />
          </button>
        )}

        {isAdmin && onDelete && (
          <button
            type="button"
            className="tax-btn-delete"
            onClick={() => onDelete(form)}
            title="مسح / حذف النموذج"
            aria-label="مسح النموذج"
          >
            <TrashIcon size={16} />
          </button>
        )}
      </div>
    </article>
  );
}
