import React, { useState, useEffect } from 'react';
import { PolicyIcon } from '../components/UserPortal/Icons';

export default function PolicyCenterPage({ openPolicy }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/policies/active')
      .then(res => res.ok ? res.json() : [])
      .then(data => { setPolicies(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#E5EFF5', padding: '10px', borderRadius: '12px', color: '#005D9C' }}>
          <PolicyIcon size={24} color="#005D9C" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
            مركز السياسات والشروط المعتمدة
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            استعراض السياسات المعتمدة، اتفاقيات الاستخدام، وسياسة الخصوصية الخاصة بالمنصة.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#005D9C' }}>جاري جلب السياسات النشطة...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {policies.map(p => (
            <div key={p.id} style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E5EFF5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <PolicyIcon size={22} color="#005D9C" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginBottom: '8px' }}>{p.title}</h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '20px' }}>الإصدار الحالي: {p.version}</p>
              </div>
              <button
                onClick={() => openPolicy && openPolicy(p.policy_type)}
                style={{
                  background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(245, 165, 42, 0.25)'
                }}
              >
                قراءة النص الكامل
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
