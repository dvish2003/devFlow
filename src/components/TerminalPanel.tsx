/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Terminal, Plus, X, RotateCcw } from 'lucide-react';
import { useStore } from '../store';

// ─── IPC bridge helpers ───────────────────────────────────────────────────────
const api = () => (window as any).api ?? null;

interface TermTab {
  id: string;
  title: string;
  pid?: number;
}

// ─── Single xterm pane ────────────────────────────────────────────────────────
const TermPane: React.FC<{
  tabId: string;
  active: boolean;
  onTitleChange: (id: string, title: string) => void;
}> = ({ tabId, active, onTitleChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const initDone = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initDone.current) return;
    initDone.current = true;

    const term = new XTerm({
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Menlo', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true,
      scrollback: 5000,
      theme: {
        background: '#0d0f14',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
        cursorAccent: '#0d0f14',
        selectionBackground: '#3b82f640',
        black: '#0d0f14',
        red: '#f87171',
        green: '#34d399',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#a78bfa',
        cyan: '#22d3ee',
        white: '#e2e8f0',
        brightBlack: '#374151',
        brightRed: '#ef4444',
        brightGreen: '#10b981',
        brightYellow: '#f59e0b',
        brightBlue: '#3b82f6',
        brightMagenta: '#8b5cf6',
        brightCyan: '#06b6d4',
        brightWhite: '#f8fafc',
      }
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);
    termRef.current = term;
    fitRef.current = fitAddon;

    setTimeout(() => {
      try { fitAddon.fit(); } catch { /* ignore */ }
    }, 100);

    // Try Electron IPC terminal
    const electronApi = api();
    if (electronApi?.termCreate) {
      electronApi.termCreate(tabId, term.cols, term.rows).then((pid: number) => {
        onTitleChange(tabId, `Shell (${pid})`);
      }).catch(() => {
        // Fallback: simulate terminal
        fallbackMode(term);
      });

      // Receive data from pty
      electronApi.onTermData(tabId, (data: string) => {
        term.write(data);
      });

      // Send input to pty
      term.onData((data) => {
        electronApi.termWrite(tabId, data);
      });

      // Resize
      term.onResize(({ cols, rows }) => {
        electronApi.termResize(tabId, cols, rows);
      });
    } else {
      // Browser / non-Electron fallback simulation
      fallbackMode(term);
    }

    return () => {
      electronApi?.termKill?.(tabId);
      term.dispose();
      initDone.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit when active tab changes
  useEffect(() => {
    if (active && fitRef.current && containerRef.current) {
      setTimeout(() => {
        try { fitRef.current?.fit(); } catch { /* ignore */ }
      }, 50);
    }
  }, [active]);

  // Handle resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (active) {
        try { fitRef.current?.fit(); } catch { /* ignore */ }
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [active]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ display: active ? 'block' : 'none', padding: '4px' }}
    />
  );
};

