import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Edit3, Eye, FileText, Search, Save, Clock, CheckCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface NoteItem {
  id: string;
  title: string;
  content: string;
  updated_at: number;
}

// ─── Persistence helpers (localStorage primary, Electron IPC secondary) ────
const LS_KEY = 'devflow_notes_v2';

const loadLS = (): NoteItem[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
};

const saveLS = (notes: NoteItem[]) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(notes)); }
  catch { /* quota */ }
};

const tryIPC = async (method: string, ...args: any[]) => {
  try {
    const api = (window as any).api;
    if (api && typeof api[method] === 'function') {
      return await api[method](...args);
    }
  } catch { /* IPC unavailable */ }
  return null;
};

// ─── Component ───────────────────────────────────────────────────────────────
export const NotesPanel: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSavedRef = useRef<Date | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // ── Load on mount ──
  useEffect(() => {
    (async () => {
      const remote = await tryIPC('getNotes');
      if (Array.isArray(remote) && remote.length > 0) {
        setNotes(remote);
        saveLS(remote);
      } else {
        setNotes(loadLS());
      }
    })();
  }, []);

  // ── Sync editor fields when active note changes ──
  useEffect(() => {
    const note = notes.find(n => n.id === activeId);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSaveState('idle');
    } else if (!activeId) {
      setTitle('');
      setContent('');
      setSaveState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // ── Core save function (stable ref, no stale closure) ──
  const doSave = useCallback((id: string, t: string, c: string) => {
    if (!id || !t.trim()) return;
    const note: NoteItem = { id, title: t.trim(), content: c, updated_at: Date.now() };

    setNotes(prev => {
      const updated = prev.some(n => n.id === id)
        ? prev.map(n => n.id === id ? note : n)
        : [note, ...prev];
      saveLS(updated);
      return updated;
    });

    tryIPC('saveNote', note);
  }, []);

  // ── Manual save button ──
  const handleSave = useCallback(() => {
    if (!activeId || !title.trim()) return;
    setSaveState('saving');
    doSave(activeId, title, content);
    lastSavedRef.current = new Date();
    setTimeout(() => setSaveState('saved'), 400);
    setTimeout(() => setSaveState('idle'), 2500);
  }, [activeId, title, content, doSave]);

  // ── Debounced auto-save on content/title change ──
  useEffect(() => {
    if (!activeId) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSave(activeId, title, content);
      lastSavedRef.current = new Date();
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [title, content, activeId, doSave]);

  // ── Create note ──
  const handleCreate = useCallback(() => {
    const id = `note_${Date.now()}`;
    const note: NoteItem = { id, title: 'Untitled Note', content: '', updated_at: Date.now() };
    // Save immediately — don't rely on useEffect for first save
    setNotes(prev => { const u = [note, ...prev]; saveLS(u); return u; });
    tryIPC('saveNote', note);
    setActiveId(id);
    setTitle('Untitled Note');
    setContent('');
    setEditMode(true);
    setSaveState('idle');
  }, []);

  // ── Delete note ──
  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this note?')) return;
    setNotes(prev => { const u = prev.filter(n => n.id !== id); saveLS(u); return u; });
    tryIPC('deleteNote', id);
    if (activeId === id) { setActiveId(null); setTitle(''); setContent(''); }
  }, [activeId]);

  // ── Filtered list ──
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden theme-bg-primary">

      {/* ── Left list pane ─────────────────────────────────────────── */}
      <div className="w-72 border-r theme-border flex flex-col h-full theme-bg-secondary flex-shrink-0">
        <div className="p-4 border-b theme-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-[var(--accent-color)]" />
              <h3 className="text-sm font-bold theme-text-primary">Notes</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-color)] font-bold">
                {notes.length}
              </span>
            </div>
            <button
              onClick={handleCreate}
              className="p-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-sm"
              title="New Note"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs theme-text-primary theme-bg-primary border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <FileText size={30} className="text-zinc-300" />
              <div>
                <p className="text-xs font-semibold theme-text-secondary">No notes yet</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Click + to create your first note</p>
              </div>
              <button
                onClick={handleCreate}
                className="px-3 py-1.5 bg-[var(--accent-color)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={12} /> New Note
              </button>
            </div>
          ) : (
            filtered.map(n => {
              const isActive = n.id === activeId;
              const preview = n.content ? n.content.slice(0, 60).replace(/\n/g, ' ') + (n.content.length > 60 ? '…' : '') : 'Empty note…';
              return (
                <div
                  key={n.id}
                  onClick={() => setActiveId(n.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                    isActive
                      ? 'theme-bg-primary border-[var(--accent-color)]/40 shadow-sm'
                      : 'border-transparent hover:theme-bg-primary hover:border-[var(--border-color)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-[var(--accent-color)]' : 'theme-text-primary'}`}>
                      {n.title}
                    </span>
                    <button
                      onClick={e => handleDelete(n.id, e)}
                      className="p-0.5 text-zinc-400 hover:text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 truncate">{preview}</p>
                  <p className="text-[9px] text-zinc-400 mt-1">{new Date(n.updated_at).toLocaleDateString()} {new Date(n.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right editor pane ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden theme-bg-primary">
        {activeId ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b theme-border gap-3 flex-shrink-0">
              <input
                type="text"
                placeholder="Note Title…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-base font-bold theme-text-primary bg-transparent focus:outline-none border-b-2 border-transparent focus:border-[var(--accent-color)]/40 px-1 py-0.5 flex-1 min-w-0 transition-colors"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Save status */}
                {saveState === 'saving' && (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Save size={10} className="animate-pulse text-[var(--accent-color)]" /> Saving…
                  </span>
                )}
                {saveState === 'saved' && (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <CheckCircle size={10} /> Saved!
                  </span>
                )}
                {saveState === 'idle' && lastSavedRef.current && (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Clock size={10} /> {lastSavedRef.current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}

                {/* Save button */}
                <button
                  onClick={handleSave}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                    saveState === 'saved'
                      ? 'bg-emerald-500 text-white border-transparent'
                      : 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white border-transparent'
                  }`}
                >
                  {saveState === 'saved' ? <CheckCircle size={12} /> : <Save size={12} />}
                  {saveState === 'saved' ? 'Saved!' : 'Save'}
                </button>

                {/* Edit / Preview toggle */}
                <div className="flex items-center bg-[var(--bg-secondary)] border theme-border rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setEditMode(true)}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all ${editMode ? 'bg-[var(--accent-color)] text-white shadow-sm' : 'theme-text-secondary hover:theme-text-primary'}`}
                  >
                    <Edit3 size={11} /> Edit
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all ${!editMode ? 'bg-[var(--accent-color)] text-white shadow-sm' : 'theme-text-secondary hover:theme-text-primary'}`}
                  >
                    <Eye size={11} /> Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Editor / Preview */}
            <div className="flex-1 overflow-hidden p-4">
              {editMode ? (
                <textarea
                  placeholder="Start writing… (Markdown supported)&#10;&#10;# Heading&#10;## Sub-heading&#10;- Bullet&#10;**bold** *italic*"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-full p-4 rounded-xl theme-bg-secondary border theme-border text-sm font-mono theme-text-primary focus:outline-none focus:border-[var(--accent-color)]/40 resize-none overflow-auto transition-colors leading-relaxed"
                />
              ) : (
                <div className="w-full h-full p-6 rounded-xl theme-bg-secondary border theme-border overflow-y-auto select-text">
                  {content ? (
                    <div className="font-sans leading-relaxed">
                      {content.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-3 text-[var(--accent-color)] border-b theme-border pb-2">{line.slice(2)}</h1>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mb-2 mt-4 theme-text-primary">{line.slice(3)}</h2>;
                        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold mb-1.5 mt-3 theme-text-primary">{line.slice(4)}</h3>;
                        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 mb-1 theme-text-secondary text-sm">{line.slice(2)}</li>;
                        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-[var(--accent-color)] pl-3 my-2 text-zinc-500 italic text-sm">{line.slice(2)}</blockquote>;
                        if (line === '') return <br key={i} />;
                        const html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
                        return <p key={i} className="mb-1.5 theme-text-secondary text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <Eye size={28} className="text-zinc-400" />
                      <em className="text-zinc-500 text-sm">Note is empty. Switch to Edit to start writing.</em>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center select-none gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-color)]/20 flex items-center justify-center">
              <FileText size={28} className="text-[var(--accent-color)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold theme-text-primary">No Note Selected</p>
              <p className="text-xs text-zinc-500 mt-1">Select a note or create a new one</p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Plus size={14} /> Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default NotesPanel;
