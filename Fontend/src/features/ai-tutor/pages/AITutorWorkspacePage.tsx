import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Radio, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '../../../design-system';
import { useAITutor } from '../context/AITutorContext';
import { AITutorChatView } from '../components/chat/AITutorChatView';
import { AITutorLiveView } from '../components/live/AITutorLiveView';
import { StudentSecondaryNav } from '../../../layouts/components/StudentSecondaryNav';
import { STUDENT_MAIN_NAV_ITEMS } from '../../../config/student-navigation.config';

export const AITutorWorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeContext } = useAITutor();

  const urlMode = searchParams.get('mode');
  const [currentMode, setCurrentMode] = useState<'chat' | 'live'>(
    urlMode === 'live' ? 'live' : 'chat'
  );

  // Sync mode with URL search params
  useEffect(() => {
    if (urlMode === 'live' || urlMode === 'chat') {
      setCurrentMode(urlMode);
    }
  }, [urlMode]);

  const handleModeChange = (newMode: 'chat' | 'live') => {
    setCurrentMode(newMode);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', newMode);
      return next;
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: '1480px',
        margin: '0 auto',
      }}
    >
      {/* Secondary Sub-navigation for AI Tutor */}
      <StudentSecondaryNav
        title="AI Tutor"
        items={STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'ai-tutor')?.secondaryFeatures || []}
      />

      {/* Top Workspace Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button
            variant="ghost"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/dashboard')}
            style={{ padding: '0 8px', height: '36px' }}
          >
            Dashboard
          </Button>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--ai)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h1 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Không gian AI Tutor Chuyên nghiệp
              </h1>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Trợ giảng thông minh đồng hành cùng học viên tiếng Trung
              </span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'inline-flex',
            padding: '3px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border-strong)',
          }}
        >
          <button
            type="button"
            onClick={() => handleModeChange('chat')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: currentMode === 'chat' ? 'var(--surface)' : 'transparent',
              color: currentMode === 'chat' ? 'var(--primary)' : 'var(--muted)',
              boxShadow: currentMode === 'chat' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={14} />
            <span>Chat văn bản</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('live')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: currentMode === 'live' ? 'var(--primary)' : 'transparent',
              color: currentMode === 'live' ? '#ffffff' : 'var(--muted)',
              boxShadow: currentMode === 'live' ? '0 2px 6px rgba(67, 56, 202, 0.3)' : 'none',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Radio size={14} />
            <span>Luyện nói Live (Kippy UX)</span>
          </button>
        </div>
      </div>

      {/* Mode Workspace Content */}
      {currentMode === 'chat' ? (
        <AITutorChatView
          initialContext={activeContext}
          onSwitchToLive={() => handleModeChange('live')}
        />
      ) : (
        <AITutorLiveView
          initialMode="daily_conversation"
          onSwitchToChat={() => handleModeChange('chat')}
          onBackToDashboard={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default AITutorWorkspacePage;