// ─── Fallback: simple simulated shell (no Electron) ──────────────────────────
function fallbackMode(term: XTerm) {
  const cwd = '~/devflow';
  const prompt = () => term.write(`\r\n\x1b[32mdevflow\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `);
  term.writeln('\x1b[1;34m┌─────────────────────────────────────────────────────────────┐\x1b[0m');
  term.writeln('\x1b[1;34m│\x1b[0m  \x1b[1;36mDevFlow Studio Terminal\x1b[0m  \x1b[90m(Electron IPC not available)\x1b[0m  \x1b[1;34m│\x1b[0m');
  term.writeln('\x1b[1;34m└─────────────────────────────────────────────────────────────┘\x1b[0m');
  term.writeln('\x1b[90mRunning in browser mode — limited shell simulation\x1b[0m');
  term.writeln('\x1b[90mStart the Electron app for full terminal access.\x1b[0m');
  prompt();

  let buf = '';
  const COMMANDS: Record<string, () => string> = {
    'help': () => [
      '\x1b[1;33mAvailable commands:\x1b[0m',
      '  \x1b[36mhelp\x1b[0m      Show this help',
      '  \x1b[36mclear\x1b[0m     Clear terminal',
      '  \x1b[36mpwd\x1b[0m       Print working directory',
      '  \x1b[36mls\x1b[0m        List files',
      '  \x1b[36mdate\x1b[0m      Current date/time',
      '  \x1b[36mecho\x1b[0m      Print text',
      '  \x1b[36mnode -v\x1b[0m   Node version (simulated)',
    ].join('\r\n'),
    'clear': () => { term.clear(); return ''; },
    'pwd': () => `/Users/user/${cwd.slice(2)}`,
    'ls': () => '\x1b[34melectron/\x1b[0m  \x1b[34msrc/\x1b[0m  \x1b[34mdist/\x1b[0m  package.json  vite.config.ts  README.md',
    'date': () => new Date().toString(),
    'node -v': () => 'v20.0.0 (simulated)',
    'npm -v': () => '10.0.0 (simulated)',
    'whoami': () => 'developer',
  };

  term.onKey(({ key, domEvent }) => {
    const code = domEvent.keyCode;
    if (code === 13) { // Enter
      const cmd = buf.trim();
      buf = '';
      term.write('\r\n');
      if (cmd) {
        if (cmd.startsWith('echo ')) {
          term.writeln(cmd.slice(5));
        } else if (COMMANDS[cmd]) {
          const out = COMMANDS[cmd]();
          if (out) term.writeln(out);
        } else {
          term.writeln(`\x1b[31mCommand not found: ${cmd}\x1b[0m  (try \x1b[36mhelp\x1b[0m)`);
        }
      }
      prompt();
    } else if (code === 8) { // Backspace
      if (buf.length > 0) {
        buf = buf.slice(0, -1);
        term.write('\b \b');
      }
    } else if (code === 67 && domEvent.ctrlKey) { // Ctrl+C
      buf = '';
      term.write('^C');
      prompt();
    } else if (key.length === 1) {
      buf += key;
      term.write(key);
    }
  });
}

// ─── Main Terminal Panel ──────────────────────────────────────────────────────
export const TerminalPanel: React.FC = () => {
  const { theme } = useStore();
  const [tabs, setTabs] = useState<TermTab[]>([{ id: 'term_0', title: 'Terminal 1' }]);
  const [activeTabId, setActiveTabId] = useState('term_0');
  const counterRef = useRef(1);

  const addTab = useCallback(() => {
    counterRef.current += 1;
    const id = `term_${Date.now()}`;
    const title = `Terminal ${counterRef.current}`;
    setTabs(prev => [...prev, { id, title }]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    api()?.termKill?.(id);
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (next.length === 0) {
        const newId = `term_${Date.now()}`;
        counterRef.current += 1;
        setTimeout(() => setActiveTabId(newId), 0);
        return [{ id: newId, title: `Terminal ${counterRef.current}` }];
      }
      if (id === activeTabId) {
        setActiveTabId(next[next.length - 1].id);
      }
      return next;
    });
  }, [activeTabId]);

  const handleTitleChange = useCallback((id: string, title: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, title } : t));
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden" style={{ background: '#0d0f14' }}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0 ${isDark ? 'border-zinc-800 bg-[#0d0f14]' : 'border-zinc-800 bg-[#0d0f14]'}`}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Terminal size={14} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100">Integrated Terminal</h2>
            <p className="text-[10px] text-zinc-500">
              {api()?.termCreate ? 'Full shell via Electron IPC' : 'Browser simulation mode — launch Electron for full shell'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={addTab}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => {
              setTabs([{ id: `term_${Date.now()}`, title: 'Terminal 1' }]);
              counterRef.current = 1;
              setActiveTabId(`term_${Date.now()}`);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
            title="Reset All"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-zinc-800 bg-[#0d0f14] overflow-x-auto scrollbar-none flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex-shrink-0 group ${
                tab.id === activeTabId
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <Terminal size={11} />
              <span className="max-w-[100px] truncate">{tab.title}</span>
              <span
                onClick={e => closeTab(tab.id, e)}
                className="ml-0.5 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <X size={10} />
              </span>
            </button>
          ))}
          <button
            onClick={addTab}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer flex-shrink-0"
          >
            <Plus size={11} /> New
          </button>
        </div>
      )}

      {/* Terminal panes */}
      <div className="flex-1 overflow-hidden relative">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className="absolute inset-0 overflow-hidden"
            style={{ display: tab.id === activeTabId ? 'flex' : 'none', flexDirection: 'column' }}
          >
            <TermPane
              tabId={tab.id}
              active={tab.id === activeTabId}
              onTitleChange={handleTitleChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
export default TerminalPanel;
