'use client';

import { useEffect, useRef, useState } from 'react';
import { theme } from '@/lib/theme';
import {
  CATEGORIES,
  MONTHS,
  SEASONS,
  STATUS_LABELS,
  supabase,
  timeWindowLabel,
  type Category,
  type Item,
  type Month,
  type Season,
  type Status
} from '@/lib/supabase';

interface ItemDetailModalProps {
  item: Item;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_COLORS: Record<Status, string> = {
  someday: theme.someday,
  planned: theme.planned,
  soon:    theme.soon,
  done:    theme.done
};

const STATUSES: Status[] = ['someday', 'planned', 'soon', 'done'];

export function ItemDetailModal({ item, onClose, onUpdated }: ItemDetailModalProps) {
  const [editMode, setEditMode] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(item.title);
  const [editCategory, setEditCategory] = useState<Category>(item.category);
  const [editSeasons, setEditSeasons] = useState<Set<Season>>(new Set(item.seasons || []));
  const [editMonths, setEditMonths] = useState<Set<Month>>(new Set(item.months || []));
  const [editShowMonths, setEditShowMonths] = useState((item.months || []).length > 0);
  const [editShowDateRange, setEditShowDateRange] = useState(!!item.date_start);
  const [editDateStart, setEditDateStart] = useState(item.date_start ?? '');
  const [editDateEnd, setEditDateEnd] = useState(item.date_end ?? '');
  const [editNotes, setEditNotes] = useState(item.notes ?? '');
  const [editError, setEditError] = useState<string | null>(null);

  // Memory log state
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
    const completedBy = newStatus === 'done'
      ? (typeof window !== 'undefined' ? localStorage.getItem('pail_user') : null)
      : null;

    const updates: Partial<Item> = {
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      completed_by: newStatus === 'done' ? completedBy : null
    };

    if (newStatus === 'done' && memoryNote.trim()) {
      updates.memory_note = memoryNote.trim();
    }
    if (newStatus === 'done' && photoUrl) {
      updates.memory_photo = photoUrl;
    }

    await supabase.from('pail_items').update(updates).eq('id', item.id);
    setUpdating(false);
    onUpdated();
  }

  async function saveMemory() {
    setUpdating(true);
    await supabase.from('pail_items').update({
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
    const { error: uploadError } = await supabase.storage.from('memories').upload(path, file, {
      upsert: false, contentType: file.type
    });
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
    await supabase.from('pail_items').delete().eq('id', item.id);
    setUpdating(false);
    onUpdated();
  }

  async function saveEdits() {
    if (!editTitle.trim()) {
      setEditError('title is required');
      return;
    }
    if (editShowDateRange && editDateStart && editDateEnd && editDateEnd < editDateStart) {
      setEditError('end date must be after start date');
      return;
    }
    setUpdating(true);
    setEditError(null);

    const { error } = await supabase.from('pail_items').update({
      title: editTitle.trim(),
      category: editCategory,
      seasons: Array.from(editSeasons),
      months: Array.from(editMonths),
      date_start: editShowDateRange && editDateStart ? editDateStart : null,
      date_end: editShowDateRange && editDateEnd ? editDateEnd : (editShowDateRange && editDateStart ? editDateStart : null),
      notes: editNotes.trim() || null
    }).eq('id', item.id);

    setUpdating(false);

    if (error) {
      setEditError(error.message);
      return;
    }

    setEditMode(false);
    onUpdated();
  }

  function cancelEdit() {
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditSeasons(new Set(item.seasons || []));
    setEditMonths(new Set(item.months || []));
    setEditShowMonths((item.months || []).length > 0);
    setEditShowDateRange(!!item.date_start);
    setEditDateStart(item.date_start ?? '');
    setEditDateEnd(item.date_end ?? '');
    setEditNotes(item.notes ?? '');
    setEditError(null);
    setEditMode(false);
  }

  const isDone = item.status === 'done';

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

        {!editMode ? (
          // ============ READ MODE ============
          <>
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  border: `1px solid ${theme.brass}`,
                  borderRadius: 3,
                  color: theme.brass,
                  background: 'transparent',
                  fontWeight: 600
                }}
              >
                edit
              </button>
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  color: theme.brass,
                  textTransform: 'uppercase',
                  opacity: 0.7,
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  paddingRight: 70
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat?.color ?? theme.brass }} />
                {cat?.label} · {timeWindowLabel(item)}
              </div>
              <div
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: theme.tileText,
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                  paddingRight: 70
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

