// frontend/src/components/Regulations/RegulationsSearch.jsx
import React, { useState } from 'react';
import { getLegalSuggestion } from '../../services/legalDictionary';

export default function RegulationsSearch({ searchQuery, setSearchQuery, onSearch, onOpenFilters }) {
  const [isAiActive, setIsAiActive] = useState(false);
  const [suggestionData, setSuggestionData] = useState(null);
  const [inputError, setInputError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleToggleAiImprove = () => {
    if (!searchQuery || !searchQuery.trim()) {
      setInputError(true);
      setTimeout(() => setInputError(false), 2000);
      return;
    }

    if (isAiActive) {
      setIsAiActive(false);
      setSuggestionData(null);
    } else {
      const result = getLegalSuggestion(searchQuery);
      setIsAiActive(true);
      setSuggestionData(result);
    }
  };

  const handleSelectSuggestedTerm = (termTitle) => {
    setSearchQuery(termTitle);
    setIsAiActive(false);
    setSuggestionData(null);
    onSearch(termTitle);
  };

  return (
    <div className="reg-hero-banner">
      <div className="reg-eyebrow">
        <span>البحث الدلالي</span>
      </div>

      <h1 className="reg-hero-title">البحث في القوانين والتشريعات الضريبية الأردنية</h1>
      
      <p className="reg-hero-subtitle">
        ابحث باسم التشريع أو برقمه، أو اكتب موضوعاً صريحاً أو مصطلحاً قانونياً وسيتولى ديوان إظهار نتائج الأكثر ارتباطاً بالسياق.
      </p>

      <form className="reg-search-input-box" onSubmit={handleSubmit}>
        <input
          type="text"
          className="reg-search-input-field"
          style={{ borderColor: inputError ? '#EF4444' : 'transparent' }}
          placeholder={inputError ? "يرجى كتابة مصطلح قانوني أولاً (مثل: سكراب)..." : "ابحث بكلمة، مصطلح قانوني، رقم قانون أو اسم تشريع..."}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (isAiActive) {
              setSuggestionData(getLegalSuggestion(e.target.value));
            }
          }}
        />
        
        <button
          type="button"
          className="reg-search-option-btn"
          onClick={onOpenFilters}
        >
          <span>بحث متقدم</span>
        </button>

        <button
          type="button"
          className={`reg-search-option-btn ${isAiActive ? 'active-gold' : ''}`}
          onClick={handleToggleAiImprove}
          title="تفعيل تحسين القاموس التشريعي بالذكاء الاصطناعي"
        >
          <span>تحسين البحث</span>
        </button>

        <button type="submit" className="reg-search-submit-btn">
          بحث
        </button>
      </form>

      {/* Suggestion Bar & Popup Menu */}
      {isAiActive && suggestionData && (
        <>
          <div className="reg-ai-suggest-bar">
            <div className="reg-ai-suggest-text">
              <span>اقتراح ديوان:</span>
              <strong>هل تقصد «{suggestionData.main}»؟</strong>
            </div>

            <button
              type="button"
              className="reg-use-suggest-btn"
              onClick={() => handleSelectSuggestedTerm(suggestionData.main)}
            >
              استخدام المصطلح المقترح
            </button>
          </div>

          <div className="reg-ai-dropdown-modal">
            {suggestionData.options?.map((opt, idx) => (
              <div
                key={idx}
                className="reg-ai-dropdown-item"
                onClick={() => handleSelectSuggestedTerm(opt.title)}
              >
                <div className="reg-ai-dropdown-item-title">{opt.title}</div>
                <div className="reg-ai-dropdown-item-desc">{opt.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
