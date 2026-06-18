import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Eye, FileText, Search } from 'lucide-react';
import { useStore } from '../store';
import type { NoteItem } from '../types';

export const NotesPanel: React.FC = () => {
  const { notes, saveNoteItem, deleteNoteItem } = useStore();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(true);

  // Active note state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const activeNote = notes.find(n => n.id === activeNoteId);

  // Sync state with selected note
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeNoteId, activeNote]);

  // Autosave setup
  useEffect(() => {
    if (!activeNoteId) return;
    const delayDebounceFn = setTimeout(() => {
      if (title.trim() === '') return;
      saveNoteItem({
        id: activeNoteId,
        title,
        content,
        updated_at: Date.now()
      });
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [title, content, activeNoteId]);

  const handleCreateNote = () => {
    const newId = `note_${Date.now()}`;
    const newNote: NoteItem = {
      id: newId,
      title: 'New Note',
      content: '',
      updated_at: Date.now()
    };
    saveNoteItem(newNote).then(() => {
      setActiveNoteId(newId);
      setIsEditMode(true);
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this note?')) {
      deleteNoteItem(id).then(() => {
        if (activeNoteId === id) {
          setActiveNoteId(null);
        }
      });
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden theme-bg-primary">
      {/* Left List Pane */}
      <div className="w-80 border-r theme-border flex flex-col h-full bg-[var(--bg-secondary)]">
        <div className="p-4 border-b theme-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Notes</h3>
            <button
              onClick={handleCreateNote}
              className="p-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {filteredNotes.map(n => {
            const isActive = n.id === activeNoteId;
            const preview = n.content.length > 60 ? n.content.substring(0, 60) + '...' : n.content || 'Empty note';
            return (
              <div
                key={n.id}
                onClick={() => setActiveNoteId(n.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-primary)] border-[var(--accent-color)] text-[var(--text-primary)] shadow-sm'
                    : 'border-transparent hover:bg-white theme-text-primary'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText size={13} className="text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-bold truncate">{n.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    className="p-0.5 text-zinc-500 hover:text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <p className="text-[10px] theme-text-secondary mt-1 truncate">{preview}</p>
              </div>
            );
          })}
          {filteredNotes.length === 0 && (
            <div className="text-[11px] text-zinc-500 text-center py-8">No notes found. Create a new one above!</div>
          )}
        </div>
      </div>

      {/* Right Work Editor Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeNoteId ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-4 gap-4">
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <input
                type="text"
                placeholder="Note Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm font-bold theme-text-primary bg-transparent focus:outline-none border-b border-transparent focus:border-[var(--accent-color)]/30 px-1 py-0.5 flex-1 max-w-md"
              />
              <div className="flex items-center bg-[var(--bg-secondary)] border theme-border rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`p-1.5 rounded-md flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all ${
                    isEditMode ? 'bg-white shadow-sm text-[var(--accent-color)]' : 'theme-text-secondary hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Edit3 size={12} /> Edit
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className={`p-1.5 rounded-md flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-all ${
                    !isEditMode ? 'bg-white shadow-sm text-[var(--accent-color)]' : 'theme-text-secondary hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {isEditMode ? (
                <textarea
                  placeholder="Write note contents here (markdown supported)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-4 rounded-xl bg-[var(--bg-secondary)] border theme-border text-xs font-mono theme-text-primary focus:outline-none resize-none overflow-auto"
                />
              ) : (
                <div className="w-full h-full p-4 rounded-xl bg-white border theme-border overflow-y-auto select-text">
                  <div className="prose prose-sm max-w-none text-xs theme-text-primary font-sans whitespace-pre-wrap leading-relaxed">
                    {content || <em className="text-zinc-500">No content inside this note.</em>}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10px] theme-text-secondary text-right font-medium italic">
              Auto-saves changes automatically.
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 select-none gap-2">
            <FileText size={36} className="text-blue-500/40" />
            <span className="text-xs font-bold uppercase tracking-wider">No Active Note Selected</span>
            <span className="text-[11px]">Select a note from the left list or create a new note.</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default NotesPanel;
