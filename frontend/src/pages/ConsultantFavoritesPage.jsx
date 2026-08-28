import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast/Toast';

export default function ConsultantFavoritesPage({ navigate }) {
  const { token } = useAuth();
  const { toast, showToast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/favorites/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data || []);
      } else {
        showToast('فشل في تحميل عناصر المفضلة.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [token]);

  const handleDelete = async (item) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا العنصر من المفضلة؟')) return;

    try {
      const res = await fetch(`/api/favorites/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 204) {
        showToast('تمت إزالة العنصر من المفضلة.', 'success');
        setFavorites(prev => prev.filter(f => f.id !== item.id));
      } else {
        showToast('فشل إزالة العنصر.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالخادم.', 'error');
    }
  };

  // Compute counts dynamically
  const counts = {
    regulation: favorites.filter(f => f.item_type === 'regulation').length,
    consultant: favorites.filter(f => f.item_type === 'consultant').length,
    template: favorites.filter(f => f.item_type === 'template').length,
    document: favorites.filter(f => f.item_type === 'document').length,
  };

  const getIcon = (type) => {
    switch (type) {
      case 'regulation':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'consultant':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'template':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
      case 'document':
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        );
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'regulation': return 'تشريع';
      case 'consultant': return 'مستشار';
      case 'template': return 'نموذج';
      case 'document': return 'وثيقة';
      default: return 'عنصر';
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return '2026/6/22';
    }
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif', color: '#1E293B', paddingBottom: '60px' }}>
      <Toast {...toast} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#EF4444',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>المفضلة</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            عناصرك المحفوظة من مختلف أنحاء المنصة.
          </p>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {['regulation', 'consultant', 'template', 'document'].map(type => (
          <div 
            key={type} 
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)'
            }}
          >
            <div>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#0D3C5C', display: 'block', lineHeight: '1.2' }}>
                {counts[type]}
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>
                {getLabel(type)}
              </span>
            </div>
            
            <div style={{
              backgroundColor: 'rgba(245, 165, 42, 0.08)',
              color: '#F5A52A',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {getIcon(type)}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '20vh', alignItems: 'center' }}>
          <span>جاري تحميل المفضلة...</span>
        </div>
      ) : favorites.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '30vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1.5px dashed #E2E8F0',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>❤️</div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', marginBottom: '8px' }}>لا توجد عناصر محفوظة</h2>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '350px', lineHeight: '1.5' }}>
            يمكنك حفظ التشريعات، المستشارين، أو النماذج إلى المفضلة للوصول السريع إليها لاحقاً.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {favorites.map(item => (
            <div 
              key={item.id} 
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)'; }}
            >
              {/* Right Side: Type Icon + Title Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Type Icon */}
                <div style={{
                  backgroundColor: 'rgba(245, 165, 42, 0.1)',
                  color: '#F5A52A',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(item.item_type)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
                      {item.title}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#64748B',
                      backgroundColor: '#F1F5F9',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {getLabel(item.item_type)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#64748B' }}>
                    {item.subtitle && <span>{item.subtitle}</span>}
                    {item.subtitle && <span style={{ color: '#CBD5E1' }}>|</span>}
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Left Side: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Share/View Button */}
                <button
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#1E293B'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                  onClick={() => {
                    if (item.item_type === 'consultant' || item.item_type === 'profile') {
                      navigate(`/consultants/${item.item_id}`);
                    } else if (item.item_type === 'template') {
                      navigate('/consultant/templates');
                    } else if (item.item_type === 'regulation') {
                      navigate('/regulations');
                    } else if (item.item_type === 'document') {
                      navigate('/consultant/documents');
                    } else {
                      showToast('جاري تحويلك للرابط المعني...', 'success');
                    }
                  }}
                  title="عرض التفاصيل"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>

                {/* Delete Button */}
                <button
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FEE2E2',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#EF4444',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#FEE2E2'; }}
                  onClick={() => handleDelete(item)}
                  title="إزالة من المفضلة"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      )}
    </div>
  );
}
