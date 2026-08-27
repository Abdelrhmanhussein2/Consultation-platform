import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ConsultantDocumentsPage() {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!previewDoc) {
      setPreviewText('');
      return;
    }
    const filenameParts = previewDoc.filename.split('.');
    const ext = filenameParts.length > 1 ? filenameParts.pop().toLowerCase() : '';
    if (['csv', 'txt', 'json'].includes(ext)) {
      setLoadingText(true);
      fetch(previewDoc.file_path)
        .then(res => res.ok ? res.text() : 'فشل في تحميل محتوى الملف.')
        .then(text => {
          setPreviewText(text);
          setLoadingText(false);
        })
        .catch(() => {
          setPreviewText('خطأ أثناء تحميل محتوى الملف.');
          setLoadingText(false);
        });
    }
  }, [previewDoc]);

  const fetchDocuments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user-documents/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
      }
    } catch (err) {
      showToast('خطأ في جلب المستندات.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('حجم الملف يجب أن لا يتجاوز 20 ميجابايت', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/user-documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        showToast('تم الحفظ بنجاح!', 'success');
        fetchDocuments();
      } else {
        const errorData = await res.json();
        showToast(errorData.detail || 'فشل رفع المستند.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستند نهائياً؟')) return;

    try {
      const res = await fetch(`/api/user-documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 204) {
        showToast('تم حذف المستند بنجاح.', 'success');
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        showToast('فشل حذف المستند.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '40px' }}>
      <Toast {...toast} />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245, 165, 42, 0.2)'
          }}>
            <span style={{ fontSize: '20px', color: '#FFFFFF' }}>📁</span>
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
              وثائقي
            </h1>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
              مكتبتك الشخصية الآمنة لجميع المستندات المهمة.
            </p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          disabled={uploading}
          style={{
            background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 22px',
            borderRadius: '25px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: uploading ? 'default' : 'pointer',
            fontFamily: 'Tajawal, sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(245,165,42,0.3)',
            opacity: uploading ? 0.7 : 1
          }}
        >
          <span>📤</span> {uploading ? 'جاري الرفع...' : 'رفع مستند'}
        </button>
      </div>

      {/* Folders Section */}
      <div style={{ marginBottom: '24px' }}>
        {filteredDocs.length > 0 ? (
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Folder: أوراق رسمية */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1.5px solid #F1F5F9',
              padding: '20px 24px',
              width: '180px',
              boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              {/* Folder Icon */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#EFF6FF',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginBottom: '12px'
              }}>
                📁
              </div>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#0D3C5C' }}>أوراق رسمية</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                {filteredDocs.length} {filteredDocs.length === 1 ? 'مستند' : 'مستندات'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1.5px solid #F1F5F9',
            padding: '24px',
            textAlign: 'center',
            color: '#64748B',
            fontSize: '13px',
            boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
          }}>
            لا توجد مجلدات بعد. ارفع مستندك الأول.
          </div>
        )}
      </div>

      {/* Search Input bar */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="ابحث في مستنداتك..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 44px 14px 16px',
            borderRadius: '12px',
            border: '1.5px solid #E2E8F0',
            fontSize: '13px',
            fontFamily: 'Tajawal, sans-serif',
            outline: 'none',
            color: '#374151',
            boxSizing: 'border-box'
          }}
        />
        <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#94A3B8' }}>🔍</span>
      </div>

      {/* All Documents list Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #F1F5F9',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(13, 60, 92, 0.02)'
      }}>
        <h3 style={{ fontWeight: '800', color: '#0D3C5C', fontSize: '15px', margin: '0 0 20px 0' }}>
          جميع المستندات
        </h3>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#0D3C5C' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2.5px solid #E2E8F0',
              borderTopColor: '#F5A52A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px auto'
            }} />
            جاري تحميل المستندات...
            <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
          </div>
        ) : filteredDocs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #F1F5F9',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
              >
                {/* Right side: File details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* File Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#FFFBEB',
                    color: '#F5A52A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0
                  }}>
                    📄
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#0D3C5C' }}>
                      {doc.filename}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Badge: أوراق رسمية */}
                      <span style={{
                        background: '#EFF6FF',
                        color: '#1E40AF',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800'
                      }}>
                        أوراق رسمية
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {new Date(doc.created_at).toLocaleDateString('zh-Hans-CN')} · {formatBytes(doc.file_size)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left side: Options */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* View Option */}
                  <button
                    onClick={(e) => { e.preventDefault(); setPreviewDoc(doc); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                    title="عرض المستند"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>

                  {/* Download Option */}
                  <a
                    href={doc.file_path}
                    download
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                    title="تحميل الملف"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </a>

                  {/* Delete Option */}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                    title="حذف الملف"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
            لا توجد مستندات مطابقة.
          </div>
        )}
      </div>

      {/* Preview Document Modal */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          direction: 'rtl'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0D3C5C' }}>
                  معاينة المستند
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                  {previewDoc.filename} ({formatBytes(previewDoc.file_size)})
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC' }}>
              {(() => {
                const ext = previewDoc.filename.split('.').pop().toLowerCase();
                
                if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
                  return (
                    <img
                      src={previewDoc.file_path}
                      alt={previewDoc.filename}
                      style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    />
                  );
                }

                if (ext === 'pdf') {
                  return (
                    <iframe
                      src={previewDoc.file_path}
                      title={previewDoc.filename}
                      width="100%"
                      height="500px"
                      style={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                    />
                  );
                }

                if (['csv', 'txt', 'json'].includes(ext)) {
                  return loadingText ? (
                    <div style={{ color: '#0D3C5C', fontWeight: 'bold' }}>جاري تحميل محتوى الملف...</div>
                  ) : (
                    <pre style={{
                      direction: 'ltr',
                      textAlign: 'left',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      padding: '16px',
                      borderRadius: '8px',
                      overflowX: 'auto',
                      width: '100%',
                      maxHeight: '500px',
                      fontSize: '12px',
                      margin: 0,
                      fontFamily: 'Courier New, monospace',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {previewText}
                    </pre>
                  );
                }

                // Fallback for non-previewable files (docx, xlsx, etc)
                return (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📄</span>
                    <div style={{ fontWeight: '800', color: '#0D3C5C', fontSize: '14px', marginBottom: '8px' }}>
                      هذا الملف لا يدعم المعاينة المباشرة
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '20px' }}>
                      صيغ الملفات مثل (Word و Excel) لا يمكن للمتصفح عرضها مباشرة. يمكنك تحميل الملف لفتحه.
                    </div>
                    <a
                      href={previewDoc.file_path}
                      download
                      style={{
                        display: 'inline-block',
                        background: '#0D3C5C',
                        color: '#FFFFFF',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '800',
                        fontSize: '12px'
                      }}
                    >
                      تحميل الملف الآن
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '12px'
            }}>
              <a
                href={previewDoc.file_path}
                download
                style={{
                  background: '#0D3C5C',
                  color: '#FFFFFF',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '800'
                }}
              >
                تحميل
              </a>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '800'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
