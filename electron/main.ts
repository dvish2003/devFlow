import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { dbOps } from './db';
import { executeRequest } from './api-engine';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'DevFlow Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0f11',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Setup for SQLite DB Operations
ipcMain.handle('db:getCollections', () => dbOps.getCollections());
ipcMain.handle('db:saveCollection', (_, col) => dbOps.saveCollection(col));
ipcMain.handle('db:deleteCollection', (_, id) => dbOps.deleteCollection(id));

ipcMain.handle('db:getRequests', () => dbOps.getRequests());
ipcMain.handle('db:saveRequest', (_, req) => dbOps.saveRequest(req));
ipcMain.handle('db:deleteRequest', (_, id) => dbOps.deleteRequest(id));

ipcMain.handle('db:getEnvironments', () => dbOps.getEnvironments());
ipcMain.handle('db:saveEnvironment', (_, env) => dbOps.saveEnvironment(env));
ipcMain.handle('db:deleteEnvironment', (_, id) => dbOps.deleteEnvironment(id));

ipcMain.handle('db:getVariables', (_, envId) => dbOps.getVariables(envId));
ipcMain.handle('db:saveVariable', (_, v) => dbOps.saveVariable(v));
ipcMain.handle('db:deleteVariable', (_, id) => dbOps.deleteVariable(id));

ipcMain.handle('db:getHistory', () => dbOps.getHistory());
ipcMain.handle('db:addHistory', (_, h) => dbOps.addHistory(h));
ipcMain.handle('db:clearHistory', () => dbOps.clearHistory());

// Request execution engine
ipcMain.handle('api:executeRequest', async (_, payload, variables) => {
  return await executeRequest(payload, variables);
});

// DB Connection managers
ipcMain.handle('db:getConnections', () => dbOps.getConnections());
ipcMain.handle('db:saveConnection', (_, conn) => {
  // Encrypt password if plaintext
  if (conn.password && !conn.password_encrypted) {
    const { encryptPassword } = require('./db-adapters');
    conn.password_encrypted = encryptPassword(conn.password);
    delete conn.password;
  }
  return dbOps.saveConnection(conn);
});
ipcMain.handle('db:deleteConnection', (_, id) => dbOps.deleteConnection(id));

ipcMain.handle('db:testConnection', async (_, conn) => {
  const { dbEngine } = require('./db-adapters');
  if (conn.password && !conn.password_encrypted) {
    const { encryptPassword } = require('./db-adapters');
    conn.password_encrypted = encryptPassword(conn.password);
  }
  return await dbEngine.testConnection(conn);
});

ipcMain.handle('db:getDbSchema', async (_, conn) => {
  const { dbEngine } = require('./db-adapters');
  return await dbEngine.getSchema(conn);
});

ipcMain.handle('db:executeDbQuery', async (_, conn, query) => {
  const { dbEngine } = require('./db-adapters');
  return await dbEngine.executeQuery(conn, query);
});

// Saved DB Queries
ipcMain.handle('db:getSavedDbQueries', (_, connId) => dbOps.getSavedDbQueries(connId));
ipcMain.handle('db:saveDbQuery', (_, q) => dbOps.saveDbQuery(q));
ipcMain.handle('db:deleteDbQuery', (_, id) => dbOps.deleteDbQuery(id));

// DB History log
ipcMain.handle('db:getDbHistory', (_, connId) => dbOps.getDbHistory(connId));
ipcMain.handle('db:addDbHistory', (_, h) => dbOps.addDbHistory(h));
ipcMain.handle('db:clearDbHistory', (_, connId) => dbOps.clearDbHistory(connId));

// Notes
ipcMain.handle('db:getNotes', () => dbOps.getNotes());
ipcMain.handle('db:saveNote', (_, note) => dbOps.saveNote(note));
ipcMain.handle('db:deleteNote', (_, id) => dbOps.deleteNote(id));

// Snippets
ipcMain.handle('db:getCodeSnippets', () => dbOps.getCodeSnippets());
ipcMain.handle('db:saveCodeSnippet', (_, snip) => dbOps.saveCodeSnippet(snip));
ipcMain.handle('db:deleteCodeSnippet', (_, id) => dbOps.deleteCodeSnippet(id));

// Native file dialogues
ipcMain.handle('fs:saveToFile', async (_, defaultPath: string, content: string) => {
  if (!mainWindow) return { canceled: true };
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [{ name: 'All Files', extensions: ['*'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return { success: true, filePath };
});
