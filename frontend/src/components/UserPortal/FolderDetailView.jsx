import React, { useState, useRef } from 'react';
import { showDialog } from '../ConfirmModal/dialogManager';

const FolderIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const TrashIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const ExternalLinkIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const DownloadIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const UploadCloudIcon = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    <polyline points="16 16 12 12 8 16" />
  </svg>
);

const ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const FileDocIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ITEM_TYPE_LABELS = {
  regulation: 'تشريع',
  highlight: 'تحديد / ملاحظة',
  consultant: 'مستشار',
  template: 'نموذج',
  document: 'وثيقة',
};

const ITEM_TYPE_COLORS = {
  regulation: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
  highlight: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  consultant: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
  template: { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6' },
  document: { bg: 'rgba(245,165,42,0.1)', color: '#F5A52A' },
};

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  } catch { return '--'; }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileStyle = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', label: 'PDF' };
  if (['doc', 'docx', 'rtf'].includes(ext)) return { bg: 'rgba(37,99,235,0.1)', color: '#2563EB', label: 'DOC' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { bg: 'rgba(16,185,129,0.1)', color: '#10B981', label: 'XLS' };
  if (['ppt', 'pptx'].includes(ext)) return { bg: 'rgba(249,115,22,0.1)', color: '#F97316', label: 'PPT' };
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return { bg: 'rgba(168,85,247,0.1)', color: '#A855F7', label: 'IMG' };
  if (['zip', 'rar', '7z'].includes(ext)) return { bg: 'rgba(245,165,42,0.1)', color: '#F5A52A', label: 'ZIP' };
  return { bg: 'rgba(100,116,139,0.1)', color: '#64748B', label: ext?.toUpperCase() || 'FILE' };
};

export default function FolderDetailView({ folder, onBack, onDeleteItem, onFileAdded, onFileDeleted, token, showToast, navigate }) {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const files = folder.files || [];
  const items = folder.items || [];
  const totalCount = files.length + items.length;

  const handleUploadFile = async (file) => {
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('حجم الملف يتجاوز الحد المسموح (50 ميجابايت)', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`/api/folders/${folder.id}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.status === 201) {
        const data = await res.json();
        showToast('تم رفع الملف بنجاح إلى المجلد!', 'success');
        onFileAdded(data);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'فشل رفع الملف.', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم أثناء رفع الملف.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDeleteFile = async (file) => {
    const ok = await showDialog({
      title: 'حذف الملف',
      message: `هل أنت متأكد من حذف الملف "${file.original_filename}" من المجلد؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/folders/${folder.id}/files/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        showToast('تم حذف الملف بنجاح.', 'success');
        onFileDeleted(file.id);
      } else {
        showToast('فشل حذف الملف.', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    }
  };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '14px', fontWeight: '600', fontFamily: 'Tajawal, sans-serif', marginBottom: '20px', padding: 0 }}
      >
        <ChevronRightIcon />
        العودة إلى المجلدات
      </button>

      {/* Folder Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: folder.color || '#F5A52A', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <FolderIcon size={26} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>{folder.name}</h2>
            {folder.description && <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>{folder.description}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: '#F1F5F9', color: '#0D3C5C', fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px' }}>
            {totalCount} {totalCount === 1 ? 'عنصر / ملف' : 'عناصر وملفات'}
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              background: '#0D3C5C', color: '#FFFFFF', border: 'none', borderRadius: '12px',
              padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 2px 8px rgba(13,60,92,0.2)', opacity: uploading ? 0.7 : 1
            }}
          >
            <UploadCloudIcon size={18} color="#FFFFFF" />
            {uploading ? 'جاري الرفع...' : 'رفع ملف من الجهاز'}
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.svg,.zip,.rar"
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          background: isDragOver ? '#FEF6E9' : '#FFFFFF',
          border: isDragOver ? '2px dashed #F5A52A' : '2px dashed #CBD5E1',
          borderRadius: '16px',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          marginBottom: '28px',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <div style={{ background: isDragOver ? '#F5A52A' : '#F1F5F9', color: isDragOver ? '#FFFFFF' : '#0D3C5C', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
          <UploadCloudIcon size={24} color={isDragOver ? '#FFFFFF' : '#0D3C5C'} />
        </div>
        <div>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C' }}>
            {uploading ? 'جاري رفع الملف إلى المجلد...' : 'اسحب الملف هنا أو انقر لاختيار ملف من جهازك'}
          </span>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
            يدعم PDF، Word، Excel، الصور، والمستندات المضغوطة (الحد الأقصى 50 ميجابايت)
          </p>
        </div>
      </div>

      {/* Uploaded Files Section */}
      {files.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <FileDocIcon size={18} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
              الملفات المرفوعة من الجهاز ({files.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {files.map(f => {
              const fileStyle = getFileStyle(f.original_filename);
              return (
                <div
                  key={f.id}
                  style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = folder.color || '#F5A52A'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{ background: fileStyle.bg, color: fileStyle.color, width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>
                      {fileStyle.label}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.original_filename}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px' }}>
                        <span>{formatFileSize(f.file_size)}</span>
                        <span> · </span>
                        <span>{formatDate(f.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <a
                      href={f.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={f.original_filename}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0D3C5C', textDecoration: 'none' }}
                      title="تحميل / فتح الملف"
                    >
                      <DownloadIcon size={16} />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(f)}
                      style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}
                      title="حذف الملف"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform Items Section */}
      {items.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <FolderIcon size={18} color="#0D3C5C" />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
              العناصر المحفوظة من المنصة ({items.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = folder.color || '#F5A52A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: (ITEM_TYPE_COLORS[item.item_type] || ITEM_TYPE_COLORS.document).bg, color: (ITEM_TYPE_COLORS[item.item_type] || ITEM_TYPE_COLORS.document).color, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderIcon size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0D3C5C' }}>{item.title}</span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: '10px' }}>
                        {ITEM_TYPE_LABELS[item.item_type] || item.item_type}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                      {item.subtitle && <span>{item.subtitle} · </span>}
                      {formatDate(item.added_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (item.item_type === 'regulation' || item.item_type === 'highlight') navigate('/regulations');
                      else if (item.item_type === 'consultant') navigate(`/consultants/${item.item_id}`);
                      else if (item.item_type === 'template') navigate('/consultant/templates');
                      else if (item.item_type === 'document') navigate('/consultant/documents');
                    }}
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                    title="عرض"
                  >
                    <ExternalLinkIcon />
                  </button>
                  <button
                    onClick={() => onDeleteItem(folder.id, item)}
                    style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', width: '34px', height: '34px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}
                    title="إزالة"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && items.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '22vh', background: '#FFFFFF', borderRadius: '20px', border: '1.5px dashed #E2E8F0', padding: '36px', textAlign: 'center' }}>
          <FolderIcon size={44} color="#CBD5E1" />
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0D3C5C', margin: '14px 0 6px' }}>المجلد فارغ</h3>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '340px', lineHeight: '1.6', margin: 0 }}>
            يمكنك رفع أي ملف من جهازك مباشرة إلى هذا المجلد باستخدام منطقة الرفع أعلاه.
          </p>
        </div>
      )}
    </div>
  );
}
