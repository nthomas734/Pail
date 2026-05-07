'use client';

import { useMemo, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  CATEGORIES,
  STATUS_LABELS,
  STATUS_ORDER,
  TIME_WINDOW_LABELS,
  type Category,
  type Item,
  type Status
} from '@/lib/supabase';
import { FlapText } from './FlapText';

interface BoardViewProps {
  items: Item[];
  loading: boolean;
  onSelect: (item: Item) => void;
  onAdd: () => void;
}

const STATUS_COLORS: Record<Status, string> = {
  dreaming:  theme.dreaming,
  scheduled: theme.scheduled,
  boarding:  theme.boarding,
  departed:  theme.departed
};

export function BoardView({ items, loading, onSelect, onAdd }: BoardViewProps) {
  const [filter, setFilter] = useState<'all' | Category>('all');

  const totalsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    CATEGORIES.forEach(c => { counts[c.code] = 0; });
    items.forEach(i => { counts[i.category] = (counts[i.category] ?? 0) + 1; });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    const base = filter === 'all' ? items : items.filter(i => i.category === filter);
    // Sort: by status order, then by created_at desc
    return base.slice().sort((a, b) => {
      const sd = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (sd !== 0) return sd;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [items, filter]);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Filter strip */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '4px 0 14px',
          marginBottom: 8
        }}
      >
        <FilterPill
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label="all"
          count={totalsByCategory.all}
        />
        {CATEGORIES.map(c => (
          <FilterPill
            key={c.code}
            active={filter === c.code}
            onClick={() => setFilter(c.code)}
            label={c.label}
            count={totalsByCategory[c.code] ?? 0}
          />
        ))}
      </div>

      {/* List */}
      {loading && (
        <div
          style={{
            textAlign: 'center',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            color: theme.dim,
            padding: '40px 0',
            textTransform: 'uppercase'
          }}
        >
          loading board…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState onAdd={onAdd} hasItems={items.length > 0} />
      )}

      {!loading && filtered.length > 0 && (
        <div>
          {filtered.map((item, idx) => (
            <Row
              key={item.id}
              item={item}
              index={idx}
              onSelect={() => onSelect(item)}
            />
          ))}
        </div>
      )}

      {/* Floating + button */}
      <button
        aria-label="Add item"
        onClick={onAdd}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 'calc(88px + env(safe-area-inset-bottom))',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: theme.brass,
          color: theme.board,
          fontSize: 32,
          fontWeight: 300,
          fontFamily: "'Fraunces', serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(245, 237, 224, 0.1)',
          zIndex: 50,
          paddingBottom: 4
        }}
      >
        +
      </button>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        fontFamily: "'Geist Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '6px 10px',
        border: `1px solid ${active ? theme.brass : 'rgba(200, 169, 126, 0.25)'}`,
        borderRadius: 3,
        color: active ? theme.board : theme.brass,
        background: active ? theme.brass : 'transparent',
        fontWeight: active ? 700 : 400,
        transition: 'all 0.15s ease'
      }}
    >
      {label} <span style={{ marginLeft: 4, opacity: active ? 0.7 : 0.6 }}>{count}</span>
    </button>
  );
}

function Row({
  item,
  index,
  onSelect
}: {
  item: Item;
  index: number;
  onSelect: () => void;
}) {
  const cat = CATEGORIES.find(c => c.code === item.category);
  const accent = STATUS_COLORS[item.status];

  return (
    <button
      onClick={onSelect}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 12,
        padding: '13px 12px',
        marginBottom: 6,
        background: theme.surface,
        borderRadius: 4,
        borderLeft: `2px solid ${accent}`,
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        opacity: item.status === 'departed' ? 0.6 : 1,
        animation: `fadeIn 0.4s ease-out ${index * 30}ms both`,
        transition: 'background 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.04em',
            color: theme.tileText,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}
        >
          <span style={{ color: theme.brass }}>{cat?.label ?? item.category}</span>
          <span style={{ color: theme.dim }}>{TIME_WINDOW_LABELS[item.time_window]}</span>
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: accent,
          whiteSpace: 'nowrap',
          animation: item.status === 'boarding' ? 'pulseBoarding 2s ease-in-out infinite' : undefined
        }}
      >
        <FlapText
          text={STATUS_LABELS[item.status]}
          delay={index * 30}
          cyclesPerChar={5}
          cycleSpeed={45}
          staggerPerChar={25}
        />
      </div>
    </button>
  );
}

function EmptyState({ onAdd, hasItems }: { onAdd: () => void; hasItems: boolean }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '40px 24px 20px',
        animation: 'fadeIn 0.6s ease-out'
      }}
    >
      <div
        style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: 32,
          color: theme.brass,
          opacity: 0.5,
          marginBottom: 16
        }}
      >
        {hasItems ? '空' : '始'}
      </div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 300,
          fontSize: 18,
          color: theme.cream,
          marginBottom: 8
        }}
      >
        {hasItems ? 'nothing in this category yet' : 'the board is empty'}
      </div>
      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.15em',
          color: theme.dim,
          textTransform: 'uppercase',
          marginBottom: 24
        }}
      >
        tap + to add the first thing
      </div>
      <button
        onClick={onAdd}
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding: '10px 22px',
          background: theme.brass,
          color: theme.board,
          borderRadius: 3,
          fontWeight: 700
        }}
      >
        + add item
      </button>
    </div>
  );
}
