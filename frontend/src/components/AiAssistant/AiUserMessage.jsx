// frontend/src/components/AiAssistant/AiUserMessage.jsx
import React from 'react';

export default function AiUserMessage({ content }) {
  return (
    <div className="ai-user-bubble-row">
      <div className="ai-user-bubble">
        {content}
      </div>
    </div>
  );
}
