export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  formatted: string;
}

export function calculateCountdown(targetDate: string | Date, fromDate: string | Date = new Date()): CountdownResult {
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
  let totalMs = target.getTime() - from.getTime();
  const isExpired = totalMs <= 0;

  if (isExpired) {
    totalMs = 0;
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}天${String(hours).padStart(2, '0')}时${String(minutes).padStart(2, '0')}分`;
  } else if (hours > 0) {
    formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (minutes > 0) {
    formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    formatted = `${String(seconds).padStart(2, '0')}秒`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    isExpired,
    formatted,
  };
}

export function calculateCountdownShort(targetDate: string | Date, fromDate: string | Date = new Date()): string {
  const result = calculateCountdown(targetDate, fromDate);
  if (result.isExpired) return '已过期';

  if (result.days > 0) {
    return `${result.days}天${result.hours}时`;
  }
  if (result.hours > 0) {
    return `${result.hours}时${result.minutes}分`;
  }
  if (result.minutes > 0) {
    return `${result.minutes}分${result.seconds}秒`;
  }
  return `${result.seconds}秒`;
}

export function isLessThan(targetDate: string | Date, minutes: number): boolean {
  const result = calculateCountdown(targetDate);
  return !result.isExpired && result.totalMs < minutes * 60 * 1000;
}

export function getUrgencyLevel(targetDate: string | Date): 'normal' | 'warning' | 'critical' {
  const result = calculateCountdown(targetDate);
  if (result.isExpired) return 'critical';
  if (result.totalMs < 5 * 60 * 1000) return 'critical';
  if (result.totalMs < 10 * 60 * 1000) return 'warning';
  return 'normal';
}

export function addMinutes(date: string | Date, minutes: number): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

export function addDays(date: string | Date, days: number): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addHours(date: string | Date, hours: number): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}
