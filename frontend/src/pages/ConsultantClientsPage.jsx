import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultantService } from '../services/consultantService';

export default function ConsultantClientsPage({ navigate }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await consultantService.getClients(token);
        if (data && data.length > 0) {
          setClients(data);
        } else {
          setClients([]);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [token]);

  // Handle local client filter by search query
  const filteredClients = clients.filter(c => {
    const nameMatch = c.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  const getInitials = (name) => {
    if (!name) return 'ع';
    const cleanName = name.replace('أ. ', '').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).substring(0, 2);
    }
    return parts[0].charAt(0);
  };

  return (
    <div className="consultant-clients-container fade-in" style={{ direction: 'rtl', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      {/* 1. Back button & Title Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/consultant/dashboard')}
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            color: '#475569',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>→</span> رجوع
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FFF0D9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F5A52A',
            fontSize: '22px'
          }}>
            👥
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
              عملائي
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              جميع العملاء الذين تعاملت معهم.
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div style={{
          position: 'relative',
          minWidth: '260px'
        }}>
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94A3B8',
            fontSize: '14px'
          }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="بحث"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '10px 36px 10px 14px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#0D3C5C',
              outline: 'none',
              transition: 'all 0.15s'
            }}
          />
        </div>
      </div>

      {/* 2. Client Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(0, 93, 156, 0.1)',
            borderTop: '3px solid #005D9C',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748B', fontSize: '14px' }}>جاري تحميل قائمة العملاء...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '60px 40px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
          color: '#64748B'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>👥</span>
          <p style={{ fontSize: '15px', fontWeight: '700' }}>
            {searchQuery ? 'لا يوجد عملاء يطابقون البحث.' : 'لا يوجد لديك عملاء مسجلون حالياً.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {filteredClients.map((client) => {
            const lastContact = client.last_appointment_at
              ? new Date(client.last_appointment_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })
              : 'لا يوجد';

            return (
              <div key={client.user_id} style={{
                backgroundColor: '#FFFFFF',
                padding: '20px 24px',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 10px rgba(13, 60, 92, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(13, 60, 92, 0.04)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(13, 60, 92, 0.02)'; }}
              >
                {/* Left block (Chat / Email icons) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => navigate('/chat')}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      fontSize: '16px',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.color = '#2563EB'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                    title="مراسلة العميل"
                  >
                    💬
                  </button>
                  <button 
                    onClick={() => {
                      if (client.email) {
                        window.location.href = `mailto:${client.email}`;
                      } else {
                        alert("لا يتوفر بريد إلكتروني لهذا العميل");
                      }
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      fontSize: '16px',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; e.currentTarget.style.color = '#2563EB'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                    title="إرسال بريد إلكتروني"
                  >
                    ✉️
                  </button>
                </div>

                {/* Right block (Avatar & Name/Details) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end', textAlign: 'left' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0D3C5C', margin: 0 }}>
                      {client.full_name}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: '6px 0 0', fontWeight: '600' }}>
                      {client.phone || 'غير محدد'} • {client.total_sessions} جلسة • آخر تواصل {lastContact}
                    </p>
                  </div>

                  {/* Avatar circle */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#F5A52A',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getInitials(client.full_name)}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
