import React, { useState } from 'react';
import { Copy, Save } from 'lucide-react';
import { useStore } from '../../store';
import PrettyViewer from './PrettyViewer';
import PreviewViewer from './PreviewViewer';

export const ResponseTabs: React.FC = () => {
  const { tabs, activeTabId } = useStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const [activePane, setActivePane] = useState<'pretty' | 'raw' | 'preview' | 'headers'>('pretty');
  const [copied, setCopied] = useState(false);

  if (!activeTab) return null;

  const { response, isSending } = activeTab;

  if (isSending) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-zinc-400 font-medium">Sending Request...</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-1.5 text-zinc-500 select-none">
        <span className="text-xs font-semibold uppercase tracking-wider">No Response</span>
        <span className="text-[11px] text-zinc-600">Send a request to see output here</span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    let extension = 'txt';
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) extension = 'json';
    else if (contentType.includes('text/html')) extension = 'html';

    const defaultPath = `response_${Date.now()}.${extension}`;
    await window.api.saveToFile(defaultPath, response.body);
  };

  const statusColor = response.status >= 200 && response.status < 300
    ? 'text-emerald-400 bg-emerald-500/10'
    : response.status >= 300 && response.status < 400
      ? 'text-sky-400 bg-sky-500/10'
      : 'text-rose-400 bg-rose-500/10';

  const panes = [
    { id: 'pretty' as const, label: 'Pretty' },
    { id: 'raw' as const, label: 'Raw' },
    { id: 'preview' as const, label: 'Preview' },
    { id: 'headers' as const, label: 'Headers' }
  ];

  return (
    <div className="h-full w-full flex flex-col gap-3">
      {/* Response Meta Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-secondary)] p-3 rounded-xl border theme-border">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-xs theme-text-secondary">
            Time: <strong className="theme-text-primary">{response.duration} ms</strong>
          </span>
          <span className="text-xs theme-text-secondary">
            Size: <strong className="theme-text-primary">{(response.size / 1024).toFixed(2)} KB</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy Response Body"
            className="p-2 rounded-lg theme-bg-primary hover:bg-[var(--bg-secondary)] text-[var(--accent-color)] border theme-border transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            <Copy size={13} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleSave}
            title="Save to File"
            className="p-2 rounded-lg theme-bg-primary hover:bg-[var(--bg-secondary)] text-[var(--accent-color)] border theme-border transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            <Save size={13} />
            Save
          </button>
        </div>
      </div>

      {/* Pane selectors */}
      <div className="flex gap-2 border-b theme-border pb-2">
        {panes.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePane(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activePane === p.id
                ? 'bg-[var(--accent-color)] text-white'
                : 'theme-text-secondary hover:bg-[var(--bg-secondary)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Content Panes */}
      <div className="flex-1 min-h-[200px] overflow-hidden">
        {activePane === 'pretty' && <PrettyViewer body={response.body} />}
        
        {activePane === 'raw' && (
          <textarea
            readOnly
            value={response.body}
            className="w-full h-full p-4 rounded-xl theme-bg-secondary border theme-border text-xs font-mono theme-text-primary focus:outline-none resize-none overflow-auto"
          />
        )}

        {activePane === 'preview' && <PreviewViewer body={response.body} />}

        {activePane === 'headers' && (
          <div className="w-full h-full overflow-y-auto rounded-xl theme-bg-secondary border theme-border p-4 flex flex-col gap-2">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex border-b border-zinc-100 pb-1.5 text-xs">
                <span className="w-1/3 theme-text-secondary font-medium font-mono">{key}</span>
                <span className="w-2/3 theme-text-primary select-text font-mono break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ResponseTabs;
