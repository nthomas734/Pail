'use client';

import { useEffect, useRef, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  CATEGORIES,
  MONTHS,
  SEASONS,
  supabase,
  type Category,
  type Month,
  type Season
} from '@/lib/supabase';

interface AddItemModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddItemModal({ onClose, onAdded }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('just');
  const [seasons, setSeasons] = useState<Set<Season>>(new Set());
  const [months, setMonths] = useState<Set<Month>>(new Set());
  const [showMonths, setShowMonths] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(null), 3500);
    return () => clearTimeout(t);
  }, [justAdded]);

  function toggleSeason(s: Season) {
    setSeasons(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }
  function toggleMonth(m: Month) {
    setMonths(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }

  async function handleSubmit(addAnother: boolean) {
    if (!title.trim()) {
      setError('title is required');
      return;
    }
    if (showDateRange && dateStart && dateEnd && dateEnd < dateStart) {
      setError('end date must be after start date');
      return;
    }
    setSubmitting(true);
    setError(null);

    const addedBy = typeof window !== 'undefined'
      ? localStorage.getItem('pail_user') || null
      : null;

    const savedTitle = title.trim();

    const { error: dbError } = await supabase.from('pail_items').insert({
      title: savedTitle,
      category,
      seasons: Array.from(seasons),
      months: Array.from(months),
      date_start: showDateRange && dateStart ? dateStart : null,
      date_end: showDateRange && dateEnd ? dateEnd : (showDateRange && dateStart ? dateStart : null),
      time_window: 'any', // legacy
      status: 'someday',
      notes: notes.trim() || null,
      added_by: addedBy
    });

    setSubmitting(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    if (addAnother) {
      setTitle('');
      setNotes('');
      // Keep category, seasons, months, date range — usually adding similar items
      setJustAdded(savedTitle);
      setTimeout(() => titleInputRef.current?.focus(), 50);
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
        <div style={{ width: 40, height: 4, background: theme.dimmer, borderRadius: 2, margin: '0 auto 18px' }} />

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
          new item
        </div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 300,
            fontSize: 22,
            color: theme.cream,
            marginBottom: justAdded ? 12 : 22
          }}
        >
          add to the pail
        </div>

        {justAdded && (
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              color: theme.done,
              padding: '8px 12px',
              border: `1px solid ${theme.done}`,
              borderRadius: 3,
              marginBottom: 18,
              background: 'rgba(107, 142, 107, 0.08)',
              textTransform: 'uppercase',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            ✓ added "{justAdded}"
          </div>
        )}

        <Label>what do you want to do?</Label>
        <input
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. lincoln park beavers"
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

        <Label>category</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 18 }}>
          {CATEGORIES.map(c => (
            <CategoryButton
              key={c.code}
              active={category === c.code}
              onClick={() => setCategory(c.code)}
              color={c.color}
              label={c.label}
            />
          ))}
        </div>

        <Label>season tags (optional)</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
          {SEASONS.map(s => (
            <PillButton
              key={s.code}
              active={seasons.has(s.code)}
              onClick={() => toggleSeason(s.code)}
            >
              {s.label}
            </PillButton>
          ))}
        </div>

        {/* Specific months toggle */}
        <button
          onClick={() => setShowMonths(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 0',
            marginBottom: showMonths ? 8 : 12,
            background: 'transparent',
            border: 'none',
            color: theme.brass,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.8
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1, width: 14 }}>{showMonths ? '−' : '+'}</span>
          specific month{months.size > 0 ? `s (${months.size})` : 's'}
        </button>

        {showMonths && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginBottom: 14 }}>
            {MONTHS.map(m => (
              <PillButton
                key={m.code}
                active={months.has(m.code)}
                onClick={() => toggleMonth(m.code)}
              >
                {m.label}
              </PillButton>
            ))}
          </div>
        )}

        {/* Specific date range toggle */}
        <button
          onClick={() => setShowDateRange(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 0',
            marginBottom: showDateRange ? 8 : 16,
            background: 'transparent',
            border: 'none',
            color: theme.brass,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.8
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1, width: 14 }}>{showDateRange ? '−' : '+'}</span>
          specific date / range
        </button>

        {showDateRange && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 18,
              padding: 12,
              background: theme.surface,
              borderRadius: 4,
              border: `1px solid ${theme.dimmer}`
            }}
          >
            <div>
              <SubLabel>from</SubLabel>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                style={dateInputStyle}
              />
            </div>
            <div>
              <SubLabel>to (optional)</SubLabel>
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                min={dateStart || undefined}
                style={dateInputStyle}
              />
            </div>
          </div>
        )}

        <Label>notes (optional)</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="links, who suggested it, why it matters…"
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
          <button onClick={onClose} style={btnSecondary}>close</button>
          <button onClick={() => handleSubmit(true)} disabled={submitting} style={{ ...btnOutline, opacity: submitting ? 0.5 : 1 }}>
            + add another
          </button>
          <button onClick={() => handleSubmit(false)} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'adding…' : '+ add & done'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Geist Mono', monospace",
      fontSize: 9,
      letterSpacing: '0.2em',
      color: theme.brass,
      opacity: 0.65,
      marginBottom: 6,
      textTransform: 'uppercase'
    }}>
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Geist Mono', monospace",
      fontSize: 8,
      letterSpacing: '0.15em',
      color: theme.dim,
      textTransform: 'uppercase',
      marginBottom: 4
    }}>
      {children}
    </div>
  );
}

