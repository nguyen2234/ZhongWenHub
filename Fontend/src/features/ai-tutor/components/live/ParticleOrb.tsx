import React, { useEffect, useRef, useState } from 'react';
import type { VoiceSessionState } from '../../services/voice/voice.types';

export interface ParticleOrbProps {
  state: VoiceSessionState;
  size?: number;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

interface Particle {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  speed: number;
  angle: number;
  distance: number;
  orbitSpeed: number;
}

export const ParticleOrb: React.FC<ParticleOrbProps> = ({
  state,
  size = 280,
  className = '',
  onClick,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const [hasCanvasError, setHasCanvasError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setHasCanvasError(true);
      return;
    }

    // High DPI Canvas Scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const coreRadius = size * 0.28;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Generate ~75 particles for crisp, high-performance rendering
    const particleCount = prefersReducedMotion ? 25 : 75;
    const particles: Particle[] = [];

    // State palette
    const getPalette = () => {
      switch (state) {
        case 'SPEAKING':
          return ['#818cf8', '#6366f1', '#4f46e5', '#a5b4fc', '#c7d2fe']; // Radiant Indigo/Violet
        case 'LISTENING':
          return ['#34d399', '#10b981', '#059669', '#6ee7b7', '#a7f3d0']; // Emerald/Teal listening
        case 'PROCESSING':
          return ['#f59e0b', '#d97706', '#fbbf24', '#fcd34d', '#e0e7ff']; // Amber/Gold thinking
        case 'INTERRUPTED':
          return ['#f43f5e', '#fb7185', '#be123c', '#fda4af', '#fecdd3']; // Quick Rose burst
        case 'PAUSED':
          return ['#94a3b8', '#64748b', '#cbd5e1', '#e2e8f0']; // Subdued Slate
        case 'ERROR':
          return ['#ef4444', '#dc2626', '#f87171', '#b91c1c']; // Crimson Warning
        case 'IDLE':
        default:
          return ['#6366f1', '#8b5cf6', '#a855f7', '#818cf8', '#c084fc']; // Ambient Cosmic Indigo
      }
    };

    const palette = getPalette();

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const dist = coreRadius * (0.6 + Math.random() * 0.8);
      particles.push({
        baseX: centerX + Math.cos(angle) * dist,
        baseY: centerY + Math.sin(angle) * dist,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        radius: 1.5 + Math.random() * 3,
        color: palette[i % palette.length],
        alpha: 0.4 + Math.random() * 0.5,
        speed: 0.01 + Math.random() * 0.02,
        angle,
        distance: dist,
        orbitSpeed: (Math.random() - 0.5) * 0.015,
      });
    }

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      tick += prefersReducedMotion ? 0.005 : 0.025;

      // 1. Core Luminous Radial Glow
      const glowGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        coreRadius * 0.1,
        centerX,
        centerY,
        coreRadius * 1.4
      );

      switch (state) {
        case 'SPEAKING': {
          const pulse = Math.sin(tick * 3) * 0.15;
          glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.7)');
          glowGrad.addColorStop(0.5, 'rgba(79, 70, 229, 0.35)');
          glowGrad.addColorStop(1, 'rgba(67, 56, 202, 0)');
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius * (1.1 + pulse), 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          break;
        }
        case 'LISTENING': {
          const pulse = Math.sin(tick * 4) * 0.2;
          glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.7)');
          glowGrad.addColorStop(0.5, 'rgba(5, 150, 105, 0.35)');
          glowGrad.addColorStop(1, 'rgba(5, 150, 105, 0)');
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius * (1.15 + pulse), 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          break;
        }
        case 'PROCESSING': {
          glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.65)');
          glowGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.3)');
          glowGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius * 0.95, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          break;
        }
        case 'INTERRUPTED': {
          glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0.8)');
          glowGrad.addColorStop(0.6, 'rgba(190, 18, 60, 0.4)');
          glowGrad.addColorStop(1, 'rgba(190, 18, 60, 0)');
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius * 1.3, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          break;
        }
        case 'PAUSED': {
          glowGrad.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
          glowGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          break;
        }
        case 'ERROR': {
          glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.7)');
          glowGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          break;
        }
        case 'IDLE':
        default: {
          const breathing = Math.sin(tick * 1.5) * 0.08;
          glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.55)');
          glowGrad.addColorStop(0.6, 'rgba(124, 58, 237, 0.25)');
          glowGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
          ctx.beginPath();
          ctx.arc(centerX, centerY, coreRadius * (1 + breathing), 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
          break;
        }
      }

      // 2. Render Animated Floating Particles
      particles.forEach((p, idx) => {
        let currentDist = p.distance;
        let angleOffset = 0;

        switch (state) {
          case 'SPEAKING': {
            // Rhythmic harmonic waves expanding outward
            const wave = Math.sin(tick * 3 + p.angle * 2) * (coreRadius * 0.35);
            currentDist += wave;
            break;
          }
          case 'LISTENING': {
            // High frequency audio activity ripples
            const ripple = Math.sin(tick * 5 + idx * 0.4) * (coreRadius * 0.2);
            currentDist += ripple;
            break;
          }
          case 'PROCESSING': {
            // Convergent inward vortex rotation
            p.angle += 0.035;
            currentDist = coreRadius * 0.65 + Math.sin(tick * 2 + p.angle) * (coreRadius * 0.15);
            break;
          }
          case 'INTERRUPTED': {
            // Dispersal burst outward
            currentDist *= 1.25;
            p.angle += (Math.random() - 0.5) * 0.1;
            break;
          }
          case 'PAUSED': {
            // Nearly static
            break;
          }
          case 'IDLE':
          default: {
            // Gentle orbital undulation
            p.angle += p.orbitSpeed;
            currentDist += Math.sin(tick + idx) * 4;
            break;
          }
        }

        p.x = centerX + Math.cos(p.angle + angleOffset) * currentDist;
        p.y = centerY + Math.sin(p.angle + angleOffset) * currentDist;

        // Draw particle dot with soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();

        // Optional connecting web threads between nearby particles
        if (state === 'PROCESSING' && idx % 3 === 0 && particles[idx + 1]) {
          const nextP = particles[idx + 1];
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nextP.x, nextP.y);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.15;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
      });

      // 3. Central Core Nucleus
      ctx.beginPath();
      const innerRadius = coreRadius * (state === 'PROCESSING' ? 0.45 : 0.55);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle =
        state === 'LISTENING'
          ? 'rgba(16, 185, 129, 0.85)'
          : state === 'PROCESSING'
          ? 'rgba(245, 158, 11, 0.9)'
          : state === 'INTERRUPTED'
          ? 'rgba(244, 63, 94, 0.9)'
          : state === 'ERROR'
          ? 'rgba(239, 68, 68, 0.9)'
          : 'rgba(99, 102, 241, 0.85)';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [state, size]);

  if (hasCanvasError) {
    // Fallback UI when Canvas 2D is unavailable
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          border: '2px solid var(--primary)',
        }}
      >
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 700 }}>
          {state}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`particle-orb-container ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
      title={`AI Tutor trạng thái: ${state}`}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: '50%',
          filter: 'drop-shadow(0 0 25px rgba(99, 102, 241, 0.25))',
        }}
      />
    </div>
  );
};
