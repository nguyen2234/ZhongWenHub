import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Lightbulb,
} from 'lucide-react';
import { Button } from '../../../design-system';

interface AITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  hskLevel: number;
  lessonTitle: string;
  stepName: string;
  currentContextWord?: string;
  currentGrammarRule?: string;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({
  isOpen,
  onClose,
  hskLevel,
  lessonTitle,
  stepName,
  currentContextWord,
  currentGrammarRule,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Chào bạn! Mình là AI Tutor đồng hành cùng bạn trong ${lessonTitle} (HSK ${hskLevel}). Bạn đang ở phần ${stepName}. Có thắc mắc nào về từ vựng, ngữ pháp hay cách dùng câu, cứ hỏi mình nhé!`,
      timestamp: 'Vừa xong',
    },
  ]);

  const quickPrompts = [
    `Giải thích phần ${stepName} cho tôi`,
    'Tại sao dùng lượng từ 杯 (bēi)?',
    'Cho tôi 3 ví dụ thực tế với từ 想',
    'Luyện đối đáp hội thoại với tôi',
    'Cách phân biệt 想 (muốn) và 要 (muốn/cần)',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');

    // Simulated Smart AI Response tailored to Chinese learning
    setTimeout(() => {
      let aiReply = '';
      const lower = text.toLowerCase();

      if (lower.includes('杯') || lower.includes('bēi')) {
        aiReply =
          'Trong tiếng Trung, 杯 (bēi) vừa là danh từ (cái cốc/ly), vừa là lượng từ chỉ một đơn vị chất lỏng đựng trong cốc. Ví dụ: 一杯水 (yībēi shuǐ - một cốc nước), 两杯茶 (liǎng bēi chá - hai cốc trà). Khi gọi đồ uống ở quán, bạn luôn dùng số từ + 杯 + tên đồ uống nhé!';
      } else if (lower.includes('想') || lower.includes('ví dụ')) {
        aiReply =
          'Trợ động từ 想 (xiǎng) diễn tả mong muốn chủ quan: Chủ ngữ + 想 + Động từ + Tân ngữ.\n\n3 ví dụ hữu ích:\n1. 我想吃中国菜。(Wǒ xiǎng chī Zhōngguó cài - Tôi muốn ăn món Trung Quốc)\n2. 你想去哪里？(Nǐ xiǎng qù nǎlǐ? - Bạn muốn đi đâu?)\n3. 明天我想在家休息。(Míngtiān wǒ xiǎng zài jiā xiūxi - Ngày mai tôi muốn nghỉ ngơi ở nhà).';
      } else if (lower.includes('phân biệt') || lower.includes('yào') || lower.includes('要')) {
        aiReply =
          'Điểm khác biệt giữa 想 (xiǎng) và 要 (yào):\n• 想 (xiǎng): Diễn tả mong muốn, suy nghĩ trong đầu (tương tự "would like to" trong tiếng Anh), sắc thái nhẹ nhàng, lịch sự.\n• 要 (yào): Thể hiện ý chí kiên quyết hơn, bắt buộc hoặc chuẩn bị làm ngay (tương tự "want / will"). Trong quán nước, cả hai đều dùng được nhưng 想 nghe nhẹ nhàng hơn!';
      } else if (lower.includes('hội thoại') || lower.includes('luyện')) {
        aiReply =
          'Tuyệt vời! Hãy đóng vai nhé! Mình là phục vụ: "您好，你想喝茶还是喝咖啡？" (Nínhǎo, nǐ xiǎng hē chá háishì hē kāfēi? - Xin chào, bạn muốn uống trà hay uống cà phê?). Hãy trả lời mình bằng tiếng Trung nào!';
      } else {
        aiReply = `Cảm ơn bạn đã hỏi về "${text}". Trong Bài 8 này, trọng tâm là dùng "想 + Động từ" để gọi đồ uống. Nếu bạn muốn đặt câu thử, hãy gõ câu tiếng Trung vào đây, mình sẽ sửa lỗi ngữ pháp và phiên âm giúp bạn ngay nhé!`;
      }

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: aiReply,
        timestamp: 'Vừa xong',
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 60,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Drawer Container (Right side on desktop, bottom sheet on mobile) */}
      <aside
        aria-label="Khung trợ lý AI Tutor"
        className="ai-tutor-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--surface)',
          zIndex: 70,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <header
          style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
                  AI Tutor Tiếng Trung
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success)',
                    fontWeight: 700,
                  }}
                >
                  Sẵn sàng
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Đang hỗ trợ: {stepName} (HSK {hskLevel})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trợ lý AI"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <X size={18} />
          </button>
        </header>

        {/* Current Context Pill Banner */}
        <div
          style={{
            padding: 'var(--space-2-5) var(--space-4)',
            backgroundColor: 'var(--primary-light)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--primary)',
          }}
        >
          <Lightbulb size={14} style={{ flexShrink: 0 }} />
          <span>
            Ngữ cảnh: <strong>{lessonTitle}</strong>
            {currentContextWord ? ` • Từ: ${currentContextWord}` : ''}
            {currentGrammarRule ? ` • Cấu trúc: ${currentGrammarRule}` : ''}
          </span>
        </div>

        {/* Chat History List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'flex-start',
                  flexDirection: isAi ? 'row' : 'row-reverse',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isAi ? 'var(--primary-light)' : 'var(--border)',
                    color: isAi ? 'var(--primary)' : 'var(--foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {isAi ? <Bot size={15} /> : <User size={15} />}
                </div>

                <div
                  style={{
                    maxWidth: '85%',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: isAi ? 'var(--background)' : 'var(--primary)',
                    color: isAi ? 'var(--foreground)' : '#ffffff',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.55,
                    border: isAi ? '1px solid var(--border)' : 'none',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Prompts Carousel */}
        <div
          style={{
            padding: 'var(--space-2) var(--space-4)',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>
            Gợi ý câu hỏi nhanh:
          </div>
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
            }}
          >
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <footer
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Hỏi AI về từ vựng, ngữ pháp..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-xs)',
              outline: 'none',
            }}
          />
          <Button
            variant="primary"
            icon={<Send size={14} />}
            onClick={() => handleSendMessage()}
            disabled={!inputVal.trim()}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '0 12px',
              minHeight: '36px',
            }}
          />
        </footer>
      </aside>
    </>
  );
};

export const FloatingAITutorButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Mở trợ lý AI Tutor"
      style={{
        position: 'fixed',
        bottom: '76px',
        right: '20px',
        zIndex: 45,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--primary)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 18px rgba(67, 56, 202, 0.4)',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        transition: 'all 0.2s ease',
      }}
      title="Hỏi trợ lý AI Tutor về bài học này"
    >
      <Sparkles size={16} />
      <span>Hỏi AI</span>
    </button>
  );
};
