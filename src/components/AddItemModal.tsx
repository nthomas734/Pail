'use client';

import { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  CATEGORIES,
  TIME_WINDOW_LABELS,
  supabase,
  type Category,
  type TimeWindow
} from '@/lib/supabase';

interface AddItemModalProps {
  onClose: () => void;
  onAdded: () => void;
}

const TIME_WINDOWS: { code: TimeWindow; label: string }[] = [
  { code: 'any',    label: 'any time' },
  { code: 'spring', label: 'spring' },
  { code: 'summer', label: 'summer' },
  { code: 'fall',   label: 'fall' },
  { code: 'winter', label: 'winter' },
  { code: 'jan', label: 'jan' }, { code: 'feb', label: 'feb' }, { code: 'mar', label: 'mar' },
  { code: 'apr', label: 'apr' }, { code: 'may', label: 'may' }, { code: 'jun', label: 'jun' },
  { code: 'jul', label: 'jul' }, { code: 'aug', label: 'aug' }, { code: 'sep', label: 'sep' },
  { code: 'oct', label: 'oct' }, { code: 'nov', label: 'nov' }, { code: 'dec', label: 'dec' }
];

export function AddItemModal({ onClose, onAdded }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('just');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('any');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function handleSubmit() {
    if (!title.trim()) {
      setError('title is required');
      return;
    }
    setSubmitting(true);
    setError(null);

    const addedBy = typeof window !== 'undefined'
      ? localStorage.getItem('yarinokoshi_user') || null
      : null;

    const { error: dbError } = await supabase.from('items').insert({
      title: title.trim(),
      category,
      time_window: timeWindow,
      status: 'dreaming',
      notes: notes.trim() || null,
      added_by: addedBy
    });

    setSubmitting(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      onAdded();
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: theme.bg,
          borderTop: `1px solid ${theme.dimmer}`,
          borderRadius: '16px 16px 0 0',
          padding: '20px 18px calc(28px + env(safe-area-inset-bottom))',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            background: theme.dimmer,
            borderRadius: 2,
            margin: '0 auto 18px'
          }}
        />

        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            color: theme.brass,
            textTransform: 'uppercase',
            marginBottom: 4,
            opacity: 0.7
          }}
        >
          new departure
        </div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 300,
            fontSize: 22,
            color: theme.cream,
            marginBottom: 22
          }}
        >
          add to the board
        </div>

        {/* Title */}
        <Label>destination</Label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="what do you want to do?"
          autoFocus
          style={{
            width: '100%',
            background: theme.surface,
            border: `1px solid ${theme.dimmer}`,
            borderRadius: 4,
            padding: '12px 12px',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 13,
            letterSpacing: '0.04em',
            color: theme.tileText,
            textTransform: 'uppercase',
            marginBottom: 18
          }}
        />

        {/* Category */}
        <Label>category</Label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginBottom: 18
          }}
        >
          {CATEGORIES.map(c => (
            <PillButton
              key={c.code}
              active={category === c.code}
              onClick={() => setCategory(c.code)}
            >
              {c.label}
            </PillButton>
          ))}
        </div>

        {/* Time window */}
        <Label>time window</Label>
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 6,
            marginBottom: 18
          }}
        >
          {TIME_WINDOWS.map(w => (
            <PillButton
              key={w.code}
              active={timeWindow === w.code}
              onClick={() => setTimeWindow(w.code)}
              style={{ flexShrink: 0 }}
            >
              {w.label}
            </PillButton>
          ))}
        </div>

        {/* Notes */}
        <Label>notes (optional)</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="any details — links, who suggested it, why it matters…"
          rows={3}
          style={{
            width: '100%',
            background: theme.surface,
            border: `1px solid ${theme.dimmer}`,
            borderRadius: 4,
            padding: '10px 12px',
            fontFamily: "'Manrope', sans-serif",
            fontSize: 13,
            color: theme.cream,
            resize: 'none',
            marginBottom: 18,
            lineHeight: 1.5
          }}
        />

        {error && (
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              color: '#d97a7a',
              marginBottom: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '14px 0',
              border: `1px solid ${theme.dimmer}`,
              borderRadius: 3,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.15em',
              color: theme.cream,
              textTransform: 'uppercase',
              opacity: 0.8
            }}
          >
            cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '14px 0',
              background: theme.brass,
              color: theme.board,
              borderRadius: 3,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.15em',
              fontWeight: 700,
              textTransform: 'uppercase',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {submitting ? 'adding…' : '+ add to board'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.2em',
        color: theme.brass,
        opacity: 0.65,
        marginBottom: 6,
        textTransform: 'uppercase'
      }}
    >
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
  style
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '8px 10px',
        border: `1px solid ${active ? theme.brass : theme.dimmer}`,
        borderRadius: 3,
        color: active ? theme.board : theme.cream,
        background: active ? theme.brass : 'transparent',
        fontWeight: active ? 700 : 400,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {children}
    </button>
  );
}
