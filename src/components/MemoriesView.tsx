'use client';

import { useMemo } from 'react';
import { theme } from '@/lib/theme';
import { CATEGORIES, type Item } from '@/lib/supabase';

interface MemoriesViewProps {
  items: Item[];
  onSelect: (item: Item) => void;
}

export function MemoriesView({ items, onSelect }: MemoriesViewProps) {
  const completed = useMemo(
    () =>
      items
        .filter(i => i.status === 'departed')
        .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? '')),
    [items]
  );

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
        — {completed.length} departed —
      </div>

      {completed.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 24px'
          }}
        >
          <div
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: 32,
              color: theme.brass,
              opacity: 0.4,
              marginBottom: 16
            }}
          >
            記
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
            no memories yet
          </div>
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.15em',
              color: theme.dim,
              textTransform: 'uppercase'
            }}
          >
            mark something departed to begin
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8
          }}
        >
          {completed.map((item, idx) => (
            <MemoryCard key={item.id} item={item} index={idx} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryCard({
  item,
  index,
  onSelect
}: {
  item: Item;
  index: number;
  onSelect: (item: Item) => void;
}) {
  const cat = CATEGORIES.find(c => c.code === item.category);
  const date = item.completed_at
    ? new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    : '';

  return (
    <button
      onClick={() => onSelect(item)}
      style={{
        background: theme.surface,
        borderRadius: 4,
        overflow: 'hidden',
        textAlign: 'left',
        animation: `fadeIn 0.4s ease-out ${index * 40}ms both`,
        border: `1px solid ${theme.dimmer}`
      }}
    >
      <div
        style={{
          aspectRatio: '1 / 1',
          background: item.memory_photo
            ? `url(${item.memory_photo}) center / cover no-repeat`
            : `linear-gradient(135deg, ${theme.surface} 0%, ${theme.bg} 100%)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!item.memory_photo && (
          <div
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: 36,
              color: theme.brass,
              opacity: 0.3
            }}
          >
            ✓
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.15em',
            color: theme.brass,
            background: 'rgba(10,10,10,0.7)',
            padding: '2px 6px',
            borderRadius: 2,
            textTransform: 'uppercase'
          }}
        >
          {cat?.short ?? item.category}
        </div>
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11,
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
        {item.memory_note && (
          <div
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 11,
              color: theme.cream,
              opacity: 0.7,
              marginTop: 4,
              fontStyle: 'italic',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            "{item.memory_note}"
          </div>
        )}
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.15em',
            color: theme.dim,
            marginTop: 6,
            textTransform: 'uppercase'
          }}
        >
          {date}
        </div>
      </div>
    </button>
  );
}
