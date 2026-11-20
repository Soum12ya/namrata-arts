import React, { useEffect, useRef } from 'react';

export default function HeroMotionCanvas() {
  const canvasRef = useRef(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerRef.current.targetX = (e.clientX - rect.left) / rect.width;
      pointerRef.current.targetY = (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const strands = [
      { yRatio: 0.22, amp: 34, freq: 0.0022, speed: 0.00055, color: 'rgba(181, 69, 52, 0.14)', width: 1.4, dash: [] },
      { yRatio: 0.36, amp: 46, freq: 0.0018, speed: 0.00042, color: 'rgba(28, 25, 23, 0.09)', width: 2.2, dash: [] },
      { yRatio: 0.52, amp: 28, freq: 0.0028, speed: 0.00062, color: 'rgba(194, 139, 55, 0.16)', width: 1.2, dash: [6, 5] },
      { yRatio: 0.68, amp: 42, freq: 0.0019, speed: 0.00048, color: 'rgba(41, 59, 77, 0.12)', width: 1.5, dash: [] },
      { yRatio: 0.81, amp: 26, freq: 0.0025, speed: 0.00038, color: 'rgba(184, 125, 118, 0.15)', width: 1.1, dash: [3, 6] },
    ];

    let t = 0;
    const render = () => {
      t += 16;
      pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.04;
      pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const mx = (pointerRef.current.x - 0.5) * 90;
      const my = (pointerRef.current.y - 0.5) * 60;

      strands.forEach((s, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
        ctx.setLineDash(s.dash);
        ctx.lineCap = 'round';

        const baseY = height * s.yRatio;
        for (let x = -20; x <= width + 20; x += 18) {
          const distFromPointer = Math.abs(x / (width || 1) - pointerRef.current.x);
          const pull = Math.max(0, 1 - distFromPointer * 2.2) * my * 0.75;
          const wave =
            Math.sin(x * s.freq + t * s.speed + idx * 1.4) * s.amp +
            Math.cos(x * (s.freq * 0.55) - t * (s.speed * 0.7)) * (s.amp * 0.35);
          const y = baseY + wave + pull + mx * 0.08 * (idx % 2 === 0 ? 1 : -1);
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}