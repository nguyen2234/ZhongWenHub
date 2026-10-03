import React, { useState } from 'react';
import { Send, Eye, EyeOff } from 'lucide-react';
import type { ConversationTurn, ScenarioConfig } from '../types';

export const SCENARIO_CAFE: ScenarioConfig = {
  id: 'cafe',
  title: 'Quán Cà Phê (咖啡馆)',
  subtitle: 'Đóng vai khách hàng gọi đồ uống tại quầy',
  icon: '☕',
  aiRole: 'Nhân viên phục vụ',
  userRole: 'Khách hàng',
  initialMessage: {
    hanzi: '你好！你想喝什么？',
    pinyin: 'Nǐ hǎo! Nǐ xiǎng hē shénme?',
    vietnamese: 'Xin chào! Bạn muốn uống gì?',
  },
};

interface ConversationScenarioProps {
  scenario?: ScenarioConfig;
}

export const ConversationScenario: React.FC<ConversationScenarioProps> = ({
  scenario = SCENARIO_CAFE,
}) => {
  const [turns, setTurns] = useState<ConversationTurn[]>([
    {
      id: 'turn-1',
      speaker: 'ai',
      hanzi: scenario.initialMessage.hanzi,
      pinyin: scenario.initialMessage.pinyin,
      vietnamese: scenario.initialMessage.vietnamese,
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [isReplying, setIsReplying] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isReplying) return;

    const userText = inputVal.trim();
    setInputVal('');

    const newTurn: ConversationTurn = {
      id: 'turn-' + Date.now(),
      speaker: 'user',
      hanzi: userText,
      pinyin: userText.includes('咖啡') ? 'Wǒ xiǎng hē kāfēi.' : '...',
      vietnamese: userText.includes('咖啡') ? 'Tôi muốn uống cà phê.' : '...',
    };

    setTurns((prev) => [...prev, newTurn]);
    setIsReplying(true);

    // AI reply simulating cafe dialogue
    setTimeout(() => {
      const aiReply: ConversationTurn = {
        id: 'turn-ai-' + Date.now(),
        speaker: 'ai',
        hanzi: '好的。你想喝热的还是冰的？',
        pinyin: 'Hǎo de. Nǐ xiǎng hē rè de háishi bīng de?',
        vietnamese: 'Được ạ. Bạn muốn uống nóng hay lạnh?',
      };
      setTurns((prev) => [...prev, aiReply]);
      setIsReplying(false);
    }, 700);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-4)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header and Toggle Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{scenario.icon}</span>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
              {scenario.title}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
              {scenario.subtitle}
            </div>
          </div>
        </div>

        {/* Pinyin & Vietnamese Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setShowPinyin(!showPinyin)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: showPinyin ? 'var(--primary-light)' : 'var(--background)',
              color: showPinyin ? 'var(--primary)' : 'var(--muted)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showPinyin ? <Eye size={11} /> : <EyeOff size={11} />}
            <span>Pinyin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVietnamese(!showVietnamese)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: showVietnamese ? 'var(--primary-light)' : 'var(--background)',
              color: showVietnamese ? 'var(--primary)' : 'var(--muted)',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showVietnamese ? <Eye size={11} /> : <EyeOff size={11} />}
            <span>Nghĩa</span>
          </button>
        </div>
      </div>

      {/* Turns dialogue box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2-5)',
          maxHeight: '260px',
          overflowY: 'auto',
          backgroundColor: 'var(--background)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        {turns.map((t) => {
          const isAi = t.speaker === 'ai';
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignSelf: isAi ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                backgroundColor: isAi ? 'var(--surface)' : 'var(--primary)',
                color: isAi ? 'var(--foreground)' : '#ffffff',
                border: isAi ? '1px solid var(--border)' : 'none',
                padding: '8px 12px',
                borderRadius: isAi ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                fontSize: 'var(--text-xs)',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 700 }}>
                {isAi ? scenario.aiRole : scenario.userRole}
              </span>
              <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 700 }}>
                {t.hanzi}
              </div>
              {showPinyin && (
                <div style={{ fontSize: '11px', color: isAi ? 'var(--primary)' : 'rgba(255,255,255,0.9)' }}>
                  {t.pinyin}
                </div>
              )}
              {showVietnamese && (
                <div style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic' }}>
                  &quot;{t.vietnamese}&quot;
                </div>
              )}
            </div>
          );
        })}
        {isReplying && (
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
            Nhân viên phục vụ đang gõ...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          value={inputVal}
          disabled={isReplying}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Nhập câu tiếng Trung (ví dụ: 我想喝咖啡)..."
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            fontSize: 'var(--text-xs)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isReplying}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};
