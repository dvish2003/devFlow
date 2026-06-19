/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Search, Trash2, Clock } from 'lucide-react';
import { useStore } from '../store';
import { getMethodColor } from './Tabs';

const getNow = () => Date.now();

export const HistoryPanel: React.FC = () => {
  const { history, clearHistory, addTab } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear your query history?')) {
      await clearHistory();
    }
  };

  const handleSelectHistory = (item: any) => {
    // Reconstruct into a draft active request tab
    addTab({
      name: `History: ${item.method}`,
      method: item.method,
      url: item.url,
      created_at: getNow()
    });
  };

  const filteredHistory = history.filter(h =>
    h.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-full p-4 theme-text-primary">
      <div className="flex items-center justify-between border-b theme-border pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">History</h3>
        <button
          onClick={handleClear}
          title="Clear all history"
          className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 text-zinc-500" size={14} />
        <input
          type="text"
          placeholder="Filter history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
        />
      </div>

      {/* History listing log */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {filteredHistory.map(item => {
          const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const statusColor = item.status && item.status >= 200 && item.status < 300
            ? 'text-emerald-400'
            : item.status && item.status >= 400
              ? 'text-rose-400'
              : 'text-zinc-500';

          return (
            <div
              key={item.id}
              onClick={() => handleSelectHistory(item)}
              className="flex flex-col gap-1.5 p-2.5 rounded-lg border theme-border bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold uppercase ${getMethodColor(item.method)}`}>
                  {item.method}
                </span>
                <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                  <Clock size={10} /> {formattedTime}
                </span>
              </div>
              <div className="text-xs truncate theme-text-primary font-mono select-none">
                {item.url}
              </div>
              <div className="flex justify-between items-center text-[10px] theme-text-secondary">
                <span className={statusColor}>{item.status ? `Status: ${item.status}` : 'No Response'}</span>
                <span>{item.response_time ? `${item.response_time} ms` : ''}</span>
              </div>
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div className="text-xs text-zinc-500 text-center py-6">No matching queries in history log.</div>
        )}
      </div>
    </div>
  );
};
export default HistoryPanel;
