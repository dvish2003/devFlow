import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import type { RequestParam } from '../../types';

export const ParamsEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTabRequest } = useStore();
  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab) return null;
  const params = activeTab.request.params || [];

  const handleUpdate = (index: number, patch: Partial<RequestParam>) => {
    updateActiveTabRequest((req) => {
      const newParams = [...req.params];
      newParams[index] = { ...newParams[index], ...patch };

      // Dynamically rebuild the URL query parameters
      const urlBase = req.url.split('?')[0];
      const searchParams = new URLSearchParams();
      newParams.forEach(p => {
        if (p.enabled && p.key) {
          searchParams.append(p.key, p.value);
        }
      });
      const queryStr = searchParams.toString();
      const newUrl = queryStr ? `${urlBase}?${queryStr}` : urlBase;

      return { ...req, params: newParams, url: newUrl };
    });
  };

  const handleAdd = () => {
    updateActiveTabRequest((req) => ({
      ...req,
      params: [...req.params, { key: '', value: '', enabled: true }]
    }));
  };

  const handleRemove = (index: number) => {
    updateActiveTabRequest((req) => {
      const newParams = req.params.filter((_, idx) => idx !== index);

      const urlBase = req.url.split('?')[0];
      const searchParams = new URLSearchParams();
      newParams.forEach(p => {
        if (p.enabled && p.key) {
          searchParams.append(p.key, p.value);
        }
      });
      const queryStr = searchParams.toString();
      const newUrl = queryStr ? `${urlBase}?${queryStr}` : urlBase;

      return {
        ...req,
        params: newParams.length === 0 ? [{ key: '', value: '', enabled: true }] : newParams,
        url: newUrl
      };
    });
  };

  return (
    <div className="w-full flex flex-col gap-3 py-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Query Params</span>
        <button
          onClick={handleAdd}
          className="text-xs text-[var(--accent-color)] hover:opacity-90 flex items-center gap-1 cursor-pointer bg-[var(--accent-bg)] px-2.5 py-1 rounded-md transition-colors font-bold"
        >
          <Plus size={14} /> Add Parameter
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        {params.map((p, index) => (
          <div key={index} className="flex items-center gap-2 animate-fade-in">
            <input
              type="checkbox"
              checked={p.enabled}
              onChange={(e) => handleUpdate(index, { enabled: e.target.checked })}
              className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
            />
            <input
              type="text"
              placeholder="Param Key"
              value={p.key}
              onChange={(e) => handleUpdate(index, { key: e.target.value })}
              className="flex-1 px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Value"
              value={p.value}
              onChange={(e) => handleUpdate(index, { value: e.target.value })}
              className="flex-1 px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
            <button
              onClick={() => handleRemove(index)}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ParamsEditor;
