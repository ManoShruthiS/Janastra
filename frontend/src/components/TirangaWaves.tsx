import React from 'react';

export const TirangaWaves: React.FC = () => {
  return (
    <div className="wave-bg" aria-hidden="true">
      <svg
        className="waves"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
          />
        </defs>
        <g className="parallax">
          {/* Top Layer: Saffron / Kesari */}
          <use href="#gentle-wave" x="48" y="0" fill="rgba(255, 140, 0, 0.45)" />
          {/* Second Layer: Ashoka Chakra Navy Blue accent */}
          <use href="#gentle-wave" x="48" y="3" fill="rgba(0, 36, 125, 0.35)" />
          {/* Third Layer: Silver / White */}
          <use href="#gentle-wave" x="48" y="5" fill="rgba(255, 255, 255, 0.3)" />
          {/* Base Layer: India Green */}
          <use href="#gentle-wave" x="48" y="7" fill="rgba(19, 136, 8, 0.55)" />
        </g>
      </svg>
    </div>
  );
};
