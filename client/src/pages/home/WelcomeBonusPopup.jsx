import React, { useEffect, useRef, useState } from 'react';
import { MdOutlineLocalOffer } from "react-icons/md";

export default function WelcomeBonusPopup({ onClose, username = 'New Member', bonusAmount = 200 }) {
  const canvasRef = useRef(null);
  const animIdRef = useRef(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [phase, setPhase] = useState('envelope'); // 'envelope' | 'transitioning' | 'card'
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOverlayVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Confetti
  useEffect(() => {
    if (!confettiActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cols = [
      '#f59e0b','#fbbf24','#fde68a',
      '#4ade80','#22c55e','#86efac',
      '#60a5fa','#a78bfa','#f472b6',
      '#fb7185','#ffffff','#34d399',
    ];
    let pts = [];
    let running = true;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const mk = () => {
      const x = canvas.width / 2 + (Math.random() - 0.5) * 80;
      const y = canvas.height / 2 + 40;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
      const sp = Math.random() * 12 + 5;
      return {
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        c: cols[Math.floor(Math.random() * cols.length)],
        s: Math.random() * 10 + 4,
        r: Math.random() * 360,
        rs: (Math.random() - 0.5) * 12,
        sh: Math.random() > 0.35 ? 'r' : 'c',
        o: 1,
        g: 0.013 + Math.random() * 0.01,
      };
    };

    for (let i = 0; i < 90; i++) pts.push(mk());

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (pts.length < 160) for (let i = 0; i < 4; i++) pts.push(mk());
      pts = pts.filter(p => p.o > 0.03);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.18;
        p.r += p.rs; p.o -= p.g;
        ctx.save();
        ctx.globalAlpha = p.o;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.r * Math.PI) / 180);
        ctx.fillStyle = p.c;
        if (p.sh === 'r') {
          ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      if (pts.length > 0) animIdRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [confettiActive]);

  const handleEnvelopeTap = () => {
    if (phase !== 'envelope') return;
    setPhase('transitioning');
    setTimeout(() => {
      setPhase('card');
      setConfettiActive(true);
    }, 500);
  };

  const handleClose = () => {
    setOverlayVisible(false);
    setTimeout(onClose, 320);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        transition: 'opacity 0.32s ease',
        opacity: overlayVisible ? 1 : 0,
      }}
    >
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 1,
        }}
      />

      {/* ── ENVELOPE (phase: envelope / transitioning) ───────────────────── */}
      <div
        onClick={handleEnvelopeTap}
        style={{
          position: 'absolute',
          zIndex: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: phase === 'envelope' ? 'pointer' : 'default',
          transition: 'opacity 0.45s ease, transform 0.45s ease',
          opacity: phase === 'card' ? 0 : 1,
          transform: phase === 'card' ? 'scale(0.7) translateY(60px)' : 'scale(1) translateY(0)',
          pointerEvents: phase === 'card' ? 'none' : 'auto',
        }}
      >
        {/* Envelope body */}
        <div style={{
          position: 'relative',
          width: '300px',
          height: '200px',
        }}>
          {/* Glow ring behind envelope */}
          <div style={{
            position: 'absolute',
            inset: '-18px',
            borderRadius: '20px',
            background: 'radial-gradient(ellipse at center, rgba(250,204,21,0.18) 0%, transparent 70%)',
            zIndex: 0,
          }} />

          {/* Envelope back */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '178px',
            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
            borderRadius: '12px',
            border: '2px solid #fcd34d',
            zIndex: 2,
            overflow: 'hidden',
          }}>
            {/* V-fold lines */}
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: 'polygon(0 100%, 0 0, 49% 54%)',
              background: 'rgba(0,0,0,0.12)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: 'polygon(100% 100%, 100% 0, 51% 54%)',
              background: 'rgba(0,0,0,0.12)',
            }} />
            {/* Bottom fold line */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '50%',
              clipPath: 'polygon(0 100%, 50% 0%, 100% 100%)',
              background: 'rgba(255,255,255,0.08)',
            }} />
          </div>

          {/* Flap (animates open when tapping) */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '300px', height: '155px',
            transformOrigin: 'top center',
            transform: phase === 'transitioning' || phase === 'card'
              ? 'perspective(600px) rotateX(-170deg)'
              : 'perspective(600px) rotateX(0deg)',
            transition: 'transform 0.5s ease-in-out',
            transformStyle: 'preserve-3d',
            zIndex: 10,
          }}>
            {/* Flap inner (darker amber) */}
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: 'polygon(0 0, 100% 0, 50% 57%)',
              background: '#b45309',
              borderRadius: '12px 12px 0 0',
            }} />
            {/* Flap outer */}
            <div style={{
              position: 'absolute', inset: 0,
              clipPath: 'polygon(0 0, 100% 0, 50% 57%)',
              background: 'linear-gradient(160deg, #fbbf24 0%, #f59e0b 100%)',
              border: '2px solid #fcd34d',
              borderRadius: '12px 12px 0 0',
            }} />
          </div>

          {/* Wax seal */}
          <div style={{
            position: 'absolute',
            bottom: '62px', left: '50%',
            transform: phase !== 'envelope'
              ? 'translateX(-50%) scale(0)'
              : 'translateX(-50%) scale(1)',
            transition: 'transform 0.25s ease',
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            border: '3px solid #fca5a5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', zIndex: 20,
            boxShadow: '0 0 0 4px rgba(239,68,68,0.25)',
          }}><MdOutlineLocalOffer/></div>

          {/* Stars decoration */}
          {['✦','✦','✦'].map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: ['-14px','10px','-10px'][i],
              left: ['-16px', undefined, undefined][i],
              right: [undefined,'−14px','−18px'][i] === undefined ? [undefined,'-14px','-20px'][i] : undefined,
              color: ['#fbbf24','#fcd34d','#f59e0b'][i],
              fontSize: ['18px','14px','11px'][i],
              opacity: 0.85,
              animation: `twinkle${i} 2s ease-in-out infinite`,
            }}>{s}</div>
          ))}
        </div>

        {/* Tap hint */}
        <div style={{
          marginTop: '20px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', color: '#fbbf24',
          letterSpacing: '0.05em', fontWeight: 500,
          animation: 'envpulse 1.8s ease-in-out infinite',
        }}>
          <span style={{ fontSize: '18px' }}>👆</span>
          Tap to open your bonus
        </div>
      </div>

      {/* ── BONUS CARD (phase: card) ──────────────────────────────────────── */}
