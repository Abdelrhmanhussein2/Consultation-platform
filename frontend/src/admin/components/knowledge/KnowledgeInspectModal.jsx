import React from 'react';
import { IconClose } from './KnowledgeIcons';

export default function KnowledgeInspectModal({
  isOpen,
  onClose,
  source,
  chunks = [],
  relations = []
}) {
  if (!isOpen || !source) return null;

  // Filter chunks belonging to this source
  const sourceChunks = chunks.filter(
    (c) => c.source_id === source.id || c.source_code === source.code
  );
  const chunkIds = new Set(sourceChunks.map((c) => c.id));

  // Filter relations connecting to any of these chunks
  const sourceRelations = relations.filter(
    (r) => chunkIds.has(r.source_chunk_id) || chunkIds.has(r.target_chunk_id)
  );

  const chunkMap = Object.fromEntries(chunks.map((c) => [c.id, c]));

  return (
    <div className="knowledge-modal-backdrop" onClick={onClose}>
      <div className="knowledge-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="knowledge-modal-head">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0D3C5C' }}>
              العلاقات والفهرسة
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: '#64748B' }}>
              المقاطع والعلاقات التي يستخدمها البحث والمساعد الذكي عند الإجابة.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
          >
            <IconClose className="size-5" />
          </button>
        </div>

        <div className="knowledge-modal-body">
          {/* Main Chunks Column */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0D3C5C' }}>
                {source.title}
              </h3>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                {sourceChunks.length} مقطع مفهرس · {sourceRelations.length} علاقة مرتبطة بهذا المصدر
              </p>
            </div>

            {sourceChunks.length === 0 ? (
              <p style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                لا توجد مقاطع مفهرسة لهذا المصدر حتى الآن.
              </p>
            ) : (
              sourceChunks.map((chunk) => (
                <div
                  key={chunk.id}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    background: '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <span className="source-badge">
                      مادة {chunk.article_no || '—'}
                    </span>
                    <span className="source-badge badge-active">
                      {chunk.status || 'ساري'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap' }}>
                    {chunk.content}
                  </p>
                </div>
              ))
            )}
          </section>

          {/* Aside Relations Column */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0D3C5C' }}>
              خريطة العلاقات
            </h3>

            {sourceRelations.length === 0 ? (
              <div style={{ padding: '1.25rem', borderRadius: '8px', background: '#F8FAFC', color: '#64748B', fontSize: '0.8rem', border: '1px solid #E2E8F0', lineHeight: 1.5 }}>
                لا توجد علاقات لهذا المصدر بعد. أضف وسومًا مشتركة أو رمز مصدر مطابقًا ثم أعد الفهرسة.
              </div>
            ) : (
              sourceRelations.map((rel) => {
                const target = chunkMap[rel.target_chunk_id] || chunkMap[rel.source_chunk_id];
                return (
                  <div
                    key={rel.id}
                    style={{
                      padding: '0.85rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      background: '#F8FAFC'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className="source-badge">
                        {rel.relation_type}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E58A13' }}>
                        {Math.round(Number(rel.confidence || 0) * 100)}%
                      </span>
                    </div>

                    <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', fontWeight: 700, color: '#0D3C5C' }}>
                      {target?.source_title || 'مصدر مرتبط'}
                    </p>

                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.775rem', color: '#64748B', lineHeight: 1.5 }}>
                      {rel.note || target?.content}
                    </p>
                  </div>
                );
              })
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

