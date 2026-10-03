import React, { useState, useEffect, useCallback } from 'react';
import { type ReviewQueueItem, type SRSRating } from '../types';
import { calculateNextSRSState } from '../srsEngine';
import { ReviewHeader } from './ReviewHeader';
import { Flashcard } from './Flashcard';
import { ReviewRating } from './ReviewRating';
import { ReviewResult } from './ReviewResult';

interface ReviewSessionProps {
  queue: ReviewQueueItem[];
  onExit: () => void;
  onFinishSession?: (updatedStates: Record<string, any>) => void;
}

export const ReviewSession: React.FC<ReviewSessionProps> = ({
  queue: initialQueue,
  onExit,
  onFinishSession,
}) => {
  const [queue, setQueue] = useState<ReviewQueueItem[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Statistics
  const [goodCount, setGoodCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [againCount, setAgainCount] = useState(0);
  const [hardItems, setHardItems] = useState<ReviewQueueItem[]>([]);

  const currentItem = queue[currentIndex];

  const handleReveal = useCallback(() => {
    if (!isRevealed) {
      setIsRevealed(true);
    }
  }, [isRevealed]);

  const handleRate = useCallback(
    (rating: SRSRating) => {
      if (!isRevealed || !currentItem) return;

      // Update counters
      if (rating === 'again') {
        setAgainCount((c) => c + 1);
        setHardItems((prev) => [...prev, currentItem]);
      } else if (rating === 'hard') {
        setHardCount((c) => c + 1);
        setHardItems((prev) => [...prev, currentItem]);
      } else {
        setGoodCount((c) => c + 1);
      }

      // Calculate next SRS state via decoupled SRS engine
      calculateNextSRSState(currentItem.srsState, rating);
      // Can be sent to backend or saved in user state

      // Move to next card or finish
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((i) => i + 1);
        setIsRevealed(false);
      } else {
        setIsFinished(true);
        onFinishSession?.({});
      }
    },
    [isRevealed, currentItem, currentIndex, queue.length, onFinishSession]
  );

  // Desktop Keyboard Shortcuts: Space = Reveal, 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleReveal();
      } else if (isRevealed) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, handleReveal, handleRate]);

  // Handler to restart only hard/again words
  const handleReviewHardWordsAgain = () => {
    if (hardItems.length > 0) {
      setQueue(hardItems);
      setCurrentIndex(0);
      setIsRevealed(false);
      setIsFinished(false);
      setGoodCount(0);
      setHardCount(0);
      setAgainCount(0);
      setHardItems([]);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Focus Mode Header (Hidden when finished) */}
      {!isFinished && (
        <ReviewHeader
          currentIndex={currentIndex}
          totalCards={queue.length}
          onExit={onExit}
        />
      )}

      {/* Main Focus Center */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '680px',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
        }}
      >
        {isFinished ? (
          <ReviewResult
            totalReviewed={queue.length}
            goodCount={goodCount}
            hardCount={hardCount}
            againCount={againCount}
            xpEarned={30}
            onFinish={onExit}
            onReviewHardWordsAgain={hardItems.length > 0 ? handleReviewHardWordsAgain : undefined}
          />
        ) : currentItem ? (
          <>
            {/* The Active Flashcard */}
            <Flashcard
              vocabulary={currentItem.vocabulary}
              isRevealed={isRevealed}
              onReveal={handleReveal}
            />

            {/* SRS 4-Rating Buttons (only visible after reveal) */}
            {isRevealed && (
              <ReviewRating
                predictedIntervals={currentItem.predictedIntervals}
                onRate={handleRate}
              />
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <h3>Không có từ vựng cần ôn tập</h3>
            <button type="button" onClick={onExit}>
              Quay lại
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
