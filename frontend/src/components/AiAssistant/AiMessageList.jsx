// frontend/src/components/AiAssistant/AiMessageList.jsx
import React, { useRef, useEffect } from 'react';
import AiUserMessage from './AiUserMessage';
import AiStructuredAnswer from './AiStructuredAnswer';
import AiRichMessage from './AiRichMessage';
import AiThinkingSteps from './AiThinkingSteps';
import AiEmptyState from './AiEmptyState';

export default function AiMessageList({
  messages,
  isThinking,
  onPickPrompt,
  onFollowUp,
  onOpenArticle
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="ai-chat-body">
        <div style={{ margin: 'auto 0', width: '100%' }}>
          <AiEmptyState onPickPrompt={onPickPrompt} />
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-body" id="assistant-print-area">
      <div className="ai-chat-container">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return <AiUserMessage key={msg.id} content={msg.content} />;
          }

          if (msg.metadata?.mode === 'answer') {
            return (
              <AiStructuredAnswer
                key={msg.id}
                payload={msg.metadata}
                onFollowUp={onFollowUp}
                onOpenArticle={onOpenArticle}
              />
            );
          }

          return (
            <AiRichMessage
              key={msg.id}
              content={msg.content}
              citations={msg.citations}
              onFollowUp={onFollowUp}
            />
          );
        })}

        {isThinking && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <AiThinkingSteps />
          </div>
        )}

        <div ref={bottomRef} style={{ height: '20px' }} />
      </div>
    </div>
  );
}
