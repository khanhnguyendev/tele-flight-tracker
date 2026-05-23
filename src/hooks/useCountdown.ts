import { useEffect, useState } from 'react';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

/**
 * Custom React countdown hook to tick down to the departure date timezone-safely (ICT GMT+7).
 */
export function useCountdown(targetDateStr: string): TimeLeft {
  const calculateTimeLeft = (): TimeLeft => {
    try {
      const target = new Date(`${targetDateStr}T00:00:00+07:00`);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();

      if (diffMs <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      const diffSecs = Math.floor(diffMs / 1000);
      return {
        days: Math.floor(diffSecs / (24 * 3600)),
        hours: Math.floor((diffSecs % (24 * 3600)) / 3600),
        minutes: Math.floor((diffSecs % 3600) / 60),
        seconds: diffSecs % 60,
        isExpired: false
      };
    } catch {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    // Initial recalculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateStr]);

  return timeLeft;
}
