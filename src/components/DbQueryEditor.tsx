/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Save, Trash2, CheckCircle, Database } from 'lucide-react';
import { useStore } from '../store';

interface DbQueryEditorProps {
  connectionId: string;
  tabId: string;
  initialQuery?: string;
}

export const DbQueryEditor: React.FC<DbQueryEditorProps> = ({ connectionId, tabId, initialQuery }) => {
  const { dbConnections, dbHistory, addDbHistoryLog, clearDbHistoryLog, theme } = useStore();
  const conn = dbConnections.find(c => c.id === connectionId);
  const [query, setQuery] = useState(() => {
    if (conn?.type === 'mongo') {
      return initialQuery || 'db.collectionName.find()';
    }
    return initialQuery || 'SELECT * FROM table LIMIT 100';
  });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [results, setResults] = useState<{ rows: any[]; columns: string[] } | null>(null);

  // Auto Refresh States
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [customInterval, setCustomInterval] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs')
    : (theme === 'dark' ? 'vs-dark' : 'vs');

  const handleRun = useCallback(async () => {
    if (!conn) return;
    setRunning(true);
    setError(null);
    setResults(null);

    try {
      const res = await window.api.executeDbQuery(conn, query);
      setResults(res);

      // Save log in history
      await addDbHistoryLog(connectionId, query);
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      setRunning(false);
    }
  }, [conn, query, connectionId, addDbHistoryLog]);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    const intervalId = setInterval(() => {
      handleRun();
    }, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, handleRun]);

  // Bind Ctrl+Enter keyboard listener inside Monaco workspace
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-hidden">
      {/* Query workbench splitpane */}
      <div className="flex-1 grid grid-rows-2 gap-4 overflow-hidden">
        {/* Monaco query editor container */}
        <div className="flex flex-col gap-2 bg-white rounded-xl border theme-border overflow-hidden p-2">
          <div className="flex justify-between items-center px-2 pb-1 border-b theme-border">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Console Editor</span>
            <div className="flex items-center gap-1.5">
              <select
                value={refreshInterval === null ? 'off' : showCustomInput ? 'custom' : refreshInterval}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'off') {
                    setRefreshInterval(null);
                    setShowCustomInput(false);
                  } else if (val === 'custom') {
                    setShowCustomInput(true);
                  } else {
                    setRefreshInterval(Number(val));
                    setShowCustomInput(false);
                  }
                }}
                className={`px-2 py-1 text-[11px] rounded border focus:outline-none cursor-pointer ${
                  theme === 'light' ? 'bg-[#ffffff] text-zinc-700 border-[#e4e4e7]' : 'bg-[#0e0e11] text-zinc-300 border-[#1a1a24]'
                }`}
              >
                <option value="off">Auto Run: Off</option>
                <option value="5000">Every 5s</option>
                <option value="10000">Every 10s</option>
                <option value="30000">Every 30s</option>
                <option value="60000">Every 60s</option>
                <option value="custom">Custom...</option>
              </select>

              {showCustomInput && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Sec"
                    value={customInterval}
                    onChange={(e) => {
                      setCustomInterval(e.target.value);
                      const seconds = Number(e.target.value);
                      if (seconds > 0) {
                        setRefreshInterval(seconds * 1000);
                      }
                    }}
                    className={`w-12 px-1.5 py-0.5 text-[11px] rounded border focus:outline-none font-mono ${
                      theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border-[#e4e4e7]' : 'bg-[#0e0e11] text-zinc-200 border-[#1a1a24]'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-500">s</span>
                </div>
              )}

              <button
                onClick={handleRun}
                disabled={running}
                className="px-3 py-1 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Play size={12} className="fill-current" /> Run Query
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <Editor
              height="100%"
              language={conn?.type === 'mongo' ? 'javascript' : 'sql'}
              theme={resolvedTheme}
              value={query}
              onChange={(v) => setQuery(v || '')}
              onMount={handleEditorDidMount}
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

        {/* Results grid container */}
        <div className="flex flex-col gap-2 overflow-hidden">
          <div className="border-b theme-border pb-1 flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Console Output</span>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border theme-border bg-white relative">
            {running && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] text-xs text-zinc-400 font-semibold select-none animate-pulse">
                Running script...
              </div>
            )}

            {error && (
              <div className="p-4 text-rose-500 font-mono text-xs select-text whitespace-pre-wrap">
                Error: {error}
              </div>
            )}

            {results && results.rows.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs font-mono select-text">
                <thead>
                  <tr className="bg-[var(--bg-sidebar)] border-b theme-border text-zinc-650 sticky top-0">
                    {results.columns.map(col => (
                      <th key={col} className="p-2 border-r theme-border font-bold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, idx) => (
                    <tr key={idx} className="border-b theme-border hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      {results.columns.map(col => {
                        const cell = row[col];
                        return (
                          <td key={col} className="p-2 border-r theme-border truncate max-w-[220px]">
                            {cell !== null ? (typeof cell === 'object' ? JSON.stringify(cell) : String(cell)) : <em className="text-zinc-400">null</em>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              !running && !error && (
                <div className="w-full text-center py-12 text-zinc-500 italic select-none">
                  Console is idle. Run scripts above (Ctrl+Enter).
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DbQueryEditor;
