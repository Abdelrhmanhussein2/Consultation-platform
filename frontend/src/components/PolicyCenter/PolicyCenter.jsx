import React from 'react';
import './PolicyCenter.css';

export default function PolicyCenter({ openPolicy }) {
  const policiesList = [
    {
      type: 'terms_and_conditions',
      title: 'شروط وأحكام استخدام منصة ديوان',
      description: 'الإطار التعاقدي الذي ينظّم استخدام المنصة وخدماتها.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      type: 'privacy_policy',
      title: 'سياسة الخصوصية وحماية البيانات الشخصية',
      description: 'كيف نجمع بياناتك الشخصية ونعالجها ونحميها.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    },
    {
      type: 'data_subject_rights',
      title: 'سياسة حقوق أصحاب البيانات الشخصية',
      description: 'حقوقك في الوصول والتصحيح والحذف والاعتراض.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      type: 'ai_assistant_disclosure',
      title: 'الإفصاح الخاص بمساعد ديوان الذكي',
      description: 'حدود مخرجات الذكاء الاصطناعي ودور المراجعة البشرية.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      )
    },
    {
      type: 'records_retention',
      title: 'سياسة الاحتفاظ بالسجلات والمستندات',
      description: 'مدد الاحتفاظ بالسجلات وآلية الإتلاف الآمن.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      )
    },
    {
      type: 'sla',
      title: 'سياسة مستوى الخدمة',
      description: 'التزامات التوافر وأزمنة الاستجابة.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      type: 'code_of_conduct',
      title: 'مدونة السلوك المهني والأخلاقي',
      description: 'قواعد السلوك المتوقعة من المستشارين والمستخدمين.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <polyline points="17 11 19 13 23 9"></polyline>
        </svg>
      )
    },
    {
      type: 'service_quality',
      title: 'ميثاق جودة الخدمات',
      description: 'معايير الجودة الملزمة لمقدّمي الخدمة على المنصة.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      )
    },
    {
      type: 'cybersecurity',
      title: 'سياسة الأمن السيبراني',
      description: 'ضوابط حماية الحسابات والأنظمة.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },
    {
      type: 'disclaimer',
      title: 'سياسة إخلاء المسؤولية',
      description: 'حدود مسؤولية المنصة عن المحتوى والمخرجات.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )
    },
    {
      type: 'tax_services_use',
      title: 'سياسة استخدام الخدمات الضريبية',
      description: 'ضوابط استخدام الخدمات والمحتوى الضريبي.',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
          <line x1="12" y1="4" x2="12" y2="20"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
        </svg>
      )
    }
  ];

  return (
    <div className="policy-center-container slide-up">
      {/* Title Header */}
      <div className="policy-center-header">
        <h1>مركز السياسات والامتثال</h1>
        <p>جميع السياسات القانونية والتنظيمية لمنصة ديوان في مكان واحد</p>
      </div>

      {/* Grid of Policy Cards */}
      <div className="policy-grid">
        {policiesList.map((p, idx) => (
          <div className="policy-card fade-in" key={idx} style={{ animationDelay: `${idx * 0.05}s` }}>
            {/* Circular Icon badge */}
            <div className="policy-icon-wrapper">
              {p.icon}
            </div>

            {/* Content info */}
            <h3 className="policy-card-title">{p.title}</h3>
            <p className="policy-card-desc">{p.description}</p>

            {/* Read more Link */}
            <button 
              type="button" 
              className="policy-card-link"
              onClick={() => openPolicy(p.type)}
            >
              عرض التفاصيل <span>&larr;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
