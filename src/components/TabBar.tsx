'use client';

import { theme } from '@/lib/theme';

export type TabKey = 'board' | 'timeline' | 'memories';

interface TabBarProps {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'board',    label: 'board',    icon: <BoardIcon /> },
  { key: 'timeline', label: 'timeline', icon: <TimelineIcon /> },
  { key: 'memories', label: 'memories', icon: <MemoryIcon /> }
];

export function TabBar({ tab, onChange }: TabBarProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${theme.dimmer}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          padding: '8px 0 6px'
        }}
      >
        {TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 4px',
                color: active ? theme.brass : theme.dim,
                transition: 'color 0.2s ease'
              }}
            >
              {icon}
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: active ? 700 : 400
                }}
              >
                {label}
              </span>
              {active && (
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: theme.brass,
                    marginTop: -2
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BoardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="9" width="14" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="14" width="14" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="10" cy="11" r="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" />
      <circle cx="10" cy="16" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7.5" cy="8" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 13l4-3 3 2 4-4 3 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}