<div style={{
  position: 'absolute',
  zIndex: 7,
  transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
  opacity: phase === 'card' ? 1 : 0,
  transform: phase === 'card' ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(30px)',
  pointerEvents: phase === 'card' ? 'auto' : 'none',
  maxWidth: '380px',
  width: 'calc(100% - 32px)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  borderRadius: '24px',
}}>
  <div style={{
    background: '#ffffff',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #f1f5f9',
  }}>
    {/* Card Header — Clean Emerald Gradient Banner */}
    <div style={{
      background: 'linear-gradient(135deg, #065f46 0%, #0f766e 100%)',
      padding: '40px 24px 32px',
      textAlign: 'center',
      position: 'relative',
    }}>
      {/* Premium subtle glow background */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '140px', height: '140px', borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.04)',
        filter: 'blur(10px)',
      }} />

      {/* Modern Minimalist Close Button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255, 255, 255, 0.12)', border: 'none',
          borderRadius: '50%', width: '30px', height: '30px',
          cursor: 'pointer', color: '#fff', fontSize: '11px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
      >✕</button>

      {/* Elegant Badge */}
      <div style={{
        display: 'inline-block',
        background: 'rgba(255, 255, 255, 0.15)',
        color: '#ffffff', fontSize: '11px', fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        padding: '6px 16px', borderRadius: '100px', marginBottom: '16px',
      }}>
        🎉 Welcome Bonus
      </div>

      {/* Premium Currency Display */}
      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.05em', marginBottom: '4px' }}>BDT</div>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '64px', fontWeight: 800,
        color: '#ffffff', lineHeight: 1,
      }}>{bonusAmount}</div>
    </div>

    {/* Card Body */}
    <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>
      {/* Clean & Direct Typography */}
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
        Welcome, {username}!
      </div>
      
      <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '28px' }}>
        Your account is ready and a <strong style={{ color: '#0f766e', fontWeight: 600 }}>{bonusAmount} BDT</strong> bonus has been credited straight to your balance.
      </div>

      {/* Modern High-Contrast CTA Button */}
      <button
        onClick={handleClose}
        style={{
          width: '100%', padding: '16px',
          background: '#0f766e',
          color: '#ffffff', fontSize: '15px', fontWeight: 600,
          border: 'none', borderRadius: '14px', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { 
          e.currentTarget.style.background = '#115e59';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => { 
          e.currentTarget.style.background = '#0f766e';
          e.currentTarget.style.transform = 'none';
        }}
      >
        Start Playing Now
      </button>

      {/* Tiny Instant-indicator Footer */}
      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px' }}>
        Available in your main balance
      </div>
    </div>
  </div>
</div>
      <style>{`
        @keyframes envpulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes twinkle0 { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes twinkle1 { 0%,100%{opacity:.6;transform:scale(1)} 60%{opacity:1;transform:scale(1.2)} }
        @keyframes twinkle2 { 0%,100%{opacity:.3;transform:scale(1)} 40%{opacity:.9;transform:scale(1.25)} }
      `}</style>
    </div>
  );
}