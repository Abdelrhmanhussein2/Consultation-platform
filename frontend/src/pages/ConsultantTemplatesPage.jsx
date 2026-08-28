import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ConsultantTemplatesPage() {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const categories = ['الكل', 'ضريبة الدخل', 'ضريبة المبيعات', 'العقود', 'العمل والضمان'];

  const fetchTemplates = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/templates/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      } else {
        showToast('فشل في تحميل النماذج الرسمية.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/favorites/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data || []);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  const handleToggleFavorite = async (template) => {
    if (!token) return;
    try {
      const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_type: 'template',
          item_id: String(template.id),
          title: template.title,
          subtitle: template.category
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.status === 'added') {
          showToast('تمت الإضافة للمفضلة!', 'success');
          setFavorites(prev => [...prev, { id: result.id, item_type: 'template', item_id: String(template.id) }]);
        } else {
          showToast('تمت الإزالة من المفضلة.', 'success');
          setFavorites(prev => prev.filter(f => f.item_id !== String(template.id)));
        }
      } else {
        showToast('فشل في تعديل المفضلة.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchFavorites();
  }, [token]);

  // Frontend filtering logic
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.code && t.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'الكل' || t.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatBytes = (bytes) => {
    if (!bytes) return '---';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '60px' }}>
      <Toast {...toast} />

      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(245, 165, 42, 0.2)'
        }}>
          {/* Document icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
            النماذج
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            مكتبة شاملة من النماذج والعقود والإقرارات الرسمية الجاهزة للاستخدام.
          </p>
        </div>
      </div>

      {/* Search Input and Filters Bar */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        marginBottom: '28px',
        backgroundColor: '#FFFFFF',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="ابحث عن نموذج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 16px',
              borderRadius: '24px',
              border: '1px solid #CBD5E1',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: 'Tajawal, sans-serif'
            }}
            onFocus={(e) => e.target.style.borderColor = '#F5A52A'}
            onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
          />
          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>

        {/* Filter categories */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                fontFamily: 'Tajawal, sans-serif',
                transition: 'all 0.2s',
                backgroundColor: selectedCategory === cat ? '#F5A52A' : '#F1F5F9',
                color: selectedCategory === cat ? '#FFFFFF' : '#475569',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid / Empty State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
          <div style={{
            border: '4px solid #F3F3F3',
            borderTop: '4px solid #F5A52A',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            marginBottom: '12px'
          }}></div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '600' }}>جاري تحميل النماذج...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : filteredTemplates.length === 0 ? (
        /* PREMIUM EMPTY STATE */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1.5px dashed #E2E8F0',
          boxShadow: '0 4px 20px rgba(13, 60, 92, 0.02)'
        }}>
          {/* Animated SVG illustration of empty box/documents */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 165, 42, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            color: '#F5A52A'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
          
          <h2 style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#0D3C5C',
            marginBottom: '10px'
          }}>
            {templates.length === 0 ? 'المكتبة فارغة حالياً' : 'لم يتم العثور على نتائج'}
          </h2>
          
          <p style={{
            fontSize: '14px',
            color: '#64748B',
            maxWidth: '450px',
            lineHeight: '1.6',
            margin: '0 auto 16px'
          }}>
            {templates.length === 0 
              ? 'لم يتم رفع أي نماذج أو عقود رسمية بعد. سيقوم مدير النظام بإضافتها قريباً لتتمكن من تحميلها واستخدامها.' 
              : 'لم نجد أي نموذج يطابق معايير البحث أو التصنيف المحدد. حاول تغيير كلمات البحث أو اختيار قسم آخر.'}
          </p>
          
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#F5A52A',
            backgroundColor: 'rgba(245, 165, 42, 0.08)',
            padding: '6px 16px',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            {templates.length === 0 ? 'بانتظار رفع النماذج من الإدارة' : 'ابحث مجدداً'}
          </div>
        </div>
      ) : (
        /* GRID OF CARD ITEMS */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredTemplates.map(t => (
            <div 
              key={t.id} 
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.006)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(13, 60, 92, 0.08), 0 4px 6px -2px rgba(13, 60, 92, 0.03)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.006)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Category tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#005D9C',
                  backgroundColor: '#E5EFF5',
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  {t.category}
                </span>

                {/* Form icon background */}
                <div style={{
                  backgroundColor: 'rgba(245, 165, 42, 0.1)',
                  color: '#F5A52A',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              </div>

              {/* Title & Code */}
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: '0 0 6px 0', lineHeight: '1.5' }}>
                  {t.title}
                </h3>
                {t.code && (
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', display: 'block', marginBottom: '8px' }}>
                    {t.code}
                  </span>
                )}
                {t.description && (
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.6' }}>
                    {t.description}
                  </p>
                )}
              </div>

              {/* Badges & Meta info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {/* File Type Badge */}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#475569',
                    backgroundColor: '#F1F5F9',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {t.file_type}
                  </span>
                  
                  {/* File size if available */}
                  {t.file_size && (
                    <span style={{
                      fontSize: '11px',
                      color: '#64748B',
                      padding: '3px 0'
                    }}>
                      ({formatBytes(t.file_size)})
                    </span>
                  )}
                </div>

                {/* Language Badge */}
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#475569',
                  backgroundColor: '#F1F5F9',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  {t.language}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
                {/* Favorite Bookmark */}
                {(() => {
                  const isFav = favorites.some(f => f.item_id === String(t.id));
                  return (
                    <button
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: isFav ? '1.5px solid #F5A52A' : '1px solid #E2E8F0',
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isFav ? '#F5A52A' : '#64748B',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#F5A52A';
                        e.currentTarget.style.color = '#F5A52A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isFav ? '#F5A52A' : '#E2E8F0';
                        e.currentTarget.style.color = isFav ? '#F5A52A' : '#64748B';
                      }}
                      onClick={() => handleToggleFavorite(t)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill={isFav ? "#F5A52A" : "none"} />
                      </svg>
                    </button>
                  );
                })()}

                {/* Download Button */}
                <a
                  href={t.file_path}
                  download={t.title + '.' + t.file_path.split('.').pop()}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #F5A52A, #E08A00)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(245, 165, 42, 0.15)',
                    height: '42px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>تحميل</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
