import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceInputOptions {
  autoStopDuration?: number;
  maxDuration?: number;
  language?: string;
  onStart?: () => void;
  onStop?: (transcript: string, duration: number) => void;
  onError?: (error: string) => void;
  simulateRealistic?: boolean;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  duration: number;
  volume: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
  isSupported: boolean;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
}

const mockTranscripts = [
  '你好，我要找一个宝马5系G38的左前大灯，带随动转向的',
  '请问这个EA888的涡轮增压器还有货吗？价格还能再优惠一点吗',
  '我需要一套米其林浩悦4 235/45R18的轮胎，四条，今天能发货吗',
  '上次那个奔驰的空气悬挂压缩机还有吗？我这边有个客户需要',
  '急寻奥迪A6L C8的方向机总成，带电感的，原厂件或者拆车件都可以',
  '你好，我看到你有个凯美瑞的前保险杠，珍珠白色的，帮我留一下',
  '请问这个三元催化器包安装吗？质保期是多长时间',
  '我要发布一个急件，大众迈腾B8的变速箱阀体，0DE的',
  '你那边有没有特斯拉Model 3的热泵压缩机？我这边有个车的坏了',
  '这个刹车套装能不能再便宜点？我是你的老客户了',
];

function generateRandomTranscript(): string {
  return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
}

export function useVoiceInput(
  options: UseVoiceInputOptions = {}
): UseVoiceInputReturn {
  const {
    autoStopDuration = 500,
    maxDuration = 60000,
    onStart,
    onStop,
    onError,
    simulateRealistic = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported] = useState(true);

  const startTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mockFullTranscriptRef = useRef<string>('');

  const clearAllTimers = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (volumeTimerRef.current) clearInterval(volumeTimerRef.current);
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
    if (transcriptTimerRef.current) clearTimeout(transcriptTimerRef.current);
    durationTimerRef.current = null;
    volumeTimerRef.current = null;
    autoStopTimerRef.current = null;
    maxDurationTimerRef.current = null;
    transcriptTimerRef.current = null;
  }, []);

  const simulateVolume = useCallback(() => {
    if (!simulateRealistic) return;
    volumeTimerRef.current = setInterval(() => {
      const baseVolume = 0.3 + Math.random() * 0.5;
      const variation = Math.sin(Date.now() / 100) * 0.15;
      setVolume(Math.max(0, Math.min(1, baseVolume + variation)));
    }, 50);
  }, [simulateRealistic]);

  const simulateTranscript = useCallback(() => {
    if (!simulateRealistic) return;
    const fullText = generateRandomTranscript();
    mockFullTranscriptRef.current = fullText;
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        const charsToAdd = Math.floor(Math.random() * 3) + 1;
        currentIndex = Math.min(currentIndex + charsToAdd, fullText.length);
        setInterimTranscript(fullText.slice(0, currentIndex));
        const nextDelay = 80 + Math.random() * 120;
        transcriptTimerRef.current = setTimeout(typeNextChar, nextDelay);
      }
    };

    setTimeout(typeNextChar, 500);
  }, [simulateRealistic]);

  const start = useCallback(() => {
    if (isListening) return;
    clearAllTimers();
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setVolume(0);
    setIsPaused(false);
    setIsListening(true);
    startTimeRef.current = Date.now();

    onStart?.();

    durationTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setDuration(Date.now() - startTimeRef.current);
      }
    }, 100);

    simulateVolume();
    simulateTranscript();

    maxDurationTimerRef.current = setTimeout(() => {
      stop();
      onError?.('已达到最大录音时长');
    }, maxDuration);
  }, [isListening, isPaused, clearAllTimers, simulateVolume, simulateTranscript, maxDuration, onStart, onError]);

  const stop = useCallback(() => {
    if (!isListening) return;
    clearAllTimers();

    const finalDuration = Date.now() - startTimeRef.current;
    const finalTranscript = mockFullTranscriptRef.current || interimTranscript || generateRandomTranscript();

    setTranscript(finalTranscript);
    setInterimTranscript('');
    setVolume(0);
    setIsListening(false);
    setIsPaused(false);

    onStop?.(finalTranscript, finalDuration);
  }, [isListening, clearAllTimers, interimTranscript, onStop]);

  const pause = useCallback(() => {
    if (!isListening || isPaused) return;
    setIsPaused(true);
    setVolume(0);
  }, [isListening, isPaused]);

  const resume = useCallback(() => {
    if (!isListening || !isPaused) return;
    setIsPaused(false);
    startTimeRef.current = Date.now() - duration;
    simulateVolume();
  }, [isListening, isPaused, duration, simulateVolume]);

  const reset = useCallback(() => {
    clearAllTimers();
    setIsListening(false);
    setIsPaused(false);
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setVolume(0);
    mockFullTranscriptRef.current = '';
  }, [clearAllTimers]);

  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  return {
    isListening,
    transcript,
    interimTranscript,
    duration,
    volume,
    start,
    stop,
    reset,
    isSupported,
    isPaused,
    pause,
    resume,
  };
}

export default useVoiceInput;
