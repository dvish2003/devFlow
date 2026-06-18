import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // DB Ops
  getCollections: () => ipcRenderer.invoke('db:getCollections'),
  saveCollection: (col: any) => ipcRenderer.invoke('db:saveCollection', col),
  deleteCollection: (id: string) => ipcRenderer.invoke('db:deleteCollection', id),

  getRequests: () => ipcRenderer.invoke('db:getRequests'),
  saveRequest: (req: any) => ipcRenderer.invoke('db:saveRequest', req),
  deleteRequest: (id: string) => ipcRenderer.invoke('db:deleteRequest', id),

  getEnvironments: () => ipcRenderer.invoke('db:getEnvironments'),
  saveEnvironment: (env: any) => ipcRenderer.invoke('db:saveEnvironment', env),
  deleteEnvironment: (id: string) => ipcRenderer.invoke('db:deleteEnvironment', id),

  getVariables: (envId?: string) => ipcRenderer.invoke('db:getVariables', envId),
  saveVariable: (v: any) => ipcRenderer.invoke('db:saveVariable', v),
  deleteVariable: (id: string) => ipcRenderer.invoke('db:deleteVariable', id),

  getHistory: () => ipcRenderer.invoke('db:getHistory'),
  addHistory: (h: any) => ipcRenderer.invoke('db:addHistory', h),
  clearHistory: () => ipcRenderer.invoke('db:clearHistory'),

  // Request executor
  executeRequest: (payload: any, variables: any) => ipcRenderer.invoke('api:executeRequest', payload, variables),

  // File exporter
  saveToFile: (defaultPath: string, content: string) => ipcRenderer.invoke('fs:saveToFile', defaultPath, content),

  // DB Connections
  getConnections: () => ipcRenderer.invoke('db:getConnections'),
  saveConnection: (conn: any) => ipcRenderer.invoke('db:saveConnection', conn),
  deleteConnection: (id: string) => ipcRenderer.invoke('db:deleteConnection', id),
  testConnection: (conn: any) => ipcRenderer.invoke('db:testConnection', conn),
  getDbSchema: (conn: any) => ipcRenderer.invoke('db:getDbSchema', conn),
  executeDbQuery: (conn: any, query: string) => ipcRenderer.invoke('db:executeDbQuery', conn, query),

  // Saved DB Queries
  getSavedDbQueries: (connId?: string) => ipcRenderer.invoke('db:getSavedDbQueries', connId),
  saveDbQuery: (q: any) => ipcRenderer.invoke('db:saveDbQuery', q),
  deleteDbQuery: (id: string) => ipcRenderer.invoke('db:deleteDbQuery', id),

  // DB History log
  getDbHistory: (connId?: string) => ipcRenderer.invoke('db:getDbHistory', connId),
  addDbHistory: (h: any) => ipcRenderer.invoke('db:addDbHistory', h),
  clearDbHistory: (connId: string) => ipcRenderer.invoke('db:clearDbHistory', connId),

  // Notes
  getNotes: () => ipcRenderer.invoke('db:getNotes'),
  saveNote: (note: any) => ipcRenderer.invoke('db:saveNote', note),
  deleteNote: (id: string) => ipcRenderer.invoke('db:deleteNote', id),

  // Snippets
  getCodeSnippets: () => ipcRenderer.invoke('db:getCodeSnippets'),
  saveCodeSnippet: (snip: any) => ipcRenderer.invoke('db:saveCodeSnippet', snip),
  deleteCodeSnippet: (id: string) => ipcRenderer.invoke('db:deleteCodeSnippet', id)
});
