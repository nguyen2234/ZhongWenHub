import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  RotateCcw,
  Clock,
  Flame,
  CheckCircle2,
  Play,
  Layers,
  Brain,
  Award,
} from 'lucide-react';

interface MatchCard {
  id: string;
  pairId: string;
  text: string;
  type: 'hanzi' | 'meaning';
  subText?: string;
  isMatched: boolean;
  isSelected: boolean;
}

const INITIAL_PAIRS = [
  { pairId: 'p1', hanzi: '苹果', pinyin: 'píngguǒ', meaning: 'Quả táo' },
  { pairId: 'p2', hanzi: '喝水', pinyin: 'hē shuǐ', meaning: 'Uống nước' },
  { pairId: 'p3', hanzi: '学校', pinyin: 'xuéxiào', meaning: 'Trường học' },
  { pairId: 'p4', hanzi: '高兴', pinyin: 'gāoxìng', meaning: 'Vui vẻ' },
  { pairId: 'p5', hanzi: '明天', pinyin: 'míngtiān', meaning: 'Ngày mai' },
  { pairId: 'p6', hanzi: '朋友', pinyin: 'péngyou', meaning: 'Bạn bè' },
];

export const LearningGamesPage: React.FC = () => {
  const [isPlayingGame, setIsPlayingGame] = useState(false);
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);

  // Initialize and shuffle cards
  const startNewGame = () => {
    const list: MatchCard[] = [];
    INITIAL_PAIRS.forEach((p) => {
      list.push({
        id: `h-${p.pairId}`,
        pairId: p.pairId,
        text: p.hanzi,
        subText: p.pinyin,
        type: 'hanzi',
        isMatched: false,
        isSelected: false,
      });
      list.push({
        id: `m-${p.pairId}`,
        pairId: p.pairId,
        text: p.meaning,
        type: 'meaning',
        isMatched: false,
        isSelected: false,
      });
    });

    // Shuffle
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSelectedCards([]);
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setIsGameOver(false);
    setIsPlayingGame(true);
  };

  // Timer
  useEffect(() => {
    if (!isPlayingGame || isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayingGame, isGameOver]);

  const handleCardClick = (card: MatchCard) => {
    if (card.isMatched || card.isSelected || selectedCards.length >= 2) return;

    const newCards = cards.map((c) => (c.id === card.id ? { ...c, isSelected: true } : c));
    setCards(newCards);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      if (first.pairId === second.pairId && first.type !== second.type) {
        // Match!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.pairId === first.pairId ? { ...c, isMatched: true, isSelected: false } : c))
          );
          setSelectedCards([]);
          setCombo((c) => c + 1);
          setScore((s) => s + 100 * (combo + 1));

          // Check if all matched
          setCards((current) => {
            const allDone = current.every((c) => c.pairId === first.pairId || c.isMatched);
            if (allDone) {
              setIsGameOver(true);
            }
            return current;
          });
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, isSelected: false } : c))
          );
          setSelectedCards([]);
          setCombo(0);
        }, 700);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <Gamepad2 size={14} />
            <span>ĐẤU TRƯỜNG TRÒ CHƠI TIẾNG TRUNG (GAMIFIED LEARNING)</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Học mà chơi, ghi nhớ từ vựng siêu tốc
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Vừa chơi mini-game phản xạ vừa ôn luyện Hán tự, Pinyin và ngữ nghĩa mà không hề cảm thấy nhàm chán.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800 }}>+50 XP</div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>Mỗi ván thắng</div>
          </div>
        </div>
      </div>

      {/* Game Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '28px',
          marginBottom: '32px',
        }}
      >
        {!isPlayingGame ? (
          /* Lobby card for Match Blitz */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={32} />
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                  GAME ĐANG MỞ
                </span>
                <h3 style={{ margin: '6px 0 4px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  Ghép Thẻ Từ Vựng HSK (Vocab Match Blitz)
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Ghép cặp Hán tự và nghĩa tiếng Việt tương ứng nhanh nhất có thể trước khi đồng hồ điểm 0!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewGame}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              }}
            >
              <Play size={18} />
              <span>Bắt đầu chơi ngay</span>
            </button>
          </div>
        ) : (
          /* Active Game Board */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Game Scoreboard */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  <Trophy size={18} color="#d97706" />
                  <span>Điểm: {score}</span>
                </div>
                {combo > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 800, color: '#dc2626', backgroundColor: '#fee2e2', padding: '3px 10px', borderRadius: '9999px' }}>
                    <Flame size={14} />
                    <span>Combo x{combo}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 800, color: timeLeft < 15 ? '#dc2626' : '#15803d', fontFamily: 'monospace' }}>
                  <Clock size={18} />
                  <span>{timeLeft}s</span>
                </div>
                <button
                  type="button"
                  onClick={startNewGame}
                  style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={13} />
                  <span>Chơi lại</span>
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {cards.map((card) => {
                let bg = '#ffffff';
                let border = '1.5px solid #cbd5e1';
                let opacity = 1;

                if (card.isMatched) {
                  bg = '#dcfce7';
                  border = '1.5px solid #86efac';
                  opacity = 0.6;
                } else if (card.isSelected) {
                  bg = '#eef2ff';
                  border = '2px solid #4338ca';
                }

                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={card.isMatched}
                    onClick={() => handleCardClick(card)}
                    style={{
                      minHeight: '84px',
                      padding: '12px',
                      borderRadius: '14px',
                      backgroundColor: bg,
                      border,
                      opacity,
                      cursor: card.isMatched ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: card.isSelected ? '0 4px 12px rgba(67, 56, 202, 0.2)' : '0 2px 4px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: card.type === 'hanzi' ? '22px' : '15px',
                        fontWeight: 800,
                        fontFamily: card.type === 'hanzi' ? 'var(--font-hanzi)' : 'inherit',
                        color: card.isMatched ? '#16a34a' : card.isSelected ? '#4338ca' : '#0f172a',
                      }}
                    >
                      {card.text}
                    </span>
                    {card.subText && (
                      <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                        {card.subText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Other Games Preview Catalog */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
          Các trò chơi học tập khác sắp ra mắt
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            {
              title: 'Lật Thẻ Trí Nhớ (Memory Matrix)',
              desc: 'Ghi nhớ vị trí các cặp thẻ chữ Hán và lật trúng theo phản xạ.',
              badge: 'Sắp ra mắt',
              icon: Layers,
            },
            {
              title: 'Sắp Xếp Câu Thần Tốc (Sentence Rush)',
              desc: 'Kéo thả thứ tự từ ngữ hoàn thiện câu tiếng Trung dưới áp lực thời gian.',
              badge: 'Sắp ra mắt',
              icon: Brain,
            },
            {
              title: 'Đoán Nét Bút Hán Tự (Stroke Master)',
              desc: 'Đoán nét tiếp theo của chữ Hán để ghi điểm combo tối đa.',
              badge: 'Sắp ra mắt',
              icon: Award,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                      {item.badge}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Ván chơi kết thúc!
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
              Bạn đã thể hiện phản xạ từ vựng tiếng Trung rất xuất sắc!
            </p>

            <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#15803d' }}>
                {score} Điểm
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Thưởng: +50 XP kinh nghiệm</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={startNewGame}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Chơi ván mới
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlayingGame(false);
                  setIsGameOver(false);
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Trở về sảnh game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningGamesPage;
