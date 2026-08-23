import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';
import ConsultantCard from '../components/Consultants/ConsultantCard';
import BookingModal from '../components/Consultants/BookingModal';
import { ConsultantsIcon, SearchIcon } from '../components/UserPortal/Icons';

export default function ConsultantsPage({ navigate }) {
  const { token } = useAuth();
  const [consultants, setConsultants] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState(null);

  const fetchConsultantsData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedSpecId) filters.specialization_id = selectedSpecId;
      if (searchKeyword.trim()) filters.service_name = searchKeyword.trim();

      const [consultantsData, specData] = await Promise.all([
        consultantService.getConsultants(filters, token),
        consultantService.getSpecializations()
      ]);

      setConsultants(Array.isArray(consultantsData) ? consultantsData : []);
      setSpecializations(Array.isArray(specData) ? specData : []);
    } catch (err) {
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultantsData();
  }, [selectedSpecId, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConsultantsData();
  };

  return (
    <div className="fade-in">
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
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          marginBottom: '28px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="البحث باسم المستشار أو التخصص..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '25px',
              border: '1px solid #CBD5E1',
              fontSize: '13px'
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

        <select
          value={selectedSpecId}
          onChange={(e) => setSelectedSpecId(e.target.value)}
          style={{ padding: '11px 16px', borderRadius: '25px', border: '1px solid #CBD5E1', fontSize: '13px', minWidth: '220px', background: '#FFFFFF' }}
        >
          <option value="">جميع التخصصات الضريبية</option>
          {specializations.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

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
            color: '#64748B'
          }}
        >
          <div style={{ width: '56px', height: '56px', background: '#E5EFF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <ConsultantsIcon size={26} color="#005D9C" />
          </div>
          <h3 style={{ marginTop: '16px', color: '#1E293B' }}>لا يوجد مستشارون مطابقون لخيارات البحث حالياً</h3>
          <p style={{ fontSize: '13px', margin: 0 }}>يرجى تجربة تغيير التخصص أو كلمة البحث.</p>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        consultant={selectedConsultant}
        isOpen={!!selectedConsultant}
        onClose={() => setSelectedConsultant(null)}
        onSuccess={() => navigate && navigate('/my-appointments')}
      />
    </div>
  );
}
