// frontend/src/components/AiAssistant/AiAssistantView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './aiAssistantLayout.css';
import './aiAssistantComposer.css';
import './aiAssistantCards.css';
import './aiAssistantFeedback.css';
import { chatAiService } from '../../services/chatAiService';
import AiHeader from './AiHeader';
import AiHistoryDrawer from './AiHistoryDrawer';
import AiMessageList from './AiMessageList';
import AiComposer from './AiComposer';
import AiModeSelector from './AiModeSelector';
import AiArticleModal from './AiArticleModal';

const syncUrlWithChatId = (id) => {
  try {
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set('id', id);
    } else {
      url.searchParams.delete('id');
    }
    window.history.replaceState({ path: url.toString() }, '', url.toString());
  } catch (e) {
    console.error('Failed to sync URL', e);
  }
};

export default function AiAssistantView() {
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [activeMode, setActiveMode] = useState('consultation');
  const [activeTemplate, setActiveTemplate] = useState('none');
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const loadSessionDetail = useCallback(async (id) => {
    try {
      setActiveConvoId(id);
      syncUrlWithChatId(id);
      const detail = await chatAiService.getSession(id);
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, ...detail } : c))
      );
    } catch (err) {
      console.error('Failed to load session detail', err);
      // إذا كانت المحادثة غير موجودة أو غير مصرح له بها
      syncUrlWithChatId(null);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlChatId = params.get('id');

      const list = await chatAiService.listSessions();
      if (Array.isArray(list)) {
        setConversations(list);
        if (urlChatId) {
          // فتح المحادثة المحددة في الرابط مباشرة
          loadSessionDetail(urlChatId);
        } else if (list.length > 0) {
          loadSessionDetail(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load AI sessions', err);
    }
  }, [loadSessionDetail]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const activeConvo = conversations.find((c) => String(c.id) === String(activeConvoId)) || null;
  const messages = activeConvo?.messages || [];

  const handleSelectConvo = async (id) => {
    setActiveConvoId(id);
    await loadSessionDetail(id);
  };

  const handleNewChat = () => {
    setActiveConvoId(null);
    syncUrlWithChatId(null);
    setInputText('');
    setActiveTemplate('none');
  };

  const handleDeleteConvo = async (id) => {
    try {
      await chatAiService.deleteSession(id);
      setConversations((prev) => prev.filter((c) => String(c.id) !== String(id)));
      if (String(activeConvoId) === String(id)) {
        setActiveConvoId(null);
        syncUrlWithChatId(null);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleToggleFavorite = async (targetId = null) => {
    const id = targetId || activeConvoId;
    if (!id) return;
    try {
      const res = await chatAiService.togglePinSession(id);
      setConversations((prev) =>
        prev
          .map((c) =>
            String(c.id) === String(id)
              ? { ...c, is_favorite: res.is_pinned, is_pinned: res.is_pinned }
              : c
          )
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  };

  const handleEditTitle = async (id, newTitle) => {
    try {
      const res = await chatAiService.updateSession(id, { title: newTitle });
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === String(id) ? { ...c, title: res.title || newTitle } : c))
      );
    } catch (err) {
      alert(err.message || 'فشل تعديل عنوان المحادثة');
    }
  };

  const handleShare = (type) => {
    const url = window.location.href;
    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent('استشارة ديوان:\n' + url)}`, '_blank');
    } else if (type === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent('استشارة ديوان')}&body=${encodeURIComponent(url)}`;
    } else {
      navigator.clipboard.writeText(url);
      alert('تم نسخ رابط المحادثة بنجاح');
    }
  };

  const handleSelectTemplate = (tmpl) => {
    setActiveTemplate(tmpl.id);
    if (tmpl.prompt) {
      setInputText(tmpl.prompt);
    }
  };

  const handleSendMessage = async (textOverride) => {
    const textToSend = (textOverride || inputText).trim();
    if (!textToSend || isThinking) return;

    setInputText('');
    setIsThinking(true);

    try {
      let currentSessionId = activeConvoId;

      // 1. Create a session on the backend if starting a new chat
      if (!currentSessionId) {
        const newSession = await chatAiService.createSession(textToSend.slice(0, 50));
        currentSessionId = newSession.id;
        setActiveConvoId(currentSessionId);
        syncUrlWithChatId(currentSessionId);
        setConversations((prev) => [
          {
            ...newSession,
            messages: [{ id: `tmp-${Date.now()}`, role: 'user', content: textToSend }]
          },
          ...prev
        ]);
      } else {
        // Optimistic UI update
        setConversations((prev) =>
          prev.map((c) =>
            String(c.id) === String(currentSessionId)
              ? {
                  ...c,
                  messages: [
                    ...(c.messages || []),
                    { id: `tmp-${Date.now()}`, role: 'user', content: textToSend }
                  ]
                }
              : c
          )
        );
      }

      // 2. Send message to backend (encrypted & saved to DB)
      const res = await chatAiService.sendMessage(currentSessionId, textToSend);

      // 3. Update conversation with real backend messages and title
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c.id) === String(currentSessionId)) {
            const existing = (c.messages || []).filter(
              (m) => !String(m.id).startsWith('tmp-')
            );
            return {
              ...c,
              title: res.session?.title || c.title,
              updated_at: res.session?.updated_at || new Date().toISOString(),
              messages: [...existing, res.user_message, res.assistant_message]
            };
          }
          return c;
        })
      );
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء إرسال الرسالة للذكاء الاصطناعي');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="ai-assistant-page-root">
      <AiHeader
        onOpenHistory={() => setIsDrawerOpen(true)}
        onNewChat={handleNewChat}
        activeConvo={activeConvo}
        onToggleFavorite={() => handleToggleFavorite(activeConvoId)}
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
        onToggleFavorite={(id) => handleToggleFavorite(id)}
        onEditTitle={handleEditTitle}
        onNewChat={handleNewChat}
      />

      <AiArticleModal item={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}
