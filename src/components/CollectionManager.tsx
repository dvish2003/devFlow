import React, { useState } from 'react';
import { Plus, Trash2, FolderPlus, FilePlus, ChevronRight, ChevronDown, Folder, FileCode, Upload, Download } from 'lucide-react';
import { useStore } from '../store';
import { getMethodColor } from './Tabs';

export const CollectionManager: React.FC = () => {
  const { collections, requests, createCollection, deleteCollection, createRequest, deleteRequest } = useStore();
  const [newColName, setNewColName] = useState('');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await createCollection(newColName.trim());
    setNewColName('');
  };

  const handleCreateRequest = async (colId: string) => {
    const name = prompt('Enter request name:');
    if (!name) return;
    await createRequest(name, 'GET', colId);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = () => {
    // Generate simple Postman v2 format export
    const postmanJson = {
      info: {
        name: "DevFlow Workspace Export",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: collections.map(col => {
        const colRequests = requests.filter(r => r.collection_id === col.id);
        return {
          name: col.name,
          item: colRequests.map(r => ({
            name: r.name,
            request: {
              method: r.method,
              header: r.headers.map(h => ({ key: h.key, value: h.value })),
              url: { raw: r.url }
            }
          }))
        };
      })
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(postmanJson, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `devflow_collections_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.item && Array.isArray(parsed.item)) {
          for (const folder of parsed.item) {
            const folderId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            await createCollection(folder.name);
            // Wait brief moment or map structure
            const currentCollections = useStore.getState().collections;
            const newlyCreated = currentCollections[currentCollections.length - 1];

            if (folder.item && Array.isArray(folder.item)) {
              for (const reqItem of folder.item) {
                const method = reqItem.request?.method || 'GET';
                const url = reqItem.request?.url?.raw || reqItem.request?.url || '';
                const newReq = await createRequest(reqItem.name, method, newlyCreated.id);
                // Update imported request params
                useStore.getState().saveRequest({
                  ...newReq,
                  url,
                  headers: (reqItem.request?.header || []).map((h: any) => ({
                    key: h.key,
                    value: h.value,
                    enabled: true
                  }))
                });
              }
            }
          }
        }
      } catch (err) {
        alert('Failed to parse file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 h-full p-4 theme-text-primary">
      <div className="flex items-center justify-between border-b theme-border pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Collections</h3>
        <div className="flex items-center gap-1.5">
          <label className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors" title="Import Postman Collections">
            <Upload size={14} />
            <input type="file" onChange={handleImport} accept=".json" className="hidden" />
          </label>
          <button onClick={handleExport} className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors" title="Export Collections">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Create collection form */}
      <form onSubmit={handleCreateCollection} className="flex gap-2">
        <input
          type="text"
          placeholder="New collection name..."
          value={newColName}
          onChange={(e) => setNewColName(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
        />
        <button
          type="submit"
          className="p-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Collection Tree listing */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {collections.map(col => {
          const isExpanded = !!expandedFolders[col.id];
          const colRequests = requests.filter(r => r.collection_id === col.id);

          return (
            <div key={col.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all">
                <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleFolder(col.id)}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Folder size={14} className="text-amber-500" />
                  <span className="text-xs font-medium">{col.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleCreateRequest(col.id)} title="Add Request" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-zinc-200 cursor-pointer">
                    <FilePlus size={12} />
                  </button>
                  <button onClick={() => deleteCollection(col.id)} title="Delete Folder" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-rose-400 cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="pl-6 flex flex-col border-l theme-border ml-3.5 my-1 gap-1">
                  {colRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between group px-2 py-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-all">
                      <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => useStore.getState().addTab(req)}>
                        <FileCode size={13} className="text-zinc-500" />
                        <span className={`text-[9px] font-bold ${getMethodColor(req.method)}`}>{req.method}</span>
                        <span className="text-[11px] truncate max-w-[120px]">{req.name}</span>
                      </div>
                      <button onClick={() => deleteRequest(req.id)} title="Delete Request" className="p-1 opacity-0 group-hover:opacity-100 rounded hover:bg-[var(--bg-secondary)] text-zinc-500 hover:text-rose-400 cursor-pointer transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                  {colRequests.length === 0 && (
                    <span className="text-[10px] text-zinc-600 italic px-2">Folder is empty</span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {collections.length === 0 && (
          <div className="text-xs text-zinc-500 text-center py-6">No collections created.</div>
        )}
      </div>
    </div>
  );
};
export default CollectionManager;
