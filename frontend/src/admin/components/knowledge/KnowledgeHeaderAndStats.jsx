import React from 'react';
import { IconDoc, IconSync, IconSparkles } from './KnowledgeIcons';

export default function KnowledgeHeaderAndStats({
  sourcesCount,
  chunksCount,
  relationsCount,
  activeCount,
  isSyncing,
  onSyncCore
}) {
  const stats = [
    { label: 'مصادر', value: sourcesCount },
    { label: 'مفهرسات', value: chunksCount },
    { label: 'علاقات', value: relationsCount },
    { label: 'نشطة', value: activeCount }
  ];

  return (
    <>
      <header className="knowledge-bento-panel knowledge-header">
        <div>
          <p className="knowledge-tag">KNOWLEDGE OPERATIONS</p>
          <h1 className="knowledge-title">
            <IconDoc className="size-7 text-[#E58A13]" />
            قاعدة المعرفة والتعديلات القانونية
          </h1>
          <p className="knowledge-subtitle">
            إضافة وتعديل القوانين، فهرستها في RAG، ربط المواد، وإرسال تنبيهات التعديلات للشرائح المتأثرة.
          </p>
        </div>

        <button
          type="button"
          onClick={onSyncCore}
          disabled={isSyncing}
          className="btn-sync-core"
        >
          {isSyncing ? (
            <IconSync className="size-4 spin-animate" />
          ) : (
            <IconSync className="size-4" />
          )}
          <span>تحديث النواة المرجعية</span>
        </button>
      </header>

      <section className="knowledge-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="knowledge-bento-panel knowledge-stat-card">
            <p className="knowledge-stat-val">{s.value}</p>
            <p className="knowledge-stat-lbl">{s.label}</p>
          </div>
        ))}
      </section>
    </>
  );
}

