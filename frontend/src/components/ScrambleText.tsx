import React, { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_CHARS = '!<>-_\\/[]{}—=+*^?#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface ScrambleTextProps {
  text: string;
  className?: string;
  autoTriggerInterval?: number; // ms to periodically re-scramble (0 to disable)
  scrambleSpeed?: number; // frames per character resolution
  triggerOnHover?: boolean;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = '',
  autoTriggerInterval = 7000,
  scrambleSpeed = 2.5,
  triggerOnHover = true
}) => {
  const [displayText, setDisplayText] = useState(text);
  const frameRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScramblingRef = useRef(false);

  const startScramble = useCallback(() => {
    if (isScramblingRef.current) return;
    isScramblingRef.current = true;
    frameRef.current = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      frameRef.current += 1;
      let completedCount = 0;
      let scrambled = '';

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
          scrambled += ' ';
          completedCount += 1;
          continue;
        }

        // Lock in characters progressively
        const lockFrame = Math.floor((i + 1) * scrambleSpeed);
        if (frameRef.current >= lockFrame) {
          scrambled += char;
          completedCount += 1;
        } else {
          const randomChar = DEFAULT_CHARS[Math.floor(Math.random() * DEFAULT_CHARS.length)];
          scrambled += randomChar;
        }
      }

      setDisplayText(scrambled);

      if (completedCount === text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        isScramblingRef.current = false;
        setDisplayText(text);
      }
    }, 35);
  }, [text, scrambleSpeed]);

  useEffect(() => {
    // Initial scramble on mount
    startScramble();

    let periodicTimer: ReturnType<typeof setInterval> | null = null;
    if (autoTriggerInterval > 0) {
      periodicTimer = setInterval(() => {
        startScramble();
      }, autoTriggerInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (periodicTimer) clearInterval(periodicTimer);
    };
  }, [startScramble, autoTriggerInterval]);

  return (
    <span
      className={`inline-block select-none cursor-default font-mono transition-colors duration-200 ${className}`}
      onMouseEnter={triggerOnHover ? startScramble : undefined}
      title="Gnani AI"
    >
      {displayText}
    </span>
  );
};

export default ScrambleText;
