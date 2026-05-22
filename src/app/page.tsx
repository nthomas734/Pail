'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase, type Category, type Item, type Season } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { TabBar, type TabKey } from '@/components/TabBar';
import { BoardView } from '@/components/BoardView';
import { RollView } from '@/components/RollView';
import { TimelineView } from '@/components/TimelineView';
import { MemoriesView } from '@/components/MemoriesView';
import { AddItemModal } from '@/components/AddItemModal';
import { ItemDetailModal } from '@/components/ItemDetailModal';

const TAB_ORDER: TabKey[] = ['board', 'roll', 'timeline', 'memories'];

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('board');
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);

  // Lifted board filter state (so Roll tab can read current category filter)
  const [catFilter, setCatFilter] = useState<'all' | Category>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | Season>('all');

  // Swipe handling
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pail_items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      // Normalize: ensure seasons and months are always arrays (some legacy rows may have null)
      const normalized = (data as Item[]).map(item => ({
        ...item,
        seasons: item.seasons ?? [],
        months: item.months ?? []
      }));
      setItems(normalized);
    }
    setLoading(false);
  }

  async function markItemSoon(item: Item) {
    await supabase.from('pail_items').update({ status: 'soon' }).eq('id', item.id);
    fetchItems();
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
            catFilter={catFilter}
            setCatFilter={setCatFilter}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
          />
        )}
        {tab === 'roll' && (
          <RollView
            items={items}
            initialCategoryFilter={catFilter}
            onSelect={setDetailItem}
            onMarkSoon={markItemSoon}
          />
        )}
        {tab === 'timeline' && <TimelineView items={items} onSelect={setDetailItem} />}
        {tab === 'memories' && <MemoriesView items={items} onSelect={setDetailItem} />}
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
