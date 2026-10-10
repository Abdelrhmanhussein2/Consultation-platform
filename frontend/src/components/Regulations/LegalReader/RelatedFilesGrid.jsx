// frontend/src/components/Regulations/LegalReader/RelatedFilesGrid.jsx
import React from 'react';
import { RELATED_PAIRS } from './relatedFilesData';

export default function RelatedFilesGrid({ selectedFileId, onSelectFile }) {
  return (
    <div className="related-files-table-grid">
      {RELATED_PAIRS.map((pair, rowIdx) => (
        <React.Fragment key={rowIdx}>
          {/* Right Column Item */}
          <div
            className={`related-files-cell ${selectedFileId === pair.right.id ? 'active' : ''}`}
            onClick={() => onSelectFile && onSelectFile(pair.right)}
            title={pair.right.title}
          >
            <span>{pair.right.title}</span>
          </div>

          {/* Left Column Item */}
          <div
            className={`related-files-cell ${selectedFileId === pair.left.id ? 'active' : ''}`}
            onClick={() => onSelectFile && onSelectFile(pair.left)}
            title={pair.left.title}
          >
            <span>{pair.left.title}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
