import React, { useState } from 'react';
import { Clipboard, Check, Braces, Download, Sparkles, X } from 'lucide-react';

export const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatJson = (spaces: number | string) => {
    setError(null);
    if (!input.trim()) { setOutput(''); return; }
    try {
      const parsed = JSON.parse(input);
      setOutput(spaces === 'tab' ? JSON.stringify(parsed, null, '\t') : JSON.stringify(parsed, null, Number(spaces)));
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
    }
  };

  const minifyJson = () => {
    setError(null);
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(JSON.stringify(JSON.parse(input)));
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'formatted.json'; a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleClear = () => { setInput(''); setOutput(''); setError(null); };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden theme-bg-primary">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b theme-border gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-color)]/20 flex items-center justify-center">
            <Braces size={15} className="text-[var(--accent-color)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold theme-text-primary">JSON Formatter & Validator</h2>
            <p className="text-[10px] text-zinc-500">Prettify, validate and minify JSON payloads</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Format buttons in top bar */}
          <div className="flex gap-1.5">
            <button onClick={() => formatJson(2)} className="px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
              2 Spaces
            </button>
            <button onClick={() => formatJson(4)} className="px-3 py-1.5 theme-bg-secondary text-[var(--accent-color)] border theme-border hover:border-[var(--accent-color)]/50 text-xs font-bold rounded-lg transition-colors cursor-pointer">
              4 Spaces
            </button>
            <button onClick={() => formatJson('tab')} className="px-3 py-1.5 theme-bg-secondary text-[var(--accent-color)] border theme-border hover:border-[var(--accent-color)]/50 text-xs font-bold rounded-lg transition-colors cursor-pointer">
              Tabs
            </button>
            <button onClick={minifyJson} className="px-3 py-1.5 theme-bg-secondary text-[var(--accent-color)] border theme-border hover:border-[var(--accent-color)]/50 text-xs font-bold rounded-lg transition-colors cursor-pointer">
              Minify
            </button>
          </div>
          <div className="w-px h-5 bg-[var(--border-color)]" />
          <button
            onClick={handleCopy}
            disabled={!output}
            className="px-3 py-1.5 text-xs font-bold theme-bg-secondary theme-text-primary border theme-border hover:border-[var(--accent-color)]/50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!output}
            className="px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloaded ? <Check size={12} /> : <Download size={12} />}
            {downloaded ? 'Saved!' : 'Save JSON'}
          </button>
          <button onClick={handleClear} title="Clear all" className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-[350px] p-4">
        {/* Input panel */}
        <div className="flex flex-col gap-2 min-w-0">
          <label className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Source JSON</label>
          <textarea
            placeholder="Paste raw JSON here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-4 rounded-xl bg-[var(--bg-secondary)] border theme-border text-xs font-mono theme-text-primary focus:outline-none resize-none overflow-auto"
          />
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-2 min-w-0 h-full">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Formatted Output</label>
            {output && (
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-[11px] font-bold bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/10 rounded-lg flex items-center gap-1 cursor-pointer transition-all hover:opacity-90"
              >
                {copied ? <Check size={12} /> : <Clipboard size={12} />}
                {copied ? 'Copied' : 'Copy Output'}
              </button>
            )}
          </div>

          <div className="flex-1 rounded-xl border theme-border theme-bg-secondary relative overflow-hidden flex flex-col">
            <textarea
              readOnly
              value={output}
              placeholder="Output will appear here..."
              className="flex-1 p-4 bg-transparent text-xs font-mono theme-text-primary focus:outline-none resize-none overflow-auto"
            />
            {error && (
              <div className="absolute inset-x-0 bottom-0 bg-rose-50 border-t border-rose-200 p-3 text-rose-600 font-mono text-[11px] select-text">
                <strong>Syntax Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formatting controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-secondary)] p-3 rounded-xl border theme-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => formatJson(2)}
            className="px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Prettify 2 Spaces
          </button>
          <button
            onClick={() => formatJson(4)}
            className="px-4 py-2 theme-bg-primary text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Prettify 4 Spaces
          </button>
          <button
            onClick={() => formatJson('tab')}
            className="px-4 py-2 theme-bg-primary text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Prettify Tabs
          </button>
          <button
            onClick={minifyJson}
            className="px-4 py-2 theme-bg-primary text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Minify / Compress
          </button>
        </div>

        <div className="text-[11px] theme-text-secondary font-medium flex items-center gap-1">
          <Sparkles size={12} className="text-amber-500" />
          Supports real-time parse validation.
        </div>
      </div>
    </div>
  );
};
export default JsonFormatter;
