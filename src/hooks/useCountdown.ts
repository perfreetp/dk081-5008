import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountdownOptions {
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  interval?: number;
}

interface UseCountdownReturn {
  remaining: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isCompleted: boolean;
  formatted: string;
  start: () => void;
  pause: () => void;
  reset: (newDuration?: number) => void;
  restart: () => void;
}

function parseDuration(duration: number | string | Date): number {
  if (typeof duration === 'number') {
    return duration > 0 ? duration : 0;
  }
  if (typeof duration === 'string') {
    const target = new Date(duration).getTime();
    const diff = target - Date.now();
    return diff > 0 ? diff : 0;
  }
  if (duration instanceof Date) {
    const diff = duration.getTime() - Date.now();
    return diff > 0 ? diff : 0;
  }
  return 0;
}

function padZero(value: number): string {
  return value.toString().padStart(2, '0');
}

export function useCountdown(
  duration: number | string | Date,
  options: UseCountdownOptions = {}
): UseCountdownReturn {
  const {
    autoStart = true,
    onComplete,
    onTick,
    interval = 1000,
  } = options;

  const initialDuration = useRef(parseDuration(duration));

  const [remaining, setRemaining] = useState<number>(initialDuration.current);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart && initialDuration.current > 0);
  const [isCompleted, setIsCompleted] = useState<boolean>(initialDuration.current <= 0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      const next = prev - interval;
      if (next <= 0) {
        clearTimer();
        setIsRunning(false);
        setIsCompleted(true);
        onCompleteRef.current?.();
        return 0;
      }
      onTickRef.current?.(next);
      return next;
    });
  }, [interval, clearTimer]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      timerRef.current = setInterval(tick, interval);
    }
    return clearTimer;
  }, [isRunning, tick, interval, clearTimer, remaining]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const start = useCallback(() => {
    if (remaining <= 0 || isRunning) return;
    setIsRunning(true);
  }, [remaining, isRunning]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    clearTimer();
  }, [isRunning, clearTimer]);

  const reset = useCallback((newDuration?: number) => {
    clearTimer();
    const newInitial = newDuration !== undefined ? parseDuration(newDuration) : initialDuration.current;
    initialDuration.current = newInitial;
    setRemaining(newInitial);
    setIsCompleted(newInitial <= 0);
    setIsRunning(false);
  }, [clearTimer]);

  const restart = useCallback(() => {
    clearTimer();
    setRemaining(initialDuration.current);
    setIsCompleted(initialDuration.current <= 0);
    setIsRunning(initialDuration.current > 0);
  }, [clearTimer]);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}天 ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  } else if (hours > 0) {
    formatted = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  } else {
    formatted = `${padZero(minutes)}:${padZero(seconds)}`;
  }

  return {
    remaining,
    days,
    hours,
    minutes,
    seconds,
    isRunning,
    isCompleted,
    formatted,
    start,
    pause,
    reset,
    restart,
  };
}

export default useCountdown;
