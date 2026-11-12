import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Plus,
  Search,
  MessageSquare,
  Languages,
  Globe,
  Radio,
  Trash2,
  RotateCcw,
  Menu,
  Sparkles,
} from 'lucide-react';
import { Button, HSKLevel, StickerIllustration } from '../../../../design-system';
import { AITutorService } from '../../services/AITutorService';
import { AIBlockRenderer } from '../blocks/AIBlockRenderer';
import { AI_TUTOR_WELCOME_MESSAGE } from '../AITutorDrawer';
import type { AITutorContext, AITutorMessage } from '../../types';
import '../../ai-tutor-workspace.css';

export interface ChatSessionMeta {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  category: 'today' | 'earlier';
  hskLevel?: number;
}

export interface AITutorChatViewProps {
  initialContext?: AITutorContext | null;
  onSwitchToLive?: () => void;
}

export const AITutorChatView: React.FC<AITutorChatViewProps> = ({
  initialContext,
  onSwitchToLive,
}) => {
  // Conversation History List
  const [conversations, setConversations] = useState<ChatSessionMeta[]>([
    {
      id: 'conv-1',
      title: 'Bài 8: Ngữ pháp 想 (xiǎng) & Gọi món cà phê',
      lastMessage: 'Công thức: Chủ ngữ + 想 + Động từ + Tân ngữ...',
      updatedAt: '10:45',
      category: 'today',
      hskLevel: 2,
    },
    {
      id: 'conv-2',
      title: 'Hỏi giá tiền: Cấu trúc 这个多少钱？',
      lastMessage: 'Giải thích từ vựng 多少 và lượng từ đi kèm...',
      updatedAt: 'Hôm qua',
      category: 'earlier',
      hskLevel: 2,
    },
    {
      id: 'conv-3',
      title: 'Sửa lỗi câu: 我想喝咖啡了',
      lastMessage: 'Trong ngữ cảnh này không nên dùng trợ từ 了...',
      updatedAt: '2 ngày trước',
      category: 'earlier',
      hskLevel: 2,
    },
  ]);

  const [activeConvId, setActiveConvId] = useState<string>('conv-1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messages, setMessages] = useState<AITutorMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
  const isSendingRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleThreadScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distance < 80;
  };

  // Close mobile sidebar drawer on Escape key
  useEffect(() => {
    if (!isSidebarOpenMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpenMobile(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpenMobile]);

  // Initialize messages for active conversation once per switch
  useEffect(() => {
    setMessages([
      {
        id: `m-init-${activeConvId}`,
        conversationId: activeConvId,
        role: 'assistant',
        content: AI_TUTOR_WELCOME_MESSAGE,
        createdAt: new Date().toISOString(),
      },
    ]);
    forceScrollRef.current = true;
  }, [activeConvId]);

  // Smart Auto scroll: only when near bottom or user just sent a message
  useEffect(() => {
    if (forceScrollRef.current || isNearBottomRef.current) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      forceScrollRef.current = false;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || isLoading || isSendingRef.current) return;

    isSendingRef.current = true;
    forceScrollRef.current = true;
    setSendError(null);
    setLastFailedQuery(null);
    const draftBeforeSend = inputText;
    if (!textToSend) {
      setInputText('');
    }

    const userMsgId = `msg-u-${Date.now()}`;
    const userMsg: AITutorMessage = {
      id: userMsgId,
      conversationId: activeConvId,
      role: 'user',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = AITutorService.buildHistoryFromMessages(messages);
      const resp = await AITutorService.sendChatMessage({
        conversationId: activeConvId,
        message: query,
        mode: 'ASK',
        context: initialContext || { source: 'dashboard', hskLevel: 2 },
        history,
      });

      const aiMsg: AITutorMessage = {
        id: `msg-ai-${Date.now()}`,
        conversationId: activeConvId,
        role: 'assistant',
        content:
          resp.type === 'markdown'
            ? resp.markdownFallback || resp.summary || 'Phản hồi từ Trợ giảng AI:'
            : resp.summary || 'Đây là giải đáp chi tiết từ Trợ giảng AI:',
        structuredResponse: resp,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Update last message in active conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, lastMessage: query, updatedAt: 'Vừa xong' } : c
        )
      );
    } catch (err) {
      // Preserve draft & remove failed optimistic user message so user can retry cleanly
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
      setLastFailedQuery(query);
      setSendError(AITutorService.getErrorMessage(err));
      if (!textToSend && draftBeforeSend) {
        setInputText(draftBeforeSend);
      } else {
        setInputText(query);
      }
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleCreateNewConversation = () => {
    const newId = 'conv-' + Date.now();
    const newConv: ChatSessionMeta = {
      id: newId,
      title: 'Hội thoại mới ' + (conversations.length + 1),
      lastMessage: 'Chưa có tin nhắn',
      updatedAt: 'Vừa xong',
      category: 'today',
      hskLevel: 2,
    };
    setConversations([newConv, ...conversations]);
    setActiveConvId(newId);
    setIsSidebarOpenMobile(false);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) return;
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id) {
      setActiveConvId(remaining[0].id);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="ai-chat-root-container">
      {/* Mobile Backdrop for Sidebar Drawer */}
      <div
        className={`ai-chat-sidebar-backdrop ${isSidebarOpenMobile ? 'active' : ''}`}
        onClick={() => setIsSidebarOpenMobile(false)}
      />

      {/* =====================================================================
          1. LEFT SIDEBAR: Conversation Management
          ===================================================================== */}
      <div
        className={`ai-chat-sidebar ${isSidebarOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* New Chat Button & Search */}
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleCreateNewConversation}
          >
            Cuộc trò chuyện mới
          </Button>

          {/* Search conversations */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
            }}
          >
            <Search size={14} style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Tìm kiếm đoạn chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: 'var(--text-xs)',
                width: '100%',
                color: 'var(--foreground)',
              }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2) var(--space-3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', padding: '6px 8px', letterSpacing: '0.04em' }}>
            HỘI THOẠI GẦN ĐÂY
          </div>

          {filteredConversations.map((c) => {
            const isActive = c.id === activeConvId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setActiveConvId(c.id);
                  setIsSidebarOpenMobile(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <MessageSquare
                    size={16}
                    style={{ color: isActive ? 'var(--primary)' : 'var(--muted)', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--primary)' : 'var(--foreground)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.lastMessage}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{c.updatedAt}</span>
                  {conversations.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: isActive ? 'block' : 'none',
                      }}
                      title="Xóa đoạn chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Context & Info Footer in Sidebar */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HSKLevel level={2} />
            <span style={{ color: 'var(--muted)' }}>Minh Anh</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 600 }}>AI Trực tuyến</span>
        </div>
      </div>

      {/* =====================================================================
          2. MAIN CHAT AREA
          ===================================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-5)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="ai-mobile-menu-btn"
              onClick={() => setIsSidebarOpenMobile(true)}
              aria-label="Lịch sử đoạn chat"
            >
              <Menu size={18} />
            </button>

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--ai-light, #eff6ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid var(--ai-border, #bfdbfe)',
              }}
            >
              <StickerIllustration name="aiTutor" size="xs" decorative />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
                  {activeConv?.title || 'Trợ giảng AI Thông minh'}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success)',
                    border: '1px solid var(--success-border)',
                    fontWeight: 700,
                  }}
                >
                  Trực tuyến
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Hỗ trợ giải nghĩa chữ Hán, ngữ pháp, mẫu câu & kiểm tra lỗi sai
              </span>
            </div>
          </div>

          {/* Action Tools & Live Mode Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              onClick={() => setShowPinyin((p) => !p)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-md)',
                border: showPinyin ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)',
                backgroundColor: showPinyin ? 'var(--primary-light)' : 'var(--background)',
                color: showPinyin ? 'var(--primary)' : 'var(--muted)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Bật/Tắt hiển thị Pinyin"
            >
              <Languages size={13} />
              <span>Pinyin</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTranslation((t) => !t)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-md)',
                border: showTranslation ? '1.5px solid var(--primary)' : '1px solid var(--border-strong)',
                backgroundColor: showTranslation ? 'var(--primary-light)' : 'var(--background)',
                color: showTranslation ? 'var(--primary)' : 'var(--muted)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Bật/Tắt hiển thị Dịch nghĩa Tiếng Việt"
            >
              <Globe size={13} />
              <span>Dịch nghĩa</span>
            </button>

            {/* LIVE VOICE MODE BUTTON */}
            <Button
              variant="primary"
              icon={<Radio size={15} />}
              style={{
                backgroundColor: 'var(--ai)',
                borderColor: 'var(--ai)',
                boxShadow: '0 2px 10px rgba(124, 58, 237, 0.25)',
              }}
              onClick={onSwitchToLive}
              className="ai-chat-live-btn"
            >
              <span className="ai-chat-live-btn-full">Luyện nói trực tiếp (Live) ➜</span>
              <span className="ai-chat-live-btn-short">Live ➜</span>
            </Button>
          </div>
        </div>

        {/* Message Thread Area */}
        <div
          ref={messagesScrollRef}
          onScroll={handleThreadScroll}
          className="ai-chat-messages-container"
        >
          {messages.map((msg) => {
            const isAi = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className="ai-message-row"
                style={{
                  justifyContent: isAi ? 'flex-start' : 'flex-end',
                }}
              >
                {isAi && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <StickerIllustration name="aiTutor" size="xs" decorative />
                  </div>
                )}

                <div className="ai-message-bubble-wrapper">
                  <div
                    className="ai-message-bubble"
                    style={{
                      backgroundColor: isAi ? '#f1f5f9' : '#e0ecff',
                      color: '#0f172a',
                      border: isAi ? '1px solid #e2e8f0' : '1px solid #c7dafa',
                    }}
                  >
                    {msg.content}

                    {/* Render Structured Language Blocks */}
                    {msg.structuredResponse?.blocks && (
                      <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {msg.structuredResponse.blocks.map((b, idx: number) => (
                          <AIBlockRenderer key={idx} block={b} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Suggested actions chips under AI responses (max 3) */}
                  {isAi && msg.structuredResponse?.suggestedActions && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                      {msg.structuredResponse.suggestedActions.slice(0, 3).map((action: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(action)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Max 3 contextual quick suggestions shown ONLY before first user message */}
          {!messages.some((m) => m.role === 'user') && !isLoading && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '44px' }}>
              {[
                'Giải thích ngữ pháp cấu trúc 想',
                'Sửa lỗi câu: 我想喝咖啡了',
                'Phân biệt 想 và 要',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSendMessage(suggestion)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--muted)', fontSize: 'var(--text-xs)', padding: 'var(--space-2)' }}>
              <RotateCcw size={14} className="animate-spin" />
              <span>Trợ giảng đang phản hồi...</span>
            </div>
          )}

          {/* Error Notice & Retry */}
          {sendError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 'var(--text-xs)',
              }}
            >
              <span>{sendError}</span>
              {lastFailedQuery && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => void handleSendMessage(lastFailedQuery)}
                  style={{
                    flexShrink: 0,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: '1px solid #fca5a5',
                    backgroundColor: '#ffffff',
                    color: '#b91c1c',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Thử lại
                </button>
              )}
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Message Composer */}
        <div className="ai-composer-container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              backgroundColor: '#f8fafc',
              borderRadius: '22px',
              border: '1.5px solid #e2e8f0',
              padding: '6px 8px 6px 14px',
            }}
          >
            <Sparkles size={16} style={{ color: '#94a3b8', flexShrink: 0, marginBottom: '8px' }} />
            <textarea
              placeholder="Hỏi bất kỳ điều gì về bài học hoặc chữ Hán..."
              value={inputText}
              rows={1}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              style={{
                flex: 1,
                minHeight: '32px',
                maxHeight: '110px',
                padding: '6px 0',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: 'var(--text-sm)',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.45,
                color: '#0f172a',
              }}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!inputText.trim() || isLoading}
              icon={<Send size={15} />}
              style={{ height: '36px', minWidth: '36px', padding: 0, borderRadius: '9999px' }}
              aria-label="Gửi tin nhắn"
            />
          </form>
        </div>
      </div>
    </div>
  );
};
