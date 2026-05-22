'use client';

import { useMemo, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  CATEGORIES,
  STATUS_LABELS,
  STATUS_ORDER,
  timeWindowLabel,
  type Category,
  type Item,
  type Season,
  type Status
} from '@/lib/supabase';
import { FlapText } from './FlapText';

interface BoardViewProps {
  items: Item[];
  loading: boolean;
  onSelect: (item: Item) => void;
  onAdd: () => void;
  catFilter: 'all' | Category;
  setCatFilter: (c: 'all' | Category) => void;
  timeFilter: 'all' | Season;
  setTimeFilter: (t: 'all' | Season) => void;
}

const STATUS_COLORS: Record<Status, string> = {
  someday: theme.someday,
  planned: theme.planned,
  soon:    theme.soon,
  done:    theme.done
};

const SEASON_FILTERS: { code: 'all' | Season; label: string }[] = [
  { code: 'all',    label: 'any time' },
  { code: 'spring', label: 'spring' },
  { code: 'summer', label: 'summer' },
  { code: 'fall',   label: 'fall' },
  { code: 'winter', label: 'winter' }
];

export function BoardView({
  items,
  loading,
  onSelect,
  onAdd,
  catFilter,
  setCatFilter,
  timeFilter,
  setTimeFilter
}: BoardViewProps) {

  const totalsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    CATEGORIES.forEach(c => { counts[c.code] = 0; });
    items.forEach(i => { counts[i.category] = (counts[i.category] ?? 0) + 1; });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    let base = catFilter === 'all' ? items : items.filter(i => i.category === catFilter);

    if (timeFilter !== 'all') {
      base = base.filter(i => {
        // Item matches season filter if it has the season tagged OR has any season AND no specific date
        return (i.seasons || []).includes(timeFilter);
      });
    }

    return base.slice().sort((a, b) => {
      const sd = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      if (sd !== 0) return sd;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [items, catFilter, timeFilter]);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Filter strip 1: categories */}
      <div
        className="no-scrollbar"
        data-swipe-ignore
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '4px 0 8px'
        }}
      >
        <FilterPill
          active={catFilter === 'all'}
          onClick={() => setCatFilter('all')}
          label="all"
          count={totalsByCategory.all}
        />
        {CATEGORIES.map(c => (
          <FilterPill
            key={c.code}
            active={catFilter === c.code}
            onClick={() => setCatFilter(c.code)}
            label={c.label}
            count={totalsByCategory[c.code] ?? 0}
            dotColor={c.color}
          />
        ))}
      </div>

      {/* Filter strip 2: time/season */}
      <div
        className="no-scrollbar"
        data-swipe-ignore
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '0 0 14px',
          marginBottom: 8
        }}
      >
        {SEASON_FILTERS.map(s => (
          <FilterPill
            key={s.code}
            active={timeFilter === s.code}
            onClick={() => setTimeFilter(s.code)}
            label={s.label}
            subtle
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
          loading pail…
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
  count,
  subtle,
  dotColor
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  subtle?: boolean;
  dotColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: "'Geist Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: subtle ? '5px 9px' : '6px 10px',
        border: `1px solid ${active ? theme.brass : 'rgba(214, 185, 125, 0.25)'}`,
        borderRadius: 3,
        color: active ? theme.board : theme.brass,
        background: active ? theme.brass : 'transparent',
        fontWeight: active ? 700 : 400,
        opacity: subtle && !active ? 0.7 : 1,
        transition: 'all 0.15s ease'
      }}
    >
      {dotColor && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: active ? theme.board : dotColor,
            opacity: active ? 0.7 : 1,
            flexShrink: 0
          }}
        />
      )}
      {label}
      {count !== undefined && (
        <span style={{ opacity: active ? 0.7 : 0.6 }}>{count}</span>
      )}
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
  const catColor = cat?.color ?? theme.brass;

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
        opacity: item.status === 'done' ? 0.6 : 1,
        animation: `fadeIn 0.4s ease-out ${index * 30}ms both`,
        transition: 'background 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0
          }}
        >
          {/* Category color dot */}
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: catColor,
              flexShrink: 0
            }}
            aria-hidden="true"
          />
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
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            paddingLeft: 15
          }}
        >
          <span style={{ color: theme.brass }}>{cat?.label ?? item.category}</span>
          <span style={{ color: theme.dim }}>{timeWindowLabel(item)}</span>
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
          animation: item.status === 'soon' ? 'pulseBoarding 2s ease-in-out infinite' : undefined
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
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 18,
          opacity: 0.5
        }}
      >
        <svg viewBox="0 0 100 100" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 28 32 Q 28 18, 50 18 Q 72 18, 72 32"
            fill="none"
            stroke={theme.brass}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 22 35 L 28 82 L 72 82 L 78 35 Z"
            fill="none"
            stroke={theme.brass}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {hasItems && (
            <line
              x1="32"
              y1="62"
              x2="68"
              y2="62"
              stroke={theme.brass}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
          )}
        </svg>
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
        {hasItems ? 'nothing matches these filters' : 'the pail is empty'}
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
        {hasItems ? 'try clearing a filter' : 'tap + to add the first thing'}
      </div>
      {!hasItems && (
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
          + add to pail
        </button>
      )}
    </div>
  );
}
