// frontend/src/components/AiAssistant/AiAssistantView.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './aiAssistantLayout.css';
import './aiAssistantComposer.css';
import './aiAssistantCards.css';
import './aiAssistantFeedback.css';
import { SAMPLE_CONVERSATIONS } from './aiAssistantData';
import { generateAssistantResponse } from './aiAnswerGenerator';
import AiHeader from './AiHeader';
import AiHistoryDrawer from './AiHistoryDrawer';
import AiMessageList from './AiMessageList';
import AiComposer from './AiComposer';
import AiModeSelector from './AiModeSelector';
import AiArticleModal from './AiArticleModal';

export default function AiAssistantView() {
  const authContext = useAuth();
  const token = authContext?.token || null;
  const user = authContext?.user || null;
  const [conversations, setConversations] = useState(SAMPLE_CONVERSATIONS);
  const [activeConvoId, setActiveConvoId] = useState(SAMPLE_CONVERSATIONS[0].id);
  const [inputText, setInputText] = useState('');
  const [activeMode, setActiveMode] = useState('consultation');
  const [activeTemplate, setActiveTemplate] = useState('none');
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const activeConvo = conversations.find((c) => c.id === activeConvoId) || null;
  const messages = activeConvo ? activeConvo.messages : [];

  const handleSelectConvo = (id) => setActiveConvoId(id);

  const handleNewChat = () => {
    setActiveConvoId(null);
    setInputText('');
    setActiveTemplate('none');
  };

  const handleDeleteConvo = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvoId === id) setActiveConvoId(null);
  };

  const handleToggleFavorite = () => {
    if (!activeConvoId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvoId ? { ...c, is_favorite: !c.is_favorite } : c))
    );
  };

  const handleShare = (type) => {
    const url = window.location.href;
    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent('استشارة ديوان:\n' + url)}`, '_blank');
    } else if (type === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent('استشارة ديوان')}&body=${encodeURIComponent(url)}`;
    } else {
      navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط بنجاح');
    }
  };

  const handleSelectTemplate = (tmpl) => {
    setActiveTemplate(tmpl.id);
    if (tmpl.prompt) {
      setInputText(tmpl.prompt);
    }
  };

  const handleSendMessage = (textOverride) => {
    const textToSend = (textOverride || inputText).trim();
    if (!textToSend || isThinking) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: textToSend };
    let targetId = activeConvoId;

    if (!targetId) {
      targetId = `convo-${Date.now()}`;
      const newConvo = {
        id: targetId,
        title: textToSend.slice(0, 48),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        messages: [userMsg]
      };
      setConversations((prev) => [newConvo, ...prev]);
      setActiveConvoId(targetId);
    } else {
      setConversations((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, messages: [...c.messages, userMsg] } : c))
      );
    }

    setInputText('');
    setIsThinking(true);

    setTimeout(() => {
      const userName = user?.full_name || user?.name || user?.username || '';
      const assistantMsg = generateAssistantResponse(textToSend, token, userName);
      setConversations((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, messages: [...c.messages, assistantMsg] } : c))
      );
      setIsThinking(false);
    }, 4500);
  };

  return (
    <div className="ai-assistant-page-root">
      <AiHeader
        onOpenHistory={() => setIsDrawerOpen(true)}
        onNewChat={handleNewChat}
        activeConvo={activeConvo}
        onToggleFavorite={handleToggleFavorite}
        onPrint={() => window.print()}
        onShare={handleShare}
      />

      <AiMessageList
        messages={messages}
        isThinking={isThinking}
        onPickPrompt={handleSendMessage}
        onFollowUp={handleSendMessage}
        onOpenArticle={(art) => setSelectedArticle(art)}
      />

      {/* Unified Bottom Floating Container */}
      <div className="ai-composer-wrapper">
        <AiComposer
          value={inputText}
          onChange={setInputText}
          onSend={() => handleSendMessage()}
          disabled={isThinking}
          activeMode={activeMode}
          isAdvanced={isAdvanced}
          onToggleAdvanced={() => setIsAdvanced(!isAdvanced)}
        />

        <AiModeSelector
          activeMode={activeMode}
          onSelectMode={setActiveMode}
          activeTemplate={activeTemplate}
          onSelectTemplate={handleSelectTemplate}
        />
      </div>

      <AiHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        conversations={conversations}
        activeId={activeConvoId}
        onSelect={handleSelectConvo}
        onDelete={handleDeleteConvo}
        onToggleFavorite={(id, val) =>
          setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, is_favorite: val } : c)))
        }
        onNewChat={handleNewChat}
      />

      <AiArticleModal item={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}
