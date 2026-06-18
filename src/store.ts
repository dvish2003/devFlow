import { create } from 'zustand';
import type { RequestItem, Collection, Environment, Variable, HistoryItem, RequestTab, RequestResponse, DbConnection, DbTab, DbQuery, DbHistoryItem, NoteItem, CodeSnippetItem } from './types';

// Electron IPC API declaration
declare global {
  interface Window {
    api: {
      getCollections: () => Promise<any[]>;
      saveCollection: (col: any) => Promise<void>;
      deleteCollection: (id: string) => Promise<void>;
      getRequests: () => Promise<any[]>;
      saveRequest: (req: any) => Promise<void>;
      deleteRequest: (id: string) => Promise<void>;
      getEnvironments: () => Promise<any[]>;
      saveEnvironment: (env: any) => Promise<void>;
      deleteEnvironment: (id: string) => Promise<void>;
      getVariables: (envId?: string) => Promise<any[]>;
      saveVariable: (v: any) => Promise<void>;
      deleteVariable: (id: string) => Promise<void>;
      getHistory: () => Promise<any[]>;
      addHistory: (h: any) => Promise<void>;
      clearHistory: () => Promise<void>;
      executeRequest: (payload: any, variables: any[]) => Promise<RequestResponse>;
      saveToFile: (defaultPath: string, content: string) => Promise<{ success?: boolean; canceled?: boolean; filePath?: string }>;

      // Database Viewer IPCs
      getConnections: () => Promise<any[]>;
      saveConnection: (conn: any) => Promise<void>;
      deleteConnection: (id: string) => Promise<void>;
      testConnection: (conn: any) => Promise<{ success: boolean; message: string }>;
      getDbSchema: (conn: any) => Promise<{ tables: string[] }>;
      executeDbQuery: (conn: any, query: string) => Promise<{ rows: any[]; columns: string[] }>;

      getSavedDbQueries: (connId?: string) => Promise<any[]>;
      saveDbQuery: (q: any) => Promise<void>;
      deleteDbQuery: (id: string) => Promise<void>;

      getDbHistory: (connId?: string) => Promise<any[]>;
      addDbHistory: (h: any) => Promise<void>;
      clearDbHistory: (connId: string) => Promise<void>;

      // Notes & Snippets
      getNotes: () => Promise<any[]>;
      saveNote: (note: any) => Promise<void>;
      deleteNote: (id: string) => Promise<void>;

      getCodeSnippets: () => Promise<any[]>;
      saveCodeSnippet: (snip: any) => Promise<void>;
      deleteCodeSnippet: (id: string) => Promise<void>;
    };
  }
}

interface DevFlowState {
  sidebarTab: 'api' | 'db' | 'terminal' | 'collections' | 'environments' | 'history' | 'plugins' | 'notes' | 'jsonFormatter' | 'jwtDecoder' | 'snippets' | 'envGen' | 'pdfGen' | 'csvLoader' | 'settings';
  setSidebarTab: (tab: 'api' | 'db' | 'terminal' | 'collections' | 'environments' | 'history' | 'plugins' | 'notes' | 'jsonFormatter' | 'jwtDecoder' | 'snippets' | 'envGen' | 'pdfGen' | 'csvLoader' | 'settings') => void;

  collections: Collection[];
  requests: RequestItem[];
  environments: Environment[];
  variables: Variable[];
  history: HistoryItem[];
  notes: NoteItem[];
  snippets: CodeSnippetItem[];

  tabs: RequestTab[];
  activeTabId: string | null;

  loadData: () => Promise<void>;

  // Tab management
  addTab: (req?: Partial<RequestItem>) => void;
  closeTab: (tabId: string) => void;
  setActiveTabId: (tabId: string | null) => void;
  updateActiveTabRequest: (updater: (req: RequestItem) => RequestItem) => void;
  setActiveTabResponse: (res: RequestResponse) => void;
  setActiveTabSending: (sending: boolean) => void;

  // Collection CRUD
  createCollection: (name: string, parentId?: string | null) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  // Request CRUD
  createRequest: (name: string, method: string, collectionId?: string | null) => Promise<RequestItem>;
  saveRequest: (req: RequestItem) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;

