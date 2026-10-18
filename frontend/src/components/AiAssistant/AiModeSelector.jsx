// frontend/src/components/AiAssistant/AiModeSelector.jsx
import React from 'react';
import { CONSULTATION_MODES, TOPIC_TEMPLATES } from './aiAssistantData';

export default function AiModeSelector({
  activeMode,
  onSelectMode,
  activeTemplate,
  onSelectTemplate
}) {
  return (
    <div className="ai-mode-selector-wrap">
      {/* Row 1: The 4 Main Consultation Category Pills */}
      <div className="ai-pills-row">
        {CONSULTATION_MODES.map((mode) => {
          const isActive = mode.id === activeMode;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`ai-category-pill ${isActive ? 'active' : ''}`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Prompt Templates Pills */}
      <div className="ai-pills-row">
        {TOPIC_TEMPLATES.map((tmpl) => {
          const isSelected = (activeTemplate || 'none') === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl)}
              className={`ai-tmpl-pill ${isSelected ? 'active' : ''}`}
            >
              {tmpl.label}
            </button>
          );
        })}
      </div>

      {/* Advisory Note */}
      <p className="ai-disclaimer-text">
        الإجابات استرشادية. للحالات الحساسة احجز جلسة مع مستشار معتمد.
      </p>
    </div>
  );
}
