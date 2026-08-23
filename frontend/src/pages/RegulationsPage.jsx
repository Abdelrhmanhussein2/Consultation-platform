import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RegulationsIcon, SearchIcon } from '../components/UserPortal/Icons';

export default function RegulationsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/rag/search?query=${encodeURIComponent(query.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || data || []);
      }
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: '#E5EFF5', padding: '10px', borderRadius: '12px', color: '#005D9C' }}>
          <RegulationsIcon size={24} color="#005D9C" />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
            التشريعات والقوانين الضريبية
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0' }}>
            استعراض ومحرك بحث دلالي في قانون ضريبة الدخل وقانون ضريبة المبيعات والتعليمات التنفيذية الصادرة.
          </p>
        </div>
      </div>

      {/* Search Input Bar with Golden Button */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        <input
          type="text"
          placeholder="ابحث في نص القانون، المادة، أو موضوع ضريبي (مثل: الإعفاءات الضريبية، الخصم المباشر)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: '25px',
            border: '1px solid #CBD5E1',
            fontSize: '14px',
            background: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            background: 'linear-gradient(135deg, #F5A52A, #E0921B)',
            color: '#FFFFFF',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '25px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(245, 165, 42, 0.3)'
          }}
        >
          <SearchIcon size={18} color="#FFFFFF" />
          <span>بحث دلالي</span>
        </button>
      </form>

      {/* Search Results */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#005D9C' }}>جاري البحث الفائق في النصوص الضريبية...</div>
      ) : searched && results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {results.map((res, i) => (
            <div key={i} style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'inline-block', background: '#E5EFF5', color: '#005D9C', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', marginBottom: '10px' }}>
                مادة قانونية / نص تشريعي
              </div>
              <p style={{ color: '#1E293B', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>{res.content || res.text || JSON.stringify(res)}</p>
            </div>
          ))}
        </div>
      ) : searched ? (
        <div style={{ background: '#FFFFFF', padding: '48px', borderRadius: '20px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
          لم يتم العثور على نتائج مطابقة لاستعلامك.
        </div>
      ) : null}
    </div>
  );
}
