'use client';

import { useMemo } from 'react';
import { theme } from '@/lib/theme';
import {
  CATEGORIES,
  TIME_WINDOW_LABELS,
  type Item,
  type TimeWindow
} from '@/lib/supabase';

interface TimelineViewProps {
  items: Item[];
  onSelect: (item: Item) => void;
}

const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTH_KEYS: TimeWindow[] = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const SEASON_MONTHS: Record<string, number[]> = {
  spring: [2, 3, 4],
  summer: [5, 6, 7],
  fall:   [8, 9, 10],
  winter: [11, 0, 1]
};

interface MonthBucket {
  year: number;
  month: number; // 0-11
  label: string;
  items: Item[];
}

export function TimelineView({ items, onSelect }: TimelineViewProps) {
  const buckets = useMemo(() => buildBuckets(items), [items]);
  const anyTimeItems = items.filter(i => i.time_window === 'any' && i.status !== 'departed');

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out', paddingBottom: 20 }}>
      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.2em',
          color: theme.brass,
          opacity: 0.55,
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: `1px dashed ${theme.dimmer}`
        }}
      >
        — now → september 2027 —
      </div>

      {buckets.map((bucket, idx) => (
        <MonthBlock
          key={`${bucket.year}-${bucket.month}`}
          bucket={bucket}
          isFirst={idx === 0}
          onSelect={onSelect}
        />
      ))}

      {anyTimeItems.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.2em',
              color: theme.brass,
              opacity: 0.7,
              textTransform: 'uppercase',
              padding: '14px 0 10px',
              borderTop: `1px dashed ${theme.dimmer}`
            }}
          >
            anytime · no window
          </div>
          {anyTimeItems.map(item => (
            <TimelineItem key={item.id} item={item} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function buildBuckets(items: Item[]): MonthBucket[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(2027, 8, 1); // September 2027

  const buckets: MonthBucket[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    buckets.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth(),
      label: `${MONTH_NAMES[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(-2)}`,
      items: []
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Drop items into matching buckets (skip departed)
  items.forEach(item => {
    if (item.status === 'departed') return;
    const tw = item.time_window;
    if (tw === 'any') return; // shown separately

    const monthIndex = MONTH_KEYS.indexOf(tw as TimeWindow);
    if (monthIndex >= 0) {
      // Specific month - drop into every bucket matching that month
      buckets.forEach(b => { if (b.month === monthIndex) b.items.push(item); });
    } else if (tw in SEASON_MONTHS) {
      const months = SEASON_MONTHS[tw];
      buckets.forEach(b => { if (months.includes(b.month)) b.items.push(item); });
    }
  });

  return buckets;
}

function MonthBlock({
  bucket,
  isFirst,
  onSelect
}: {
  bucket: MonthBucket;
  isFirst: boolean;
  onSelect: (item: Item) => void;
}) {
  const empty = bucket.items.length === 0;

  return (
    <div style={{ marginBottom: empty ? 4 : 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          padding: empty ? '4px 0' : '10px 0 8px',
          opacity: empty ? 0.4 : 1
        }}
      >
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: isFirst ? theme.brass : theme.cream
          }}
        >
          {bucket.label}
        </div>
        <div
          style={{
            flex: 1,
            height: 1,
            background: theme.dimmer
          }}
        />
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.15em',
            color: theme.dim,
            textTransform: 'uppercase'
          }}
        >
          {bucket.items.length} {bucket.items.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {bucket.items.map(item => (
        <TimelineItem key={`${bucket.year}-${bucket.month}-${item.id}`} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TimelineItem({ item, onSelect }: { item: Item; onSelect: (item: Item) => void }) {
  const cat = CATEGORIES.find(c => c.code === item.category);
  return (
    <button
      onClick={() => onSelect(item)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 10,
        padding: '10px 12px',
        marginBottom: 4,
        background: theme.surface,
        borderRadius: 3,
        borderLeft: `2px solid ${theme.scheduled}`,
        width: '100%',
        textAlign: 'left',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 12,
          fontWeight: 700,
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
          fontFamily: "'Geist Mono', monospace",
          fontSize: 8,
          letterSpacing: '0.15em',
          color: theme.brass,
          textTransform: 'uppercase'
        }}
      >
        {cat?.short ?? item.category}
      </div>
    </button>
  );
}
