// frontend/src/components/TaxDirectory/TaxDirectoryPagination.jsx
import React from 'react';

const ChevronRightIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ChevronLeftIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function TaxDirectoryPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) {
  const fmt = (num) => new Intl.NumberFormat('en-US').format(num);

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const pageNumbers = [];
  for (let n = 1; n <= totalPages; n++) {
    if (totalPages <= 5 || n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1) {
      pageNumbers.push(n);
    } else if (pageNumbers[pageNumbers.length - 1] !== '…') {
      pageNumbers.push('…');
    }
  }

  return (
    <div className="td-table-foot">
      <div>
        {totalItems > 0 ? `عرض ${fmt(start)}–${fmt(end)} من ${fmt(totalItems)} سجل` : 'عرض 0 من 0 سجل'}
      </div>

      {totalPages > 1 && (
        <div className="td-pagination" role="navigation" aria-label="ترقيم الصفحات">
          <button
            type="button"
            className="td-page-btn"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="الصفحة السابقة"
            title="الصفحة السابقة"
          >
            <ChevronRightIcon size={14} />
          </button>

          {pageNumbers.map((num, idx) =>
            num === '…' ? (
              <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#8797A2' }}>
                …
              </span>
            ) : (
              <button
                key={num}
                type="button"
                className={`td-page-btn ${num === currentPage ? 'active' : ''}`}
                onClick={() => onPageChange(num)}
              >
                {num}
              </button>
            )
          )}

          <button
            type="button"
            className="td-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="الصفحة التالية"
            title="الصفحة التالية"
          >
            <ChevronLeftIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

