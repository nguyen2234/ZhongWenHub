import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ArrowLeft } from 'lucide-react';
import { AITutorLiveView } from '../../ai-tutor/components/live/AITutorLiveView';

export const AILivePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '1480px',
        margin: '0 auto',
        padding: '20px 24px 40px 24px',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Hội Thoại AI Live (Kippy)
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                }}
              >
                <Radio size={12} className="animate-pulse" />
                <span>Live Mode</span>
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Luyện phản xạ nói 2 chiều với gia sư AI giọng chuẩn Bắc Kinh
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/ai-tutor?mode=chat')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#4338ca',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Chuyển sang AI Chat
        </button>
      </div>

      {/* Embedded Live View Component */}
      <AITutorLiveView />
    </div>
  );
};

export default AILivePage;