  // Environment CRUD
  createEnvironment: (name: string) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string | null) => Promise<void>;
  createVariable: (envId: string, key: string, value: string) => Promise<void>;
  updateVariable: (v: Variable) => Promise<void>;
  deleteVariable: (id: string) => Promise<void>;

  // History CRUD
  addHistoryItem: (h: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Notes CRUD
  saveNoteItem: (n: NoteItem) => Promise<void>;
  deleteNoteItem: (id: string) => Promise<void>;

  // Snippets CRUD
  saveSnippetItem: (s: CodeSnippetItem) => Promise<void>;
  deleteSnippetItem: (id: string) => Promise<void>;

  // Theme Settings
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  // DB Connections state
  dbConnections: DbConnection[];
  activeConnectionId: string | null;
  setActiveConnectionId: (id: string | null) => void;

  // DB Queries & History
  savedDbQueries: DbQuery[];
  dbHistory: DbHistoryItem[];

  // DB Workspace tabs
  dbTabs: DbTab[];
  activeDbTabId: string | null;
  setActiveDbTabId: (id: string | null) => void;

  addDbTab: (tab: Omit<DbTab, 'id'>) => void;
  closeDbTab: (id: string) => void;
  updateDbTabResults: (tabId: string, results: { rows: any[]; columns: string[] }) => void;

  // DB connection actions
  createDbConnection: (conn: Omit<DbConnection, 'id'>) => Promise<void>;
  deleteDbConnection: (id: string) => Promise<void>;

  // DB queries actions
  createSavedDbQuery: (name: string, connId: string, query: string) => Promise<void>;
  deleteSavedDbQuery: (id: string) => Promise<void>;

  // DB history actions
  addDbHistoryLog: (connId: string, query: string) => Promise<void>;
  clearDbHistoryLog: (connId: string) => Promise<void>;
}

