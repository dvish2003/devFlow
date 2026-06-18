"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("./db");
const api_engine_1 = require("./api-engine");
const nodePty = __importStar(require("node-pty"));
// Active pty processes map: tabId -> IPty
const ptyProcesses = new Map();
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        title: 'DevFlow Studio',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0f0f11',
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC Setup for SQLite DB Operations
electron_1.ipcMain.handle('db:getCollections', () => db_1.dbOps.getCollections());
electron_1.ipcMain.handle('db:saveCollection', (_, col) => db_1.dbOps.saveCollection(col));
electron_1.ipcMain.handle('db:deleteCollection', (_, id) => db_1.dbOps.deleteCollection(id));
electron_1.ipcMain.handle('db:getRequests', () => db_1.dbOps.getRequests());
electron_1.ipcMain.handle('db:saveRequest', (_, req) => db_1.dbOps.saveRequest(req));
electron_1.ipcMain.handle('db:deleteRequest', (_, id) => db_1.dbOps.deleteRequest(id));
electron_1.ipcMain.handle('db:getEnvironments', () => db_1.dbOps.getEnvironments());
electron_1.ipcMain.handle('db:saveEnvironment', (_, env) => db_1.dbOps.saveEnvironment(env));
electron_1.ipcMain.handle('db:deleteEnvironment', (_, id) => db_1.dbOps.deleteEnvironment(id));
electron_1.ipcMain.handle('db:getVariables', (_, envId) => db_1.dbOps.getVariables(envId));
electron_1.ipcMain.handle('db:saveVariable', (_, v) => db_1.dbOps.saveVariable(v));
electron_1.ipcMain.handle('db:deleteVariable', (_, id) => db_1.dbOps.deleteVariable(id));
electron_1.ipcMain.handle('db:getHistory', () => db_1.dbOps.getHistory());
electron_1.ipcMain.handle('db:addHistory', (_, h) => db_1.dbOps.addHistory(h));
electron_1.ipcMain.handle('db:clearHistory', () => db_1.dbOps.clearHistory());
// Request execution engine
electron_1.ipcMain.handle('api:executeRequest', async (_, payload, variables) => {
    return await (0, api_engine_1.executeRequest)(payload, variables);
});
// DB Connection managers
electron_1.ipcMain.handle('db:getConnections', () => db_1.dbOps.getConnections());
electron_1.ipcMain.handle('db:saveConnection', (_, conn) => {
    // Encrypt password if plaintext
    if (conn.password && !conn.password_encrypted) {
        const { encryptPassword } = require('./db-adapters');
        conn.password_encrypted = encryptPassword(conn.password);
        delete conn.password;
    }
    return db_1.dbOps.saveConnection(conn);
});
electron_1.ipcMain.handle('db:deleteConnection', (_, id) => db_1.dbOps.deleteConnection(id));
electron_1.ipcMain.handle('db:testConnection', async (_, conn) => {
    const { dbEngine } = require('./db-adapters');
    if (conn.password && !conn.password_encrypted) {
        const { encryptPassword } = require('./db-adapters');
        conn.password_encrypted = encryptPassword(conn.password);
    }
    return await dbEngine.testConnection(conn);
});
electron_1.ipcMain.handle('db:getDbSchema', async (_, conn) => {
    const { dbEngine } = require('./db-adapters');
    return await dbEngine.getSchema(conn);
});
electron_1.ipcMain.handle('db:executeDbQuery', async (_, conn, query) => {
    const { dbEngine } = require('./db-adapters');
    return await dbEngine.executeQuery(conn, query);
});
// Saved DB Queries
electron_1.ipcMain.handle('db:getSavedDbQueries', (_, connId) => db_1.dbOps.getSavedDbQueries(connId));
electron_1.ipcMain.handle('db:saveDbQuery', (_, q) => db_1.dbOps.saveDbQuery(q));
electron_1.ipcMain.handle('db:deleteDbQuery', (_, id) => db_1.dbOps.deleteDbQuery(id));
// DB History log
electron_1.ipcMain.handle('db:getDbHistory', (_, connId) => db_1.dbOps.getDbHistory(connId));
electron_1.ipcMain.handle('db:addDbHistory', (_, h) => db_1.dbOps.addDbHistory(h));
electron_1.ipcMain.handle('db:clearDbHistory', (_, connId) => db_1.dbOps.clearDbHistory(connId));
// Notes
electron_1.ipcMain.handle('db:getNotes', () => db_1.dbOps.getNotes());
electron_1.ipcMain.handle('db:saveNote', (_, note) => db_1.dbOps.saveNote(note));
electron_1.ipcMain.handle('db:deleteNote', (_, id) => db_1.dbOps.deleteNote(id));
// Snippets
electron_1.ipcMain.handle('db:getCodeSnippets', () => db_1.dbOps.getCodeSnippets());
electron_1.ipcMain.handle('db:saveCodeSnippet', (_, snip) => db_1.dbOps.saveCodeSnippet(snip));
electron_1.ipcMain.handle('db:deleteCodeSnippet', (_, id) => db_1.dbOps.deleteCodeSnippet(id));
// Native file dialogues
electron_1.ipcMain.handle('fs:saveToFile', async (_, defaultPath, content) => {
    if (!mainWindow)
        return { canceled: true };
    const { filePath, canceled } = await electron_1.dialog.showSaveDialog(mainWindow, {
        defaultPath,
        filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    if (canceled || !filePath) {
        return { canceled: true };
    }
    fs_1.default.writeFileSync(filePath, content, 'utf8');
    return { success: true, filePath };
});
// ─── Terminal IPC (node-pty) ────────────────────────────────────────────────
electron_1.ipcMain.handle('terminal:create', (event, tabId, cols, rows) => {
    // Kill any existing pty for this tab
    if (ptyProcesses.has(tabId)) {
        try {
            ptyProcesses.get(tabId).kill();
        }
        catch { /* ignore */ }
        ptyProcesses.delete(tabId);
    }
    const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/zsh');
    const cwd = process.env.HOME || process.cwd();
    const pty = nodePty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: cols || 80,
        rows: rows || 24,
        cwd,
        env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    });
    ptyProcesses.set(tabId, pty);
    pty.onData((data) => {
        // Send data back to the renderer
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (win && !win.isDestroyed()) {
            win.webContents.send(`terminal:data:${tabId}`, data);
        }
    });
    pty.onExit(() => {
        ptyProcesses.delete(tabId);
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (win && !win.isDestroyed()) {
            win.webContents.send(`terminal:exit:${tabId}`);
        }
    });
    return pty.pid;
});
electron_1.ipcMain.handle('terminal:write', (_, tabId, data) => {
    const pty = ptyProcesses.get(tabId);
    if (pty)
        pty.write(data);
});
electron_1.ipcMain.handle('terminal:resize', (_, tabId, cols, rows) => {
    const pty = ptyProcesses.get(tabId);
    if (pty)
        pty.resize(cols, rows);
});
electron_1.ipcMain.handle('terminal:kill', (_, tabId) => {
    const pty = ptyProcesses.get(tabId);
    if (pty) {
        try {
            pty.kill();
        }
        catch { /* ignore */ }
        ptyProcesses.delete(tabId);
    }
});
