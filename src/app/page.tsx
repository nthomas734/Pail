'use client';

import { useEffect, useRef, useState } from 'react';
import { theme, daysToSanDiego } from '@/lib/theme';
import { supabase, type Item } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { TabBar, type TabKey } from '@/components/TabBar';
import { BoardView } from '@/components/BoardView';
import { TimelineView } from '@/components/TimelineView';
import { MemoriesView } from '@/components/MemoriesView';
import { AddItemModal } from '@/components/AddItemModal';
import { ItemDetailModal } from '@/components/ItemDetailModal';

const TAB_ORDER: TabKey[] = ['board', 'timeline', 'memories'];

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('board');
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [days, setDays] = useState<number>(daysToSanDiego());

  // Swipe handling
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(() => setDays(daysToSanDiego()), 60_000 * 60); // hourly
    return () => clearInterval(interval);
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data as Item[]);
    setLoading(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;
    touchStart.current = null;

    // Only treat as a swipe if mostly horizontal, fast enough, and far enough
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
      const idx = TAB_ORDER.indexOf(tab);
      if (dx < 0 && idx < TAB_ORDER.length - 1) setTab(TAB_ORDER[idx + 1]);
      if (dx > 0 && idx > 0) setTab(TAB_ORDER[idx - 1]);
    }
  }

  return (
    <main
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: '100vh',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      <Header />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 14px' }}>
        {tab === 'board' && (
          <BoardView
            items={items}
            loading={loading}
            onSelect={setDetailItem}
            onAdd={() => setAddOpen(true)}
          />
        )}
        {tab === 'timeline' && <TimelineView items={items} onSelect={setDetailItem} />}
        {tab === 'memories' && <MemoriesView items={items} onSelect={setDetailItem} />}

        <div
          style={{
            textAlign: 'right',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.15em',
            color: theme.brass,
            opacity: 0.4,
            marginTop: 32,
            marginBottom: 16,
            paddingTop: 12,
            borderTop: `1px dashed ${theme.dimmer}`,
            textTransform: 'lowercase'
          }}
        >
          {days} days to san diego
        </div>
      </div>

      <TabBar tab={tab} onChange={setTab} />

      {addOpen && (
        <AddItemModal
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            fetchItems();
          }}
        />
      )}

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onUpdated={() => {
            setDetailItem(null);
            fetchItems();
          }}
        />
      )}
    </main>
  );
}