export const useStore = create<DevFlowState>((set, get) => ({
  sidebarTab: 'api',
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),

  collections: [],
  requests: [],
  environments: [],
  variables: [],
  history: [],
  notes: [],
  snippets: [],
  tabs: [],
  activeTabId: null,

  loadData: async () => {
    try {
      const collections = await window.api.getCollections();
      const requestsData = await window.api.getRequests();
      const environments = await window.api.getEnvironments();
      const variables = await window.api.getVariables();
      const history = await window.api.getHistory();
      const notes = await window.api.getNotes();
      const snippets = await window.api.getCodeSnippets();

      // Map requests data strings back to objects
      const requests = requestsData.map((r: any) => ({
        ...r,
        headers: JSON.parse(r.headers || '[]'),
        params: JSON.parse(r.params || '[]'),
        auth_config: JSON.parse(r.auth_config || '{}'),
      }));

      set({ collections, requests, environments, variables, history, notes, snippets });

      // Load DB connection lists on boot
      const dbConnections = await window.api.getConnections();
      const savedDbQueries = await window.api.getSavedDbQueries();
      const dbHistory = await window.api.getDbHistory();
      set({ dbConnections, savedDbQueries, dbHistory });

      // Open a default scratch tab if no tabs exist
      if (get().tabs.length === 0) {
        get().addTab();
      }
    } catch (err) {
      console.error('Error loading devflow data from SQLite:', err);
    }
  },

  addTab: (reqPatch) => {
    const defaultRequest: RequestItem = {
      id: reqPatch?.id || `req_${Date.now()}`,
      collection_id: reqPatch?.collection_id || null,
      name: reqPatch?.name || 'Untitled Request',
      method: reqPatch?.method || 'GET',
      url: reqPatch?.url || '',
      headers: reqPatch?.headers || [{ key: '', value: '', enabled: true }],
      params: reqPatch?.params || [{ key: '', value: '', enabled: true }],
      body_type: reqPatch?.body_type || 'none',
      body_content: reqPatch?.body_content || '',
      auth_type: reqPatch?.auth_type || 'none',
      auth_config: reqPatch?.auth_config || {},
      created_at: reqPatch?.created_at || Date.now(),
      updated_at: reqPatch?.updated_at || Date.now(),
    };

    const newTab: RequestTab = {
      id: defaultRequest.id,
      name: defaultRequest.name,
      request: defaultRequest,
    };

    set((state) => {
      // Don't duplicate open tab
      const existing = state.tabs.find(t => t.id === newTab.id);
      if (existing) {
        return { activeTabId: existing.id };
      }
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id
      };
    });
  },

  closeTab: (tabId) => {
    set((state) => {
      const remainingTabs = state.tabs.filter(t => t.id !== tabId);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === tabId) {
        newActiveTabId = remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null;
      }

      return {
        tabs: remainingTabs,
        activeTabId: newActiveTabId
      };
    });

    // If all tabs closed, create a fresh empty one
    setTimeout(() => {
      if (get().tabs.length === 0) {
        get().addTab();
      }
    }, 50);
  },

  setActiveTabId: (activeTabId) => set({ activeTabId }),

  updateActiveTabRequest: (updater) => {
    set((state) => {
      const tabs = state.tabs.map(t => {
        if (t.id === state.activeTabId) {
          const updatedReq = updater(t.request);
          return {
            ...t,
            name: updatedReq.name,
            request: updatedReq,
            isDirty: true
          };
        }
        return t;
      });
      return { tabs };
    });
  },

  setActiveTabResponse: (res) => {
    set((state) => {
      const tabs = state.tabs.map(t => {
        if (t.id === state.activeTabId) {
          return { ...t, response: res, isSending: false };
        }
        return t;
      });
      return { tabs };
    });
  },

  setActiveTabSending: (sending) => {
    set((state) => {
      const tabs = state.tabs.map(t => {
        if (t.id === state.activeTabId) {
          return { ...t, isSending: sending };
        }
        return t;
      });
      return { tabs };
    });
  },

  createCollection: async (name, parentId = null) => {
    const newCol = {
      id: `col_${Date.now()}`,
      name,
      parent_id: parentId,
      workspace_id: 'default',
      created_at: Date.now()
    };
    await window.api.saveCollection(newCol);
    set((state) => ({ collections: [...state.collections, newCol] }));
  },

  deleteCollection: async (id) => {
    await window.api.deleteCollection(id);
    set((state) => ({ collections: state.collections.filter(c => c.id !== id) }));
  },

  createRequest: async (name, method, collectionId = null) => {
    const newReq: RequestItem = {
      id: `req_${Date.now()}`,
      collection_id: collectionId,
      name,
      method,
      url: '',
      headers: [{ key: '', value: '', enabled: true }],
      params: [{ key: '', value: '', enabled: true }],
      body_type: 'none',
      body_content: '',
      auth_type: 'none',
      auth_config: {},
      created_at: Date.now(),
      updated_at: Date.now()
    };

    await window.api.saveRequest(newReq);
    set((state) => ({ requests: [...state.requests, newReq] }));
    get().addTab(newReq);
    return newReq;
  },

  saveRequest: async (req) => {
    const updatedReq = { ...req, updated_at: Date.now() };
    await window.api.saveRequest(updatedReq);
    set((state) => ({
      requests: state.requests.map(r => r.id === req.id ? updatedReq : r),
      tabs: state.tabs.map(t => t.id === req.id ? { ...t, isDirty: false, request: updatedReq } : t)
    }));
  },

  deleteRequest: async (id) => {
    await window.api.deleteRequest(id);
    set((state) => ({ requests: state.requests.filter(r => r.id !== id) }));
    get().closeTab(id);
  },

  createEnvironment: async (name) => {
    const newEnv = {
      id: `env_${Date.now()}`,
      name,
      is_active: 0,
      created_at: Date.now()
    };
    await window.api.saveEnvironment(newEnv);
    set((state) => ({ environments: [...state.environments, newEnv] }));
  },

  deleteEnvironment: async (id) => {
    await window.api.deleteEnvironment(id);
    set((state) => ({
      environments: state.environments.filter(e => e.id !== id),
      variables: state.variables.filter(v => v.environment_id !== id)
    }));
  },

  setActiveEnvironment: async (id) => {
    const list = get().environments;
    for (const env of list) {
      const isAct = env.id === id ? 1 : 0;
      await window.api.saveEnvironment({ ...env, is_active: isAct });
    }
    set((state) => ({
      environments: state.environments.map(e => ({ ...e, is_active: e.id === id ? 1 : 0 }))
    }));
  },

  createVariable: async (envId, key, value) => {
    const newVar: Variable = {
      id: `var_${Date.now()}`,
      environment_id: envId,
      key,
      value,
      is_enabled: 1
    };
    await window.api.saveVariable(newVar);
    set((state) => ({ variables: [...state.variables, newVar] }));
  },

  updateVariable: async (v) => {
    await window.api.saveVariable(v);
    set((state) => ({
      variables: state.variables.map(item => item.id === v.id ? v : item)
    }));
  },

  deleteVariable: async (id) => {
    await window.api.deleteVariable(id);
    set((state) => ({ variables: state.variables.filter(v => v.id !== id) }));
  },

  addHistoryItem: async (h) => {
    const newItem = {
      ...h,
      id: `hist_${Date.now()}`,
      timestamp: Date.now()
    };
    await window.api.addHistory(newItem);
    set((state) => ({ history: [newItem, ...state.history].slice(0, 100) }));
  },

  clearHistory: async () => {
    await window.api.clearHistory();
    set({ history: [] });
  },

  // Theme Settings Implementation
  theme: 'light',
  setTheme: (theme) => {
    set({ theme });
    const root = window.document.documentElement;

    const applyTheme = (t: 'dark' | 'light') => {
      if (t === 'light') {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      } else {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      }
    };

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    } else {
      applyTheme(theme);
    }
  },

  // DB Connection actions
  dbConnections: [],
  activeConnectionId: null,
  setActiveConnectionId: (activeConnectionId) => set({ activeConnectionId }),

  savedDbQueries: [],
  dbHistory: [],

  // DB Tabs actions
  dbTabs: [],
  activeDbTabId: null,
  setActiveDbTabId: (activeDbTabId) => set({ activeDbTabId }),

  addDbTab: (tab) => {
    const newTab: DbTab = {
      ...tab,
      id: `dbtab_${Date.now()}`
    };
    set((state) => {
      // Avoid duplicate tab for same table explorer
      const existing = state.dbTabs.find(t => t.connectionId === tab.connectionId && t.tableName === tab.tableName && t.type === tab.type);
      if (existing) {
        return { activeDbTabId: existing.id };
      }
      return {
        dbTabs: [...state.dbTabs, newTab],
        activeDbTabId: newTab.id
      };
    });
  },

  closeDbTab: (id) => {
    set((state) => {
      const remaining = state.dbTabs.filter(t => t.id !== id);
      let activeId = state.activeDbTabId;
      if (state.activeDbTabId === id) {
        activeId = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return { dbTabs: remaining, activeDbTabId: activeId };
    });
  },

  updateDbTabResults: (tabId, results) => {
    set((state) => ({
      dbTabs: state.dbTabs.map(t => t.id === tabId ? { ...t, results } : t)
    }));
  },

  createDbConnection: async (conn) => {
    const newConn: DbConnection = {
      ...conn,
      id: `conn_${Date.now()}`
    };
    await window.api.saveConnection(newConn);
    // Reload lists from SQLite to retrieve encrypted passwords correctly
    const dbConnections = await window.api.getConnections();
    set({ dbConnections });
  },

  deleteDbConnection: async (id) => {
    await window.api.deleteConnection(id);
    set((state) => ({
      dbConnections: state.dbConnections.filter(c => c.id !== id),
      dbTabs: state.dbTabs.filter(t => t.connectionId !== id),
      activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId
    }));
  },

  createSavedDbQuery: async (name, connId, query) => {
    const newQ = {
      id: `dbq_${Date.now()}`,
      connection_id: connId,
      query,
      name
    };
    await window.api.saveDbQuery(newQ);
    const savedDbQueries = await window.api.getSavedDbQueries();
    set({ savedDbQueries });
  },

  deleteSavedDbQuery: async (id) => {
    await window.api.deleteDbQuery(id);
    set((state) => ({ savedDbQueries: state.savedDbQueries.filter(q => q.id !== id) }));
  },

  addDbHistoryLog: async (connId, query) => {
    const newLog = {
      id: `dbh_${Date.now()}`,
      connection_id: connId,
      query,
      timestamp: Date.now()
    };
    await window.api.addDbHistory(newLog);
    const dbHistory = await window.api.getDbHistory(connId);
    set({ dbHistory });
  },

  clearDbHistoryLog: async (connId) => {
    await window.api.clearDbHistory(connId);
    const dbHistory = await window.api.getDbHistory(connId);
    set({ dbHistory });
  },

  // Notes actions
  saveNoteItem: async (note) => {
    await window.api.saveNote(note);
    const notes = await window.api.getNotes();
    set({ notes });
  },

  deleteNoteItem: async (id) => {
    await window.api.deleteNote(id);
    const notes = await window.api.getNotes();
    set({ notes });
  },

  // Snippets actions
  saveSnippetItem: async (snip) => {
    await window.api.saveCodeSnippet(snip);
    const snippets = await window.api.getCodeSnippets();
    set({ snippets });
  },

  deleteSnippetItem: async (id) => {
    await window.api.deleteCodeSnippet(id);
    const snippets = await window.api.getCodeSnippets();
    set({ snippets });
  }
}));
