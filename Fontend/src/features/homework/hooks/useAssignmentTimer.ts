import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAssignmentTimerProps {
  expiresAt?: string;
  onExpire?: () => void;
}

export function useAssignmentTimer({ expiresAt, onExpire }: UseAssignmentTimerProps) {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const calculateRemaining = useCallback(() => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  }, [expiresAt]);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(calculateRemaining);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(null);
      return;
    }

    const initial = calculateRemaining();
    setRemainingSeconds(initial);

    if (initial !== null && initial <= 0) {
      hasExpiredRef.current = true;
      onExpireRef.current?.();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining !== null && remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        clearInterval(timer);
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, calculateRemaining]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number | null): string => {
    if (secs === null) return 'Không giới hạn';
    if (secs <= 0) return '00:00';

    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isWarning5Min = remainingSeconds !== null && remainingSeconds <= 300 && remainingSeconds > 60;
  const isWarning1Min = remainingSeconds !== null && remainingSeconds <= 60 && remainingSeconds > 0;
  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    isWarning5Min,
    isWarning1Min,
    isExpired,
  };
}
