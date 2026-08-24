import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import ConsultantCard from '../components/Consultants/ConsultantCard';
import BookingModal from '../components/Consultants/BookingModal';
import { ConsultantsIcon, SearchIcon } from '../components/UserPortal/Icons';

export default function ConsultantsPage({ navigate }) {
  const { token } = useAuth();
  
  // Active Filter States
  const [consultants, setConsultants] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [commMethod, setCommMethod] = useState(''); // 'فيديو', 'محادثة', 'مكتوب'
  const [minRating, setMinRating] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Temporary Filter States (used in the popup modal)
  const [tempSpecId, setTempSpecId] = useState('');
  const [tempCommMethod, setTempCommMethod] = useState('');
  const [tempMinRating, setTempMinRating] = useState('');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');

  // Fetch consultants matching all active filters
  const fetchConsultantsData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedSpecId) filters.specialization_id = selectedSpecId;
      
      // Combine manual search keyword and communication method keyword
      let serviceKeyword = searchKeyword.trim();
      if (commMethod) {
        serviceKeyword = serviceKeyword ? `${serviceKeyword} ${commMethod}` : commMethod;
      }
      if (serviceKeyword) filters.service_name = serviceKeyword;
      
      if (minRating) filters.min_rating = parseFloat(minRating);
      if (minPrice) filters.min_price = parseFloat(minPrice);
      if (maxPrice) filters.max_price = parseFloat(maxPrice);

      const [consultantsData, specData] = await Promise.all([
        consultantService.getConsultants(filters, token),
        consultantService.getSpecializations()
      ]);

      setConsultants(Array.isArray(consultantsData) ? consultantsData : []);
      setSpecializations(Array.isArray(specData) ? specData : []);
    } catch (err) {
      console.error('Error loading consultants directory:', err);
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger refetch whenever active filters change
  useEffect(() => {
    fetchConsultantsData();
  }, [selectedSpecId, commMethod, minRating, minPrice, maxPrice, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConsultantsData();
  };

  // Open modal and sync temp states with active states
  const handleOpenFilters = () => {
    setTempSpecId(selectedSpecId);
    setTempCommMethod(commMethod);
    setTempMinRating(minRating);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setIsFilterModalOpen(true);
  };

  // Apply modal filters to active states
  const handleApplyFilters = () => {
    setSelectedSpecId(tempSpecId);
    setCommMethod(tempCommMethod);
    setMinRating(tempMinRating);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setIsFilterModalOpen(false);
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedSpecId('');
    setCommMethod('');
    setMinRating('');
    setMinPrice('');
    setMaxPrice('');
    setSearchKeyword('');
    setTempSpecId('');
    setTempCommMethod('');
    setTempMinRating('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setIsFilterModalOpen(false);
  };

  // Count of currently active filters
  const activeFiltersCount = [
    selectedSpecId,
    commMethod,
    minRating,
    minPrice,
    maxPrice
  ].filter(Boolean).length;

  return (
    <div className="fade-in" style={{ direction: 'rtl', textAlign: 'right' }}>
      
      {/* Title & Filters Banner */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#E5EFF5', padding: '10px', borderRadius: '12px', color: '#005D9C' }}>
          <ConsultantsIcon size={24} color="#005D9C" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
            دليل المستشارين الضريبيين المعتمدين
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            استعرض نخبة من أفضل الخبراء والمستشارين الضريبيين المعتمدين في الأردن وحجز جلسة استشارية مباشرة.
          </p>
        </div>
      </div>

      {/* Filter Options Bar */}
      <div
        style={{
          background: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          marginBottom: '28px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        {/* Keyword Search */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="البحث باسم المستشار أو الكلمة الدلالية..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '25px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
              color: '#FFFFFF',
              border: 'none',
              padding: '11px 22px',
              borderRadius: '25px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <SearchIcon size={16} color="#FFFFFF" />
            <span>بحث</span>
          </button>
        </form>

        {/* Filter Popup Trigger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleOpenFilters}
            style={{
              backgroundColor: activeFiltersCount > 0 ? '#E5EFF5' : '#FFFFFF',
              border: activeFiltersCount > 0 ? '1px solid #BAE6FD' : '1px solid #CBD5E1',
              color: activeFiltersCount > 0 ? '#005D9C' : '#475569',
              padding: '11px 22px',
              borderRadius: '25px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s'
            }}
          >
            <span>⚙️ خيارات التصفية</span>
            {activeFiltersCount > 0 && (
              <span style={{
                background: '#005D9C',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '800'
              }}>{activeFiltersCount}</span>
            )}
          </button>

          {/* Reset Filters text button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '6px 12px'
              }}
            >
              مسح التصفية
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Results Badge */}
      {!loading && (
        <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
          {consultants.length === 1 ? 'مستشار واحد متاح' : `${consultants.length} مستشار متاح`}
        </div>
      )}

      {/* Consultants Grid List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#005D9C' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px' }}>جاري تحميل دليل المستشارين...</p>
        </div>
      ) : consultants.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {consultants.map((c, index) => (
            <ConsultantCard
              key={c.profile_id || c.id || index}
              consultant={c}
              onBook={(consultantObj) => setSelectedConsultant(consultantObj)}
              onViewDetails={(id) => navigate && navigate(`/consultants/${id}`)}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            padding: '48px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            color: '#64748B',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ width: '56px', height: '56px', background: '#E5EFF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <ConsultantsIcon size={26} color="#005D9C" />
          </div>
          <h3 style={{ marginTop: '16px', color: '#1E293B' }}>لا يوجد مستشارون مطابقون لخيارات البحث حالياً</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>يرجى تجربة تغيير التخصص أو معايير التصفية.</p>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        consultant={selectedConsultant}
        isOpen={!!selectedConsultant}
        onClose={() => setSelectedConsultant(null)}
        onSuccess={() => navigate && navigate('/my-appointments')}
      />

      {/* Clean Filters Popup Modal */}
      {isFilterModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '450px',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setIsFilterModalOpen(false)}
              style={{
                position: 'absolute',
                left: '20px',
                top: '20px',
                border: 'none',
                background: '#F1F5F9',
                color: '#64748B',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700'
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0D3C5C', marginTop: 0, marginBottom: '22px' }}>
              خيارات التصفية
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
              
              {/* Specialization Select */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  التخصص الضريبي
                </label>
                <select
                  value={tempSpecId}
                  onChange={(e) => setTempSpecId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">جميع التخصصات</option>
                  {specializations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Communication Method selection tags */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  طريقة التواصل
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: '', label: 'الكل' },
                    { id: 'فيديو', label: 'فيديو' },
                    { id: 'محادثة', label: 'محادثة' },
                    { id: 'مكتوب', label: 'مكتوب' }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setTempCommMethod(method.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: tempCommMethod === method.id ? '1px solid #005D9C' : '1px solid #CBD5E1',
                        backgroundColor: tempCommMethod === method.id ? '#E5EFF5' : '#FFFFFF',
                        color: tempCommMethod === method.id ? '#005D9C' : '#475569',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Rating select */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  التقييم الأدنى
                </label>
                <select
                  value={tempMinRating}
                  onChange={(e) => setTempMinRating(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">جميع التقييمات</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5.0 نجوم)</option>
                  <option value="4">⭐⭐⭐⭐ (4.0 فما فوق)</option>
                  <option value="3">⭐⭐⭐ (3.0 فما فوق)</option>
                </select>
              </div>

              {/* Price range input boxes */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                  سعر الجلسة (د.أ)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="number"
                    value={tempMinPrice}
                    onChange={(e) => setTempMinPrice(e.target.value)}
                    placeholder="الحد الأدنى"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="number"
                    value={tempMaxPrice}
                    onChange={(e) => setTempMaxPrice(e.target.value)}
                    placeholder="الحد الأقصى"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleApplyFilters}
                style={{
                  backgroundColor: '#003C62',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                تطبيق التصفية
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setTempSpecId('');
                  setTempCommMethod('');
                  setTempMinRating('');
                  setTempMinPrice('');
                  setTempMaxPrice('');
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#64748B',
                  padding: '12px 20px',
                  borderRadius: '25px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                إعادة تعيين
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
