'use client';

import { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';

export function Header() {
  const [showJapanese, setShowJapanese] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowJapanese(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '24px 16px 18px',
        position: 'relative'
      }}
    >
      <div
        style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: 22,
          color: theme.brass,
          opacity: 0.85,
          marginBottom: 2,
          letterSpacing: '0.05em'
        }}
      >
        やり残し
      </div>

      <div style={{ position: 'relative', height: 36 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Noto Serif JP', serif",
            fontWeight: 500,
            fontSize: 28,
            color: theme.cream,
            animation: 'japaneseFade 1.4s ease-out forwards'
          }}
        >
          遣り残し
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Fraunces', serif",
            fontWeight: 300,
            fontSize: 28,
            letterSpacing: '-0.01em',
            color: theme.cream,
            animation: 'englishFade 1.4s ease-out forwards'
          }}
        >
          yarinokoshi
        </div>
      </div>

      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.2em',
          color: theme.brass,
          opacity: 0.55,
          marginTop: 8,
          textTransform: 'uppercase'
        }}
      >
        — things left to do —
      </div>
    </div>
  );
}
