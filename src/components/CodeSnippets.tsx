import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Plus, Trash2, Save, Cpu, Search, Code2 } from 'lucide-react';
import { useStore } from '../store';
import type { CodeSnippetItem } from '../types';

export const CodeSnippets: React.FC = () => {
  const { snippets, saveSnippetItem, deleteSnippetItem, theme } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Snippet values state
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const activeSnippet = snippets.find(s => s.id === activeId);

  // Sync editor values on active snippet change
  useEffect(() => {
    if (activeSnippet) {
      setTitle(activeSnippet.title);
      setLanguage(activeSnippet.language);
      setCode(activeSnippet.code);
      setDescription(activeSnippet.description || '');
    } else {
      setTitle('');
      setLanguage('javascript');
      setCode('');
      setDescription('');
    }
  }, [activeId, activeSnippet]);

  const handleCreateSnippet = () => {
    const newId = `snip_${Date.now()}`;
    const newSnip: CodeSnippetItem = {
      id: newId,
      title: 'New Code Snippet',
      language: 'javascript',
      code: '// Write code here\n',
      description: '',
      updated_at: Date.now()
    };
    saveSnippetItem(newSnip).then(() => {
      setActiveId(newId);
    });
  };

  const handleSave = () => {
    if (!activeId || !title.trim()) return;
    saveSnippetItem({
      id: activeId,
      title: title.trim(),
      language,
      code,
      description: description.trim(),
      updated_at: Date.now()
    }).then(() => {
      alert('Snippet saved to SQLite successfully.');
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this code snippet?')) {
      deleteSnippetItem(id).then(() => {
        if (activeId === id) {
          setActiveId(null);
        }
      });
    }
  };

  const filteredSnippets = snippets.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs')
    : (theme === 'dark' ? 'vs-dark' : 'vs');

  const languagesList = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'sql', label: 'SQL Query' },
    { value: 'shell', label: 'Shell Script' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' }
  ];

  return (
    <div className="flex h-full w-full overflow-hidden theme-bg-primary">
      {/* Left listing sidebar */}
      <div className="w-80 border-r theme-border flex flex-col h-full bg-[var(--bg-secondary)]">
        <div className="p-4 border-b theme-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Code Snippets</h3>
            <button
              onClick={handleCreateSnippet}
              className="p-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="New Snippet"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Search snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {filteredSnippets.map(s => {
            const isActive = s.id === activeId;
            return (
              <div
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                  isActive
                    ? 'bg-[var(--bg-primary)] border-[var(--accent-color)] text-[var(--text-primary)] shadow-sm'
                    : 'border-transparent hover:bg-white theme-text-primary'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Code2 size={13} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-xs font-bold truncate">{s.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(s.id, e)}
                    className="p-0.5 text-zinc-500 hover:text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[9px] theme-text-secondary font-mono">
                  <span className="uppercase bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border theme-border font-bold">
                    {s.language}
                  </span>
                  <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
          {filteredSnippets.length === 0 && (
            <div className="text-[11px] text-zinc-500 text-center py-8">No code snippets saved. Create one now!</div>
          )}
        </div>
      </div>

      {/* Right workbench Monaco editor panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeId ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-4 gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b theme-border pb-3">
              <div className="flex flex-col gap-1 flex-grow max-w-sm">
                <input
                  type="text"
                  placeholder="Snippet Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-sm font-bold theme-text-primary bg-transparent focus:outline-none border-b border-transparent focus:border-[var(--accent-color)]/30 px-1 py-0.5"
                />
                <input
                  type="text"
                  placeholder="Optional description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-[10px] theme-text-secondary bg-transparent focus:outline-none px-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2.5 py-1.5 text-xs theme-text-primary bg-[var(--bg-secondary)] border theme-border rounded-lg focus:outline-none cursor-pointer font-bold"
                >
                  {languagesList.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save size={13} /> Save Snippet
                </button>
              </div>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border theme-border relative bg-[var(--bg-primary)]">
              <Editor
                height="100%"
                language={language}
                theme={resolvedTheme}
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{
                  minimap: { enabled: false },
                  scrollbar: { vertical: 'auto', horizontal: 'auto' },
                  lineNumbers: 'on',
                  fontSize: 12,
                  fontFamily: 'Fira Code, Monaco, monospace',
                  padding: { top: 8, bottom: 8 },
                  automaticLayout: true
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 select-none gap-2">
            <Cpu size={36} className="text-indigo-500/40" />
            <span className="text-xs font-bold uppercase tracking-wider">No Active Snippet Selected</span>
            <span className="text-[11px]">Select a code snippet from the left pane or create a new snippet.</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default CodeSnippets;
