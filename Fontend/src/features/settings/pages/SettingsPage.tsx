import React, { useState } from 'react';
import {
  Settings,
  Languages,
  Volume2,
  Bell,
  Check,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [pinyinDefault, setPinyinDefault] = useState(true);
  const [characterStyle, setCharacterStyle] = useState<'simplified' | 'traditional'>('simplified');
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [soundEffects, setSoundEffects] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
            <Settings size={14} />
            <span>TÙY CHỈNH HỆ THỐNG & GIAO DIỆN</span>
          </div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: 800 }}>
            Cài Đặt Hệ Thống
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9, maxWidth: '640px', lineHeight: 1.5 }}>
            Tùy biến hiển thị phiên âm Pinyin, kiểu chữ Hán, tốc độ phát âm thanh bản ngữ và thông báo học tập.
          </p>
        </div>
      </div>

      {/* Settings Sections Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Section 1: Chinese typography & Pinyin */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Languages size={18} color="#4338ca" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Hiển thị Ngôn ngữ & Chữ viết
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '26px' }}>
            {/* Pinyin Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Luôn hiển thị phiên âm Pinyin mặc định
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Tự động hiển thị Pinyin phía trên hoặc bên cạnh các từ chữ Hán trong bài học
                </div>
              </div>
              <input
                type="checkbox"
                checked={pinyinDefault}
                onChange={(e) => setPinyinDefault(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#4338ca', cursor: 'pointer' }}
              />
            </div>

            {/* Character Style */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Hệ thống Hán tự
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Chọn chữ Giản thể (Trung Quốc đại lục) hoặc Phồn thể (Đài Loan, Hồng Kông)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCharacterStyle('simplified')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: characterStyle === 'simplified' ? '1.5px solid #4338ca' : '1px solid #cbd5e1',
                    backgroundColor: characterStyle === 'simplified' ? '#eef2ff' : '#ffffff',
                    color: characterStyle === 'simplified' ? '#4338ca' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Giản thể (简体)
                </button>
                <button
                  type="button"
                  onClick={() => setCharacterStyle('traditional')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: characterStyle === 'traditional' ? '1.5px solid #4338ca' : '1px solid #cbd5e1',
                    backgroundColor: characterStyle === 'traditional' ? '#eef2ff' : '#ffffff',
                    color: characterStyle === 'traditional' ? '#4338ca' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Phồn thể (繁體)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Audio & Pronunciation */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Volume2 size={18} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Âm thanh & Phát âm Bản xứ
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '26px' }}>
            {/* Speed */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Tốc độ phát âm mẫu
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Điều chỉnh tốc độ giọng đọc của gia sư AI và đoạn ghi âm từ vựng
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0.75, 1.0, 1.25].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setAudioSpeed(spd)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: audioSpeed === spd ? '1.5px solid #059669' : '1px solid #cbd5e1',
                      backgroundColor: audioSpeed === spd ? '#ecfdf5' : '#ffffff',
                      color: audioSpeed === spd ? '#059669' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Sound effects */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Hiệu ứng âm thanh khi làm bài tập
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Phát âm thanh chúc mừng khi chọn đúng hoặc tiếng nhắc khi chọn sai
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => setSoundEffects(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Notifications */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Bell size={18} color="#d97706" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Nhắc nhở & Thông báo
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Nhắc nhở duy trì chuỗi học tập (Streak) hàng ngày
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Gửi thông báo nhắc nhở vào lúc 20:00 nếu bạn chưa hoàn thành bài học
                </div>
              </div>
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#d97706', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isSaved ? '#16a34a' : '#4338ca',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isSaved ? <Check size={16} /> : null}
            <span>{isSaved ? 'Đã lưu cấu hình!' : 'Lưu cấu hình'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
