import React from 'react';

export default function RbacModal({ modalContent }) {
  if (!modalContent) return null;

  return (
    <div className="modalOverlay" onClick={() => modalContent.onCancel && modalContent.onCancel()}>
      <div className="modalCard" onClick={e => e.stopPropagation()}>
        <div className="modalHead">
          <h3>{modalContent.title}</h3>
        </div>
        <div className="modalBody">
          {modalContent.body}
        </div>
        <div className="modalFoot">
          {modalContent.cancelText && (
            <button className="btn" onClick={modalContent.onCancel}>
              {modalContent.cancelText}
            </button>
          )}
          {modalContent.confirmText && (
            <button 
              className={`btn ${modalContent.confirmClass || 'primary'}`}
              onClick={modalContent.onConfirm}
            >
              {modalContent.confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
