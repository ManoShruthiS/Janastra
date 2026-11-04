import React, { useRef, useState, useCallback } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magneticStrength?: number; // 0 to disable, default 0.18
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  magneticStrength = 0.18,
  onClick,
  disabled,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Magnetic cursor tracking
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current || magneticStrength <= 0) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * magneticStrength;
    const distanceY = (e.clientY - centerY) * magneticStrength;
    setPosition({ x: distanceX, y: distanceY });
  }, [disabled, magneticStrength]);

  const handlePointerLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  // Monochromatic subtle ripple click effect
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const rippleSize = Math.max(rect.width, rect.height) * 2.2;
      const newRipple: Ripple = {
        id: Date.now(),
        x: clickX,
        y: clickY,
        size: rippleSize
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 650);
    }

    if (onClick) onClick(e);
  }, [disabled, onClick]);

  return (
    <button
      ref={buttonRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      disabled={disabled}
      style={{
        transform: disabled ? 'none' : `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: position.x === 0 && position.y === 0 ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'transform 0.1s ease-out'
      }}
      className={`group relative overflow-hidden select-none active:scale-[0.985] active:translate-y-[1px] transition-all duration-200 ${className}`}
      {...props}
    >
      {/* Monochromatic Ripple Layer */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-monochrome-ripple"
          style={{
            top: ripple.y - ripple.size / 2,
            left: ripple.x - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: 'rgba(255, 255, 255, 0.14)'
          }}
          aria-hidden="true"
        />
      ))}

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center space-x-2 w-full h-full">
        {children}
      </span>
    </button>
  );
};

export default MagneticButton;
