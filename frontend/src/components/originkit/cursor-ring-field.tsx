import React, { useEffect, useRef } from 'react';

export interface CursorRingFieldProps {
  className?: string;
  gridSize?: number;
  ringRadius?: number;
  ringWidth?: number;
  capsuleWidth?: number;
  capsuleHeight?: number;
  baseColor?: string;
  activeColor?: string;
}

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseAngle: number;
  angle: number;
  intensity: number;
}

export const CursorRingField: React.FC<CursorRingFieldProps> = ({
  className = '',
  gridSize = 38,
  ringRadius = 125,
  ringWidth = 45,
  capsuleWidth = 2.5,
  capsuleHeight = 9,
  baseColor = 'rgba(115, 115, 125, 0.16)',
  activeColor = 'rgba(212, 175, 55, 0.85)'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Smooth cursor interpolation
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
      speed: 0
    };

    let prevMouseX = -9999;
    let prevMouseY = -9999;

    const initParticles = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      particles = [];
      const cols = Math.ceil(width / gridSize) + 2;
      const rows = Math.ceil(height / gridSize) + 2;
      const startX = -gridSize;
      const startY = -gridSize;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Stagger alternate rows slightly for natural modern organic scatter
          const offsetX = (r % 2 === 0 ? 0 : gridSize * 0.5);
          const bx = startX + c * gridSize + offsetX;
          const by = startY + r * gridSize;

          particles.push({
            baseX: bx,
            baseY: by,
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            baseAngle: 0,
            angle: 0,
            intensity: 0
          });
        }
      }
    };

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      initParticles();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);

    initParticles();

    // Physics constants
    const spring = 0.085;
    const friction = 0.82;
    const maxPush = 22;

    const render = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Interpolate mouse coordinates smoothly (spring/lerp)
      if (mouse.active) {
        if (mouse.x < -1000) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          const dx = mouse.targetX - mouse.x;
          const dy = mouse.targetY - mouse.y;
          mouse.x += dx * 0.16;
          mouse.y += dy * 0.16;
          mouse.speed = Math.hypot(dx, dy);
        }
      } else {
        mouse.x += (-9999 - mouse.x) * 0.1;
        mouse.y += (-9999 - mouse.y) * 0.1;
        mouse.speed *= 0.9;
      }

      // Draw faint cursor ring aura when active
      if (mouse.active && mouse.x > 0 && mouse.x < width && mouse.y > 0 && mouse.y < height) {
        const ringGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          Math.max(0, ringRadius - ringWidth * 0.8),
          mouse.x,
          mouse.y,
          ringRadius + ringWidth * 0.8
        );
        ringGrad.addColorStop(0, 'rgba(210, 210, 220, 0)');
        ringGrad.addColorStop(0.5, 'rgba(210, 210, 225, 0.06)');
        ringGrad.addColorStop(0.7, 'rgba(180, 180, 195, 0.03)');
        ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, ringRadius + ringWidth, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        let targetIntensity = 0;
        let pushX = 0;
        let pushY = 0;
        let targetAngle = p.baseAngle;

        if (mouse.active && mouse.x > -500) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          // Distance from the ring radius crest
          const distFromCrest = Math.abs(dist - ringRadius);

          if (distFromCrest < ringWidth && dist > 1) {
            // Smooth bell curve around the ring crest
            const norm = distFromCrest / ringWidth;
            const factor = Math.cos(norm * Math.PI * 0.5); // 1 at crest, 0 at bounds
            targetIntensity = Math.pow(factor, 1.4);

            // Shove outward along radial direction
            const pushDirX = dx / dist;
            const pushDirY = dy / dist;
            const pushMag = maxPush * factor;

            pushX = pushDirX * pushMag;
            pushY = pushDirY * pushMag;

            // Orient capsule along the wave expansion / tangential blend
            targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
          }
        }

        // Spring physics towards base position + push offset
        const targetX = p.baseX + pushX;
        const targetY = p.baseY + pushY;

        const ax = (targetX - p.x) * spring;
        const ay = (targetY - p.y) * spring;

        p.vx = (p.vx + ax) * friction;
        p.vy = (p.vy + ay) * friction;
        p.x += p.vx;
        p.y += p.vy;

        // Smoothly interpolate intensity and angle
        p.intensity += (targetIntensity - p.intensity) * 0.2;
        p.angle += (targetAngle - p.angle) * 0.15;

        // Draw capsule
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        const currentWidth = capsuleWidth + p.intensity * 1.5;
        const currentHeight = capsuleHeight + p.intensity * 7;

        // Capsule geometry (pill)
        ctx.beginPath();
        const r = currentWidth / 2;
        const top = -currentHeight / 2;
        const bottom = currentHeight / 2;

        ctx.arc(0, top + r, r, Math.PI, 0, false);
        ctx.arc(0, bottom - r, r, 0, Math.PI, false);
        ctx.closePath();

        if (p.intensity > 0.05) {
          // Dynamic active state: sleek metallic platinum silver
          const alpha = 0.25 + p.intensity * 0.75;
          ctx.fillStyle = `rgba(228, 228, 235, ${alpha})`;
          ctx.shadowColor = 'rgba(212, 212, 220, 0.45)';
          ctx.shadowBlur = p.intensity * 8;
        } else {
          ctx.fillStyle = baseColor;
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [gridSize, ringRadius, ringWidth, capsuleWidth, capsuleHeight, baseColor, activeColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
};

export default CursorRingField;