function CategoryButton({
  active, onClick, color, label
}: { active: boolean; onClick: () => void; color: string; label: string; }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: "'Geist Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '10px 12px',
        border: `1px solid ${active ? theme.brass : theme.dimmer}`,
        borderRadius: 3,
        color: active ? theme.cream : theme.dim,
        background: active ? 'rgba(214, 185, 125, 0.12)' : 'transparent',
        fontWeight: active ? 600 : 400,
        textAlign: 'left'
      }}
    >
      <span
        style={{
          width: 9, height: 9, borderRadius: '50%',
          background: color,
          opacity: active ? 1 : 0.5,
          flexShrink: 0
        }}
      />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

function PillButton({
  active, onClick, children
}: { active: boolean; onClick: () => void; children: React.ReactNode; }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '8px 4px',
        border: `1px solid ${active ? theme.brass : theme.dimmer}`,
        borderRadius: 3,
        color: active ? theme.board : theme.cream,
        background: active ? theme.brass : 'transparent',
        fontWeight: active ? 700 : 400,
        whiteSpace: 'nowrap',
        textAlign: 'center'
      }}
    >
      {children}
    </button>
  );
}

const dateInputStyle: React.CSSProperties = {
  width: '100%',
  background: theme.bg,
  border: `1px solid ${theme.dimmer}`,
  borderRadius: 3,
  padding: '8px 10px',
  fontFamily: "'Geist Mono', monospace",
  fontSize: 11,
  color: theme.cream,
  colorScheme: 'dark'
};

const btnSecondary: React.CSSProperties = {
  padding: '14px 0',
  border: `1px solid ${theme.dimmer}`,
  borderRadius: 3,
  fontFamily: "'Geist Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  color: theme.cream,
  textTransform: 'uppercase',
  opacity: 0.8,
  background: 'transparent'
};

const btnOutline: React.CSSProperties = {
  padding: '14px 0',
  border: `1px solid ${theme.brass}`,
  borderRadius: 3,
  fontFamily: "'Geist Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  color: theme.brass,
  background: 'transparent',
  fontWeight: 600,
  textTransform: 'uppercase'
};

const btnPrimary: React.CSSProperties = {
  padding: '14px 0',
  background: theme.brass,
  color: theme.board,
  borderRadius: 3,
  fontFamily: "'Geist Mono', monospace",
  fontSize: 10,
  letterSpacing: '0.12em',
  fontWeight: 700,
  textTransform: 'uppercase',
  border: 'none'
};
