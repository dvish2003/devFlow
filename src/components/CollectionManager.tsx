/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Plus, Trash2, FolderPlus, FilePlus, ChevronRight, ChevronDown, Folder, FileCode, Upload, Download } from 'lucide-react';
import { useStore } from '../store';
import { getMethodColor } from './Tabs';

export const CollectionManager: React.FC = () => {
  const { collections, requests, createCollection, deleteCollection, createRequest, deleteRequest, activeTabId, tabs } = useStore();
  const [newColName, setNewColName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeRequestCollectionId = activeTab?.request?.collection_id;

  // Auto-expand folder hierarchy for the active request's collection
  React.useEffect(() => {
    if (activeRequestCollectionId) {
      setExpandedFolders(prev => {
        const next = { ...prev, [activeRequestCollectionId]: true };
        let parentId = collections.find(c => c.id === activeRequestCollectionId)?.parent_id;
        while (parentId) {
          next[parentId] = true;
          parentId = collections.find(c => c.id === parentId)?.parent_id;
        }
        return next;
      });
    }
  }, [activeRequestCollectionId, collections]);

  // Custom Prompt Modal state
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptPlaceholder, setPromptPlaceholder] = useState('');
  const [promptValue, setPromptValue] = useState('');
  const [promptCallback, setPromptCallback] = useState<((value: string) => void) | null>(null);

  const showPrompt = (title: string, placeholder: string, defaultValue: string, callback: (value: string) => void) => {
    setPromptTitle(title);
    setPromptPlaceholder(placeholder);
    setPromptValue(defaultValue);
    setPromptCallback(() => callback);
    setPromptOpen(true);
  };

  const handleCreateCollection = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      await createCollection(newColName.trim());
      setNewColName('');
    } catch (err) {
      alert('Error creating collection: ' + err);
    }
  };

  const handleCreateSubCollection = (parentId: string) => {
    showPrompt('Create Folder', 'Folder name...', '', async (name) => {
      if (name.trim()) {
        await createCollection(name.trim(), parentId);
      }
    });
  };

  const handleCreateRequest = (colId: string) => {
    showPrompt('Create Request', 'Request name...', '', async (name) => {
      if (name.trim()) {
        await createRequest(name.trim(), 'GET', colId);
      }
    });
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = () => {
    const buildPostmanItem = (colId: string): any => {
      const col = collections.find(c => c.id === colId);
      if (!col) return null;

      const subCols = collections.filter(c => c.parent_id === colId);
      const colRequests = requests.filter(r => r.collection_id === colId);

      const items: any[] = [];

      // Add subfolders recursively
      for (const subCol of subCols) {
        const folderItem = buildPostmanItem(subCol.id);
        if (folderItem) {
          items.push(folderItem);
        }
      }

      // Add requests
      for (const r of colRequests) {
        // Map Auth
        let auth: any = undefined;
        if (r.auth_type && r.auth_type !== 'none') {
          if (r.auth_type === 'bearer') {
            auth = {
              type: 'bearer',
              bearer: [{ key: 'token', value: r.auth_config?.token || '', type: 'string' }]
            };
          } else if (r.auth_type === 'basic') {
            auth = {
              type: 'basic',
              basic: [
                { key: 'username', value: r.auth_config?.username || '', type: 'string' },
                { key: 'password', value: r.auth_config?.password || '', type: 'string' }
              ]
            };
          } else if (r.auth_type === 'apikey') {
            auth = {
              type: 'apikey',
              apikey: [
                { key: 'key', value: r.auth_config?.key || '', type: 'string' },
                { key: 'value', value: r.auth_config?.value || '', type: 'string' },
                { key: 'in', value: r.auth_config?.addTo || 'header', type: 'string' }
              ]
            };
          }
        }

        // Map Body
        let body: any = undefined;
        if (r.body_type && r.body_type !== 'none') {
          if (r.body_type === 'json' || r.body_type === 'raw') {
            body = {
              mode: 'raw',
              raw: r.body_content || ''
            };
          } else if (r.body_type === 'x-www-form-urlencoded') {
            let urlencodedList = [];
            try { urlencodedList = JSON.parse(r.body_content || '[]'); } catch {}
            body = {
              mode: 'urlencoded',
              urlencoded: urlencodedList.map((x: any) => ({
                key: x.key || '',
                value: x.value || '',
                disabled: !x.enabled
              }))
            };
          } else if (r.body_type === 'form-data') {
            let formdataList = [];
            try { formdataList = JSON.parse(r.body_content || '[]'); } catch {}
            body = {
              mode: 'formdata',
              formdata: formdataList.map((x: any) => ({
                key: x.key || '',
                value: x.value || '',
                type: x.type || 'text',
                disabled: !x.enabled
              }))
            };
          }
        }

        items.push({
          name: r.name,
          request: {
            method: r.method,
            header: (r.headers || []).filter((h: any) => h.key).map((h: any) => ({
              key: h.key,
              value: h.value,
              disabled: !h.enabled
            })),
            body,
            url: {
              raw: r.url,
              query: (r.params || []).filter((q: any) => q.key).map((q: any) => ({
                key: q.key,
                value: q.value,
                disabled: !q.enabled
              }))
            },
            auth
          }
        });
      }

      return {
        name: col.name,
        item: items
      };
    };

    const topLevelCollections = collections.filter(c => !c.parent_id);

    const postmanJson = {
      info: {
        name: "DevFlow Exported Collections",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: topLevelCollections.map(c => buildPostmanItem(c.id)).filter(Boolean)
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(postmanJson, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `devflow_postman_collections_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parsePostmanItem = async (item: any, collectionId: string) => {
      if (item.request) {
        const method = item.request.method || 'GET';
        let url = '';
        if (item.request.url) {
          if (typeof item.request.url === 'string') {
            url = item.request.url;
          } else if (item.request.url.raw) {
            url = item.request.url.raw;
          }
        }

        const headers = Array.isArray(item.request.header)
          ? item.request.header.map((h: any) => ({
              key: h.key || '',
              value: h.value || '',
              enabled: !h.disabled
            }))
          : [];
        if (headers.length === 0) {
          headers.push({ key: '', value: '', enabled: true });
        }

        const params: any[] = [];
        if (item.request.url && Array.isArray(item.request.url.query)) {
          item.request.url.query.forEach((q: any) => {
            params.push({
              key: q.key || '',
              value: q.value || '',
              enabled: !q.disabled
            });
          });
        }
        if (params.length === 0) {
          params.push({ key: '', value: '', enabled: true });
        }

        let bodyType: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'raw text' = 'none';
        let bodyContent = '';
        if (item.request.body) {
          const mode = item.request.body.mode;
          if (mode === 'raw') {
            bodyType = 'json';
            bodyContent = item.request.body.raw || '';
          } else if (mode === 'urlencoded') {
            bodyType = 'x-www-form-urlencoded';
            if (Array.isArray(item.request.body.urlencoded)) {
              bodyContent = JSON.stringify(item.request.body.urlencoded.map((x: any) => ({ key: x.key, value: x.value, enabled: !x.disabled })));
            }
          } else if (mode === 'formdata') {
            bodyType = 'form-data';
            if (Array.isArray(item.request.body.formdata)) {
              bodyContent = JSON.stringify(item.request.body.formdata.map((x: any) => ({ key: x.key, value: x.value, enabled: !x.disabled, type: x.type || 'text' })));
            }
          }
        }

        let authType: 'none' | 'bearer' | 'basic' | 'apikey' = 'none';
        let authConfig: any = {};
        if (item.request.auth) {
          const type = item.request.auth.type;
          if (type === 'bearer' && Array.isArray(item.request.auth.bearer)) {
            authType = 'bearer';
            const tokenObj = item.request.auth.bearer.find((b: any) => b.key === 'token');
            authConfig = { token: tokenObj ? tokenObj.value : '' };
          } else if (type === 'basic' && Array.isArray(item.request.auth.basic)) {
            authType = 'basic';
            const usernameObj = item.request.auth.basic.find((b: any) => b.key === 'username');
            const passwordObj = item.request.auth.basic.find((b: any) => b.key === 'password');
            authConfig = {
              username: usernameObj ? usernameObj.value : '',
              password: passwordObj ? passwordObj.value : ''
            };
          } else if (type === 'apikey' && Array.isArray(item.request.auth.apikey)) {
            authType = 'apikey';
            const keyObj = item.request.auth.apikey.find((b: any) => b.key === 'key');
            const valObj = item.request.auth.apikey.find((b: any) => b.key === 'value');
            const addToObj = item.request.auth.apikey.find((b: any) => b.key === 'in');
            authConfig = {
              key: keyObj ? keyObj.value : '',
              value: valObj ? valObj.value : '',
              addTo: addToObj ? addToObj.value : 'header'
            };
          }
        }

        const newReq = await createRequest(item.name || 'Untitled Request', method, collectionId);
        await useStore.getState().saveRequest({
          ...newReq,
          url,
          headers,
          params,
          body_type: bodyType,
          body_content: bodyContent,
          auth_type: authType,
          auth_config: authConfig
        });
      } else if (item.item && Array.isArray(item.item)) {
        const subCol = await createCollection(item.name || 'Untitled Folder', collectionId);
        for (const subItem of item.item) {
          await parsePostmanItem(subItem, subCol.id);
        }
      }
    };

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const collectionName = parsed.info?.name || file.name.replace('.json', '');
        const topCollection = await createCollection(collectionName);

        if (parsed.item && Array.isArray(parsed.item)) {
          for (const item of parsed.item) {
            await parsePostmanItem(item, topCollection.id);
          }
        }
        alert('Collection imported successfully!');
      } catch (err) {
        alert('Failed to parse file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const CollectionNode: React.FC<{ col: any; depth: number }> = ({ col, depth }) => {
    const isExpanded = !!expandedFolders[col.id];
    const colRequests = requests.filter(r => r.collection_id === col.id);
    const subCollections = collections.filter(c => c.parent_id === col.id);

    return (
      <div className="flex flex-col gap-1 w-full">
        <div
          className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => toggleFolder(col.id)}>
            {isExpanded ? <ChevronDown size={13} className="flex-shrink-0" /> : <ChevronRight size={13} className="flex-shrink-0" />}
            <Folder size={13} className="text-amber-500 flex-shrink-0" />
            <span className="text-xs font-medium truncate flex-1">{col.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => handleCreateSubCollection(col.id)} title="Add Folder" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <FolderPlus size={11} />
            </button>
            <button onClick={() => handleCreateRequest(col.id)} title="Add Request" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-zinc-200 cursor-pointer">
              <FilePlus size={11} />
            </button>
            <button onClick={() => deleteCollection(col.id)} title="Delete Folder" className="p-1 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-rose-450 cursor-pointer">
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col gap-1 my-0.5 border-l theme-border" style={{ marginLeft: `${depth * 12 + 14}px` }}>
            {/* Render nested subfolders */}
            {subCollections.map(subCol => (
              <CollectionNode key={subCol.id} col={subCol} depth={depth + 1} />
            ))}

            {/* Render requests */}
            {colRequests.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between group px-2 py-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-all"
                style={{ paddingLeft: `14px` }}
              >
                <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => useStore.getState().addTab(req)}>
                  <FileCode size={12} className="text-zinc-500 flex-shrink-0" />
                  <span className={`text-[9px] font-bold flex-shrink-0 ${getMethodColor(req.method)}`}>{req.method}</span>
                  <span className="text-[11px] truncate flex-1">{req.name}</span>
                </div>
                <button onClick={() => deleteRequest(req.id)} title="Delete Request" className="p-1 opacity-0 group-hover:opacity-100 rounded hover:bg-[var(--bg-secondary)] text-zinc-500 hover:text-rose-450 cursor-pointer transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}

            {subCollections.length === 0 && colRequests.length === 0 && (
              <span className="text-[10px] text-zinc-500 italic pl-3">Folder is empty</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full p-4 theme-text-primary">
      <div className="flex items-center justify-between border-b theme-border pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Collections</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              showPrompt('Create Collection', 'Collection name...', '', async (name) => {
                if (name.trim()) {
                  await createCollection(name.trim());
                }
              });
            }}
            className="p-1.5 rounded hover:bg-[var(--bg-secondary)] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
            title="Create Collection"
          >
            <Plus size={14} />
          </button>
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
          onClick={handleCreateCollection}
          className="p-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Collection Tree listing */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {collections.filter(c => !c.parent_id).map(col => (
          <CollectionNode key={col.id} col={col} depth={0} />
        ))}

        {/* Scratch Requests (Independent Draft Requests) */}
        {requests.filter(r => !r.collection_id).map(req => (
          <div
            key={req.id}
            className="flex items-center justify-between group px-2 py-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-all"
            style={{ paddingLeft: `8px` }}
          >
            <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => useStore.getState().addTab(req)}>
              <FileCode size={12} className="text-zinc-550 flex-shrink-0" />
              <span className={`text-[9px] font-bold flex-shrink-0 ${getMethodColor(req.method)}`}>{req.method}</span>
              <span className="text-[11px] truncate flex-1">{req.name || 'Untitled Request'}</span>
            </div>
            <button onClick={() => deleteRequest(req.id)} title="Delete Request" className="p-1 opacity-0 group-hover:opacity-100 rounded hover:bg-[var(--bg-secondary)] text-zinc-550 hover:text-rose-450 cursor-pointer transition-all">
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        {collections.length === 0 && requests.filter(r => !r.collection_id).length === 0 && (
          <div className="text-xs text-zinc-500 text-center py-6">No collections or scratch requests.</div>
        )}
      </div>

      {/* Custom Prompt Modal Dialog */}
      {promptOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[var(--bg-secondary)] border theme-border rounded-xl p-5 w-80 shadow-xl flex flex-col gap-4">
            <h4 className="text-sm font-bold theme-text-primary">{promptTitle}</h4>
            <input
              type="text"
              placeholder={promptPlaceholder}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              className="px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  promptCallback?.(promptValue);
                  setPromptOpen(false);
                } else if (e.key === 'Escape') {
                  setPromptOpen(false);
                }
              }}
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPromptOpen(false)}
                className="px-3 py-1.5 rounded-lg border theme-border theme-text-secondary hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  promptCallback?.(promptValue);
                  setPromptOpen(false);
                }}
                className="px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CollectionManager;
