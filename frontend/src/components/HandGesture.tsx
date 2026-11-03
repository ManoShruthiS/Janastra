import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface HandGestureProps {
  size?: number;
  className?: string;
  src?: string;
}

export const HandGesture: React.FC<HandGestureProps> = ({
  size = 42,
  className = '',
  // High-performance, free public hosted dotLottie animation
  src = 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie'
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Beautiful SVG wave gesture fallback with CSS keyframe animation
    return (
      <div
        className={`inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
        title="Waving Hand"
      >
        <span
          className="inline-block text-2xl transform origin-[70%_70%] animate-hand-wave filter drop-shadow-md"
          role="img"
          aria-label="wave"
        >
          👋
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <DotLottieReact
        src={src}
        loop
        autoplay
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default HandGesture;
