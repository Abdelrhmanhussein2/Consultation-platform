// frontend/src/components/Regulations/TrendingSearches.jsx
import React from 'react';

const TRENDING_TOPICS = [
  { num: "01", label: "ضريبة الدخل", query: "ضريبة الدخل" },
  { num: "02", label: "المصاريف المقبولة", query: "المصاريف المقبولة" },
  { num: "03", label: "الاقتطاع من المصدر", query: "الاقتطاع من المصدر" },
  { num: "04", label: "الإعفاءات الضريبية", query: "الإعفاءات الضريبية" },
  { num: "05", label: "ضريبة المبيعات", query: "ضريبة المبيعات" },
  { num: "06", label: "التسجيل الضريبي", query: "التسجيل الضريبي" }
];

export default function TrendingSearches({ onSelectTopic }) {
  return (
    <section className="weekly-trends" aria-label="الأكثر بحثًا هذا الأسبوع">
      <div className="weekly-trends-head">
        <div>
          <span className="weekly-trends-kicker">الأكثر بحثًا هذا الأسبوع</span>
          <small>اختصارات لأكثر الموضوعات والتشريعات بحثًا في ديوان</small>
        </div>
        <span className="weekly-trends-icon">↗</span>
      </div>
      <div className="weekly-trends-list">
        {TRENDING_TOPICS.map((topic, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectTopic(topic.query)}
          >
            <span>{topic.num}</span>
            {topic.label}
          </button>
        ))}
      </div>
    </section>
  );
}
