"use client";

import { useRef, useEffect, type CSSProperties } from "react";

interface KineticGridProps {
  background?: string;
  dotColor?: string;
  lineColor?: string;
  trailColor?: string;
  spacing?: number;
  radius?: number;
  strength?: number;
  trail?: boolean;
  windowTracking?: boolean;
  style?: CSSProperties;
}

const DEFAULTS = {
  background: "transparent",
  dotColor: "#1565C0",
  lineColor: "#1E5A8A",
  trailColor: "#1E5A8A",
  spacing: 30,
  radius: 400,
  strength: 4,
  trail: true,
};

export default function KineticGrid(props: KineticGridProps) {
  const cfg = { ...DEFAULTS, ...props };

  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const trailRef = useRef<{ x: number; y: number; t: number }[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GAP = Math.max(8, cfg.spacing);
    const R = Math.max(1, cfg.radius);
    const PULL = (Math.max(1, Math.min(10, cfg.strength)) / 10) * 4;

    let W = 1;
    let H = 1;
    let cols: { hx: number; hy: number; x: number; y: number; vx: number; vy: number }[][] = [];
    let dots: { hx: number; hy: number; x: number; y: number; vx: number; vy: number }[] = [];

    const build = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = [];
      dots = [];
      const nCols = Math.floor(W / GAP) + 2;
      const nRows = Math.floor(H / GAP) + 2;
      for (let c = 0; c < nCols; c++) {
        const col: typeof dots = [];
        for (let ri = 0; ri < nRows; ri++) {
          const hx = c * GAP;
          const hy = ri * GAP;
          const d = { hx, hy, x: hx, y: hy, vx: 0, vy: 0 };
          col.push(d);
          dots.push(d);
        }
        cols.push(col);
      }
    };

    const setMouse = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      const mx = clientX - r.left;
      const my = clientY - r.top;
      mouseRef.current.x = mx;
      mouseRef.current.y = my;
      mouseRef.current.active = true;
      const now = performance.now();
      trailRef.current.push({ x: mx, y: my, t: now });
      if (trailRef.current.length > 80) trailRef.current.shift();
    };

    const onMove = (e: MouseEvent) => setMouse(e.clientX, e.clientY);
    const onLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setMouse(t.clientX, t.clientY);
    };

    host.addEventListener("mousemove", onMove);
    host.addEventListener("mouseleave", onLeave);
    host.addEventListener("touchmove", onTouch, { passive: true });
    host.addEventListener("touchend", onLeave);

    if (cfg.windowTracking) {
      window.addEventListener("mousemove", onMove);
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    const ro = new ResizeObserver(() => build());
    ro.observe(host);

    build();

    let raf = 0;
    const frame = () => {
      const m = mouseRef.current;
      ctx.clearRect(0, 0, W, H);

      for (const d of dots) {
        let ax = (d.hx - d.x) * 0.08;
        let ay = (d.hy - d.y) * 0.08;
        if (m.active) {
          const dx = m.x - d.x;
          const dy = m.y - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < R && dist > 0.001) {
            const f = (1 - dist / R) * PULL;
            ax += (dx / dist) * f;
            ay += (dy / dist) * f;
          }
        }
        d.vx = (d.vx + ax) * 0.82;
        d.vy = (d.vy + ay) * 0.82;
        d.x += d.vx;
        d.y += d.vy;
      }

      for (let c = 0; c < cols.length; c++) {
        for (let ri = 0; ri < cols[c].length; ri++) {
          const d = cols[c][ri];
          const right = cols[c + 1]?.[ri];
          const down = cols[c]?.[ri + 1];
          const prox = m.active ? Math.max(0, 1 - Math.sqrt((m.x - d.x) ** 2 + (m.y - d.y) ** 2) / R) : 0;
          if (right) {
            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = cfg.lineColor;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          }
          if (down) {
            ctx.globalAlpha = 0.12;
            ctx.strokeStyle = cfg.lineColor;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(down.x, down.y);
            ctx.stroke();
          }
        }
      }

      for (const d of dots) {
        const prox = m.active ? Math.max(0, 1 - Math.sqrt((m.x - d.x) ** 2 + (m.y - d.y) ** 2) / R) : 0;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = cfg.dotColor;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.2, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (cfg.trail) {
        const now = performance.now();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 1; i < trailRef.current.length; i++) {
          const a = trailRef.current[i - 1];
          const b = trailRef.current[i];
          const age = now - b.t;
          if (age > 260) continue;
          ctx.globalAlpha = Math.max(0, 1 - age / 260) * 0.85;
          ctx.strokeStyle = cfg.trailColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("mousemove", onMove);
      host.removeEventListener("mouseleave", onLeave);
      host.removeEventListener("touchmove", onTouch);
      host.removeEventListener("touchend", onLeave);

      if (cfg.windowTracking) {
        window.removeEventListener("mousemove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
    };
  }, [cfg.background, cfg.dotColor, cfg.lineColor, cfg.trailColor, cfg.spacing, cfg.radius, cfg.strength, cfg.trail, cfg.windowTracking]);

  return (
    <div
      ref={hostRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: cfg.background,
        cursor: "crosshair",
        pointerEvents: "auto",
        ...(cfg.style || {}),
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
