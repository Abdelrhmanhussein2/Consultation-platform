// frontend/src/components/Regulations/LegalReader/RelatedFilesGrid.jsx
import React from 'react';

export default function RelatedFilesGrid({ selectedFileId, onSelectFile, files }) {
  let pairs = [];
  if (Array.isArray(files) && files.length > 0) {
    for (let i = 0; i < files.length; i += 2) {
      pairs.push({
        right: files[i],
        left: files[i + 1] || null
      });
    }
  }

  if (pairs.length === 0) {
    return (
      <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
        لا توجد ملفات أو أحكام قضائية ذات صلة مسجلة لهذا القانون حالياً.
      </div>
    );
  }

  return (
    <div className="related-files-table-grid">
      {pairs.map((pair, rowIdx) => (
        <React.Fragment key={rowIdx}>
          {/* Right Column Item */}
          {pair.right && (
            <div
              className={`related-files-cell ${selectedFileId === pair.right.id ? 'active' : ''}`}
              onClick={() => onSelectFile && onSelectFile(pair.right)}
              title={pair.right.title}
            >
              <span>{pair.right.title}</span>
            </div>
          )}

          {/* Left Column Item */}
          {pair.left && pair.left !== pair.right && (
            <div
              className={`related-files-cell ${selectedFileId === pair.left.id ? 'active' : ''}`}
              onClick={() => onSelectFile && onSelectFile(pair.left)}
              title={pair.left.title}
            >
              <span>{pair.left.title}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

