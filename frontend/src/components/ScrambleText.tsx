import React, { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!?';

interface ScrambleTextProps {
  text: string;
  className?: string;
  pauseDuration?: number; // ms to pause after resolving before restarting (default 2500)
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text = 'GNANI AI',
  className = '',
  pauseDuration = 2500
}) => {
  const [displayText, setDisplayText] = useState(text);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    let iteration = 0;
    let frame = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    function scramble() {
      if (isCancelled) return;
      frame++;

      // Only update every 3rd frame for slower effect
      if (frame % 3 === 0) {
        const next = text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (i < iteration) return text[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');

        setDisplayText(next);
        iteration += 0.15;
      }

      if (iteration < text.length) {
        timeoutId = setTimeout(scramble, 50);
      } else {
        setDisplayText(text);
        iteration = 0;
        frame = 0;
        timeoutId = setTimeout(scramble, pauseDuration);
      }
    }

    scramble();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [text, pauseDuration]);

  return (
    <span
      className={`scramble-text inline-block font-mono font-extrabold cursor-default select-none transition-all ${className}`}
      data-text={text}
    >
      {displayText}
    </span>
  );
};

export default ScrambleText;
