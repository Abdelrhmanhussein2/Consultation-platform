// frontend/src/components/Regulations/TrendingSearches.jsx
import React from 'react';

const TRENDING_TOPICS = [
  { num: "01", label: "ضريبة الدخل", query: "قانون ضريبة الدخل" },
  { num: "02", label: "المصاريف المقبولة", query: "المصاريف المقبولة ضريبياً" },
  { num: "03", label: "اقتطاع من المصدر", query: "ضريبة اقتطاع الرواتب والأجور" },
  { num: "04", label: "الإعفاءات الضريبية", query: "جدول الإعفاءات الضريبية" },
  { num: "05", label: "ضريبة المبيعات", query: "قانون الضريبة العامة على المبيعات" },
  { num: "06", label: "التسجيل الضريبي", query: "شروط التسجيل في الشبكة الضريبية" }
];

export default function TrendingSearches({ onSelectTopic }) {
  return (
    <div className="reg-weekly-trends-card">
      <div className="reg-trends-title-group">
        <span className="reg-trends-title">الأكثر بحثاً هذا الأسبوع</span>
        <span className="reg-trends-sub">اختيارات لأكثر الموضوعات والتشريعات بحثاً في ديوان</span>
      </div>

      <div className="reg-trends-pills-row">
        {TRENDING_TOPICS.map((topic, idx) => (
          <button
            key={idx}
            className="reg-trend-pill"
            onClick={() => onSelectTopic(topic.query)}
          >
            <span className="reg-trend-pill-num">{topic.num}</span>
            <span>{topic.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
