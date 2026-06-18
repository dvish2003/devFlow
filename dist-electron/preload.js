"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('api', {
    // DB Ops
    getCollections: () => electron_1.ipcRenderer.invoke('db:getCollections'),
    saveCollection: (col) => electron_1.ipcRenderer.invoke('db:saveCollection', col),
    deleteCollection: (id) => electron_1.ipcRenderer.invoke('db:deleteCollection', id),
    getRequests: () => electron_1.ipcRenderer.invoke('db:getRequests'),
    saveRequest: (req) => electron_1.ipcRenderer.invoke('db:saveRequest', req),
    deleteRequest: (id) => electron_1.ipcRenderer.invoke('db:deleteRequest', id),
    getEnvironments: () => electron_1.ipcRenderer.invoke('db:getEnvironments'),
    saveEnvironment: (env) => electron_1.ipcRenderer.invoke('db:saveEnvironment', env),
    deleteEnvironment: (id) => electron_1.ipcRenderer.invoke('db:deleteEnvironment', id),
    getVariables: (envId) => electron_1.ipcRenderer.invoke('db:getVariables', envId),
    saveVariable: (v) => electron_1.ipcRenderer.invoke('db:saveVariable', v),
    deleteVariable: (id) => electron_1.ipcRenderer.invoke('db:deleteVariable', id),
    getHistory: () => electron_1.ipcRenderer.invoke('db:getHistory'),
    addHistory: (h) => electron_1.ipcRenderer.invoke('db:addHistory', h),
    clearHistory: () => electron_1.ipcRenderer.invoke('db:clearHistory'),
    // Request executor
    executeRequest: (payload, variables) => electron_1.ipcRenderer.invoke('api:executeRequest', payload, variables),
    // File exporter
    saveToFile: (defaultPath, content) => electron_1.ipcRenderer.invoke('fs:saveToFile', defaultPath, content),
    // DB Connections
    getConnections: () => electron_1.ipcRenderer.invoke('db:getConnections'),
    saveConnection: (conn) => electron_1.ipcRenderer.invoke('db:saveConnection', conn),
    deleteConnection: (id) => electron_1.ipcRenderer.invoke('db:deleteConnection', id),
    testConnection: (conn) => electron_1.ipcRenderer.invoke('db:testConnection', conn),
    getDbSchema: (conn) => electron_1.ipcRenderer.invoke('db:getDbSchema', conn),
    executeDbQuery: (conn, query) => electron_1.ipcRenderer.invoke('db:executeDbQuery', conn, query),
    // Saved DB Queries
    getSavedDbQueries: (connId) => electron_1.ipcRenderer.invoke('db:getSavedDbQueries', connId),
    saveDbQuery: (q) => electron_1.ipcRenderer.invoke('db:saveDbQuery', q),
    deleteDbQuery: (id) => electron_1.ipcRenderer.invoke('db:deleteDbQuery', id),
    // DB History log
    getDbHistory: (connId) => electron_1.ipcRenderer.invoke('db:getDbHistory', connId),
    addDbHistory: (h) => electron_1.ipcRenderer.invoke('db:addDbHistory', h),
    clearDbHistory: (connId) => electron_1.ipcRenderer.invoke('db:clearDbHistory', connId),
    // Notes
    getNotes: () => electron_1.ipcRenderer.invoke('db:getNotes'),
    saveNote: (note) => electron_1.ipcRenderer.invoke('db:saveNote', note),
    deleteNote: (id) => electron_1.ipcRenderer.invoke('db:deleteNote', id),
    // Snippets
    getCodeSnippets: () => electron_1.ipcRenderer.invoke('db:getCodeSnippets'),
    saveCodeSnippet: (snip) => electron_1.ipcRenderer.invoke('db:saveCodeSnippet', snip),
    deleteCodeSnippet: (id) => electron_1.ipcRenderer.invoke('db:deleteCodeSnippet', id),
    // ── Terminal (node-pty) ──────────────────────────────────────────────────
    termCreate: (tabId, cols, rows) => electron_1.ipcRenderer.invoke('terminal:create', tabId, cols, rows),
    termWrite: (tabId, data) => electron_1.ipcRenderer.invoke('terminal:write', tabId, data),
    termResize: (tabId, cols, rows) => electron_1.ipcRenderer.invoke('terminal:resize', tabId, cols, rows),
    termKill: (tabId) => electron_1.ipcRenderer.invoke('terminal:kill', tabId),
    onTermData: (tabId, callback) => {
        const channel = `terminal:data:${tabId}`;
        electron_1.ipcRenderer.on(channel, (_event, data) => callback(data));
        return () => electron_1.ipcRenderer.removeAllListeners(channel);
    },
    onTermExit: (tabId, callback) => {
        const channel = `terminal:exit:${tabId}`;
        electron_1.ipcRenderer.on(channel, () => callback());
        return () => electron_1.ipcRenderer.removeAllListeners(channel);
    },
});
