'use client';

import { useEffect, useRef, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  CATEGORIES,
  STATUS_LABELS,
  TIME_WINDOW_LABELS,
  supabase,
  type Item,
  type Status
} from '@/lib/supabase';

interface ItemDetailModalProps {
  item: Item;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_COLORS: Record<Status, string> = {
  dreaming:  theme.dreaming,
  scheduled: theme.scheduled,
  boarding:  theme.boarding,
  departed:  theme.departed
};

const STATUSES: Status[] = ['dreaming', 'scheduled', 'boarding', 'departed'];

export function ItemDetailModal({ item, onClose, onUpdated }: ItemDetailModalProps) {
  const [memoryNote, setMemoryNote] = useState(item.memory_note ?? '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(item.memory_photo);
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cat = CATEGORIES.find(c => c.code === item.category);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function changeStatus(newStatus: Status) {
    setUpdating(true);
    const completedBy = newStatus === 'departed'
      ? (typeof window !== 'undefined' ? localStorage.getItem('yarinokoshi_user') : null)
      : null;

    const updates: Partial<Item> = {
      status: newStatus,
      completed_at: newStatus === 'departed' ? new Date().toISOString() : null,
      completed_by: newStatus === 'departed' ? completedBy : null
    };

    if (newStatus === 'departed' && memoryNote.trim()) {
      updates.memory_note = memoryNote.trim();
    }
    if (newStatus === 'departed' && photoUrl) {
      updates.memory_photo = photoUrl;
    }

    await supabase.from('items').update(updates).eq('id', item.id);
    setUpdating(false);
    onUpdated();
  }

  async function saveMemory() {
    setUpdating(true);
    await supabase.from('items').update({
      memory_note: memoryNote.trim() || null,
      memory_photo: photoUrl
    }).eq('id', item.id);
    setUpdating(false);
    onUpdated();
  }

  async function uploadPhoto(file: File) {
    setPhotoUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${item.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error(uploadError);
      setPhotoUploading(false);
      return;
    }

    const { data } = supabase.storage.from('memories').getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
    setPhotoUploading(false);
  }

  async function deleteItem() {
    setUpdating(true);
    await supabase.from('items').delete().eq('id', item.id);
    setUpdating(false);
    onUpdated();
  }

  const isDeparted = item.status === 'departed';

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

        {/* Title block */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              color: theme.brass,
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: 6
            }}
          >
            {cat?.label} · {TIME_WINDOW_LABELS[item.time_window]}
          </div>
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: theme.tileText,
              textTransform: 'uppercase',
              lineHeight: 1.3
            }}
          >
            {item.title}
          </div>
          {item.notes && (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: theme.surface,
                borderRadius: 4,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 13,
                color: theme.cream,
                opacity: 0.85,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}
            >
              {item.notes}
            </div>
          )}
        </div>

        {/* Status selector */}
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.2em',
            color: theme.brass,
            opacity: 0.65,
            marginBottom: 8,
            textTransform: 'uppercase'
          }}
        >
          status
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4,
            marginBottom: 20
          }}
        >
          {STATUSES.map(s => {
            const active = item.status === s;
            return (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={updating}
                style={{
                  padding: '10px 4px',
                  background: active ? STATUS_COLORS[s] : theme.surface,
                  border: `1px solid ${active ? STATUS_COLORS[s] : theme.dimmer}`,
                  borderRadius: 3,
                  color: active ? theme.board : STATUS_COLORS[s],
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: active ? 700 : 400,
                  opacity: updating ? 0.5 : 1
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>

        {/* Memory log (always editable, shown more prominently if departed) */}
        <div
          style={{
            padding: 14,
            border: `1px solid ${isDeparted ? theme.brass : theme.dimmer}`,
            borderRadius: 4,
            marginBottom: 16,
            background: isDeparted ? 'rgba(200, 169, 126, 0.04)' : 'transparent'
          }}
        >
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              color: theme.brass,
              opacity: 0.85,
              marginBottom: 10,
              textTransform: 'uppercase'
            }}
          >
            memory log {isDeparted && '✓'}
          </div>

          {photoUrl ? (
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                background: `url(${photoUrl}) center / cover no-repeat`,
                borderRadius: 4,
                marginBottom: 10,
                position: 'relative'
              }}
            >
              <button
                onClick={() => setPhotoUrl(null)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.7)',
                  color: theme.cream,
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 2,
                  fontFamily: "'Geist Mono', monospace",
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}
              >
                remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              style={{
                width: '100%',
                padding: '20px',
                background: theme.surface,
                border: `1px dashed ${theme.dimmer}`,
                borderRadius: 4,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.15em',
                color: theme.dim,
                textTransform: 'uppercase',
                marginBottom: 10
              }}
            >
              {photoUploading ? 'uploading…' : '+ add photo (optional)'}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPhoto(f);
            }}
          />

          <textarea
            value={memoryNote}
            onChange={(e) => setMemoryNote(e.target.value)}
            placeholder="one line about how it went…"
            rows={2}
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
              lineHeight: 1.5
            }}
          />

          {(memoryNote !== (item.memory_note ?? '') || photoUrl !== item.memory_photo) && (
            <button
              onClick={saveMemory}
              disabled={updating}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '10px 0',
                background: theme.brass,
                color: theme.board,
                borderRadius: 3,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.15em',
                fontWeight: 700,
                textTransform: 'uppercase',
                opacity: updating ? 0.5 : 1
              }}
            >
              save memory
            </button>
          )}
        </div>

        {/* Delete + close */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '12px 0',
                border: `1px solid ${theme.dimmer}`,
                borderRadius: 3,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.15em',
                color: '#d97a7a',
                textTransform: 'uppercase',
                opacity: 0.8
              }}
            >
              delete
            </button>
          ) : (
            <button
              onClick={deleteItem}
              disabled={updating}
              style={{
                padding: '12px 0',
                border: `1px solid #d97a7a`,
                background: '#d97a7a',
                color: theme.board,
                borderRadius: 3,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.15em',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              confirm delete
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '12px 0',
              background: theme.surface,
              border: `1px solid ${theme.dimmer}`,
              borderRadius: 3,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.15em',
              color: theme.cream,
              textTransform: 'uppercase'
            }}
          >
            close
          </button>
        </div>
      </div>
    </div>
  );
}
