/**
 * frontend/src/admin/components/knowledge/LawDependentsSummary.jsx
 * Read-only summary of all relations tied to the opened law:
 * 1. issued_under: ما صدر بموجبه (أنظمة، قرارات، تعليمات، إلخ)
 * 2. repealed_by: ما أُلغي بموجبه (وثائق ألغاها هذا القانون)
 *    Direction note: These are documents repealed BY this law, not documents that repealed this law.
 * 3. judicial: الارتباطات القضائية (تمييز حقوق، تمييز جزاء، إلخ)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { fetchLawTaxonomyTree } from './knowledgeApi';
import { parseTaxonomyGroups } from './taxonomyParser';

export default function LawDependentsSummary({ lawId }) {
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isOpenDetails, setIsOpenDetails] = useState(false);
  const [expandedCats, setExpandedCats] = useState({});

  const loadTree = useCallback(async () => {
    if (!lawId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchLawTaxonomyTree(lawId);
      setTreeData(data);
    } catch {
      setFetchError('تعذر تحميل بيانات ارتباطات القانون');
    } finally {
      setIsLoading(false);
    }
  }, [lawId]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  if (isLoading) {
    return (
      <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B' }}>
        جاري جلب ارتباطات القانون...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ padding: '8px 12px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', fontSize: '11px', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{fetchError}</span>
        <button type="button" onClick={loadTree} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: '11px' }}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const { groups, totalCount } = parseTaxonomyGroups(treeData);
  if (!treeData || totalCount === 0 || groups.length === 0) return null;

  const toggleCategory = (catKey) => {
    setExpandedCats((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  return (
    <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px', color: '#1E293B' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ fontWeight: 800, color: '#0A3C64', fontSize: '12px' }}>
          ارتباطات هذا القانون ({totalCount} وثيقة مرتبطة):
        </div>
        <button
          type="button"
          onClick={() => setIsOpenDetails((prev) => !prev)}
          style={{ fontSize: '11px', color: '#005D9C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isOpenDetails ? 'إخفاء تفاصيل الارتباطات' : 'عرض تفاصيل الارتباطات'}
        </button>
      </div>

      {/* Concise counters per group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {groups.map((group) => (
          <div key={group.key} style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#0A3C64' }}>
              {group.title}
              {group.hint && (
                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400, marginRight: '4px' }}>
                  ({group.hint})
                </span>
              )}:
            </span>
            <span style={{ color: '#334155' }}>
              {group.categories.map((c) => `${c.name} (${c.count})`).join(' · ')}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded detailed view */}
      {isOpenDetails && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          {groups.map((group) => (
            <div key={group.key} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 750, color: '#005D9C', marginBottom: '4px', borderBottom: '1px dashed #CBD5E1', paddingBottom: '2px' }}>
                {group.title} {group.hint && <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 400 }}>({group.hint})</span>} ({group.total})
              </div>

              {group.categories.map((category) => {
                const catKey = `${group.key}_${category.name}`;
                const isExpanded = !!expandedCats[catKey];
                const visibleItems = isExpanded ? category.items : category.items.slice(0, 5);
                const hasMore = category.items.length > 5;

                return (
                  <div key={category.name} style={{ margin: '4px 8px 6px 0' }}>
                    <div style={{ fontWeight: 600, color: '#0A3C64', fontSize: '11px' }}>
                      {category.name} ({category.count}):
                    </div>
                    <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                      {visibleItems.map((item) => (
                        <li key={item.id} style={{ color: '#334155', margin: '2px 0', fontSize: '11px' }}>
                          <span style={{ fontWeight: 500 }}>{item.title || item.id}</span>
                          <span style={{ color: '#64748B', fontSize: '10px', marginRight: '6px' }}>
                            ({item.status || 'ساري'})
                          </span>
                        </li>
                      ))}
                    </ul>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => toggleCategory(catKey)}
                        style={{ fontSize: '10px', color: '#005D9C', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 16px', textDecoration: 'underline' }}
                      >
                        {isExpanded ? 'عرض أقل' : `عرض ${category.items.length - 5} وثائق إضافية...`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
