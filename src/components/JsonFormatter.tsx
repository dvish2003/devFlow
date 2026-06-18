import React, { useState } from 'react';
import { Clipboard, Check, RefreshCw, Braces, Sparkles } from 'lucide-react';

export const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatJson = (spaces: number | string) => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const formatted = spaces === 'tab'
        ? JSON.stringify(parsed, null, '\t')
        : JSON.stringify(parsed, null, Number(spaces));
      setOutput(formatted);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
    }
  };

  const minifyJson = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
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

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden p-4 gap-4 theme-bg-primary">
      <div className="border-b theme-border pb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">JSON Formatter & Validator</h3>
        <button
          onClick={handleClear}
          className="text-[10px] uppercase font-bold text-zinc-500 hover:text-rose-500 cursor-pointer transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-[350px]">
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

          <div className="flex-1 rounded-xl border theme-border bg-white relative overflow-hidden flex flex-col">
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
            className="px-4 py-2 bg-white text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Prettify 4 Spaces
          </button>
          <button
            onClick={() => formatJson('tab')}
            className="px-4 py-2 bg-white text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Prettify Tabs
          </button>
          <button
            onClick={minifyJson}
            className="px-4 py-2 bg-white text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
