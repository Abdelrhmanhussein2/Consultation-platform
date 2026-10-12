// frontend/src/components/Regulations/LegalReader/RelatedFilesGrid.jsx
import React from 'react';
import { RELATED_PAIRS } from './relatedFilesData';

export default function RelatedFilesGrid({ selectedFileId, onSelectFile, files }) {
  let pairs = RELATED_PAIRS;
  if (Array.isArray(files) && files.length > 0) {
    pairs = [];
    for (let i = 0; i < files.length; i += 2) {
      pairs.push({
        right: files[i],
        left: files[i + 1] || files[i]
      });
    }
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