            <Label>status</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 20 }}>
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

            {/* Memory log */}
            <div
              style={{
                padding: 14,
                border: `1px solid ${isDone ? theme.brass : theme.dimmer}`,
                borderRadius: 4,
                marginBottom: 16,
                background: isDone ? 'rgba(214, 185, 125, 0.04)' : 'transparent'
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
                memory log {isDone && '✓'}
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
                    opacity: 0.8,
                    background: 'transparent'
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
          </>
        ) : (
          // ============ EDIT MODE ============
          <>
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
              editing
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
              update item
            </div>

            <Label>title</Label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
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
              {CATEGORIES.map(c => {
                const active = editCategory === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => setEditCategory(c.code)}
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
                        background: c.color,
                        opacity: active ? 1 : 0.5,
                        flexShrink: 0
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>

            <Label>season tags</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
              {SEASONS.map(s => {
                const active = editSeasons.has(s.code);
                return (
                  <button
                    key={s.code}
                    onClick={() => {
                      setEditSeasons(prev => {
                        const next = new Set(prev);
                        if (next.has(s.code)) next.delete(s.code); else next.add(s.code);
                        return next;
                      });
                    }}
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
                      fontWeight: active ? 700 : 400
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Specific months toggle */}
            <button
              onClick={() => setEditShowMonths(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                marginBottom: editShowMonths ? 8 : 12,
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
              <span style={{ fontSize: 14, lineHeight: 1, width: 14 }}>{editShowMonths ? '−' : '+'}</span>
              specific month{editMonths.size > 0 ? `s (${editMonths.size})` : 's'}
            </button>

            {editShowMonths && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginBottom: 14 }}>
                {MONTHS.map(m => {
                  const active = editMonths.has(m.code);
                  return (
                    <button
                      key={m.code}
                      onClick={() => {
                        setEditMonths(prev => {
                          const next = new Set(prev);
                          if (next.has(m.code)) next.delete(m.code); else next.add(m.code);
                          return next;
                        });
                      }}
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
                        textAlign: 'center'
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setEditShowDateRange(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                marginBottom: editShowDateRange ? 8 : 16,
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
              <span style={{ fontSize: 14, lineHeight: 1, width: 14 }}>{editShowDateRange ? '−' : '+'}</span>
              specific date / range
            </button>

            {editShowDateRange && (
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
                    value={editDateStart}
                    onChange={(e) => setEditDateStart(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>
                <div>
                  <SubLabel>to (optional)</SubLabel>
                  <input
                    type="date"
                    value={editDateEnd}
                    onChange={(e) => setEditDateEnd(e.target.value)}
                    min={editDateStart || undefined}
                    style={dateInputStyle}
                  />
                </div>
              </div>
            )}

            <Label>notes</Label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
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

            {editError && (
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
                {editError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <button
                onClick={cancelEdit}
                style={{
                  padding: '14px 0',
                  border: `1px solid ${theme.dimmer}`,
                  borderRadius: 3,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  color: theme.cream,
                  textTransform: 'uppercase',
                  opacity: 0.8,
                  background: 'transparent'
                }}
              >
                cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={updating}
                style={{
                  padding: '14px 0',
                  background: theme.brass,
                  color: theme.board,
                  borderRadius: 3,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  opacity: updating ? 0.5 : 1,
                  border: 'none'
                }}
              >
                {updating ? 'saving…' : 'save changes'}
              </button>
            </div>
          </>
        )}
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
