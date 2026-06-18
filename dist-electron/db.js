"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbOps = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'devflow.db');
const db = new better_sqlite3_1.default(dbPath);
// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    workspace_id TEXT DEFAULT 'default',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    collection_id TEXT,
    name TEXT NOT NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    headers TEXT, -- JSON array of key-values
    params TEXT,  -- JSON array of key-values
    body_type TEXT, -- 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw'
    body_content TEXT,
    auth_type TEXT, -- 'none' | 'bearer' | 'basic' | 'apikey'
    auth_config TEXT, -- JSON configuration
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS environments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS variables (
    id TEXT PRIMARY KEY,
    environment_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    is_enabled INTEGER DEFAULT 1,
    FOREIGN KEY(environment_id) REFERENCES environments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    status INTEGER,
    response_time INTEGER,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    host TEXT,
    port INTEGER,
    username TEXT,
    password_encrypted TEXT,
    database TEXT,
    options_json TEXT
  );

  CREATE TABLE IF NOT EXISTS saved_queries (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    query TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY(connection_id) REFERENCES connections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS db_history (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    query TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(connection_id) REFERENCES connections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS code_snippets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    updated_at INTEGER NOT NULL
  );
`);
// Collection Actions
exports.dbOps = {
    // HTTP Client query history actions
    getHistory: () => db.prepare('SELECT * FROM history ORDER BY timestamp DESC LIMIT 100').all(),
    addHistory: (h) => {
        db.prepare('INSERT INTO history (id, method, url, status, response_time, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
            .run(h.id, h.method, h.url, h.status || null, h.response_time || null, h.timestamp);
    },
    clearHistory: () => {
        db.prepare('DELETE FROM history').run();
    },
    // Collections
    getCollections: () => db.prepare('SELECT * FROM collections ORDER BY created_at ASC').all(),
    saveCollection: (col) => {
        db.prepare('INSERT OR REPLACE INTO collections (id, name, parent_id, workspace_id, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(col.id, col.name, col.parent_id || null, col.workspace_id || 'default', col.created_at);
    },
    deleteCollection: (id) => {
        db.prepare('DELETE FROM collections WHERE id = ?').run(id);
    },
    // Requests
    getRequests: () => db.prepare('SELECT * FROM requests ORDER BY created_at ASC').all(),
    saveRequest: (req) => {
        db.prepare(`
      INSERT OR REPLACE INTO requests (
        id, collection_id, name, method, url, headers, params, body_type, body_content, auth_type, auth_config, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.id, req.collection_id || null, req.name, req.method, req.url, JSON.stringify(req.headers || []), JSON.stringify(req.params || []), req.body_type || 'none', req.body_content || '', req.auth_type || 'none', JSON.stringify(req.auth_config || {}), req.created_at, req.updated_at);
    },
    deleteRequest: (id) => {
        db.prepare('DELETE FROM requests WHERE id = ?').run(id);
    },
    // Environments
    getEnvironments: () => db.prepare('SELECT * FROM environments ORDER BY created_at ASC').all(),
    saveEnvironment: (env) => {
        db.prepare('INSERT OR REPLACE INTO environments (id, name, is_active, created_at) VALUES (?, ?, ?, ?)')
            .run(env.id, env.name, env.is_active, env.created_at);
    },
    deleteEnvironment: (id) => {
        db.prepare('DELETE FROM environments WHERE id = ?').run(id);
        db.prepare('DELETE FROM variables WHERE environment_id = ?').run(id);
    },
    // Variables
    getVariables: (envId) => {
        if (envId) {
            return db.prepare('SELECT * FROM variables WHERE environment_id = ?').all(envId);
        }
        return db.prepare('SELECT * FROM variables').all();
    },
    saveVariable: (v) => {
        db.prepare('INSERT OR REPLACE INTO variables (id, environment_id, key, value, is_enabled) VALUES (?, ?, ?, ?, ?)')
            .run(v.id, v.environment_id, v.key, v.value, v.is_enabled);
    },
    deleteVariable: (id) => {
        db.prepare('DELETE FROM variables WHERE id = ?').run(id);
    },
    // Connections
    getConnections: () => db.prepare('SELECT * FROM connections').all(),
    saveConnection: (conn) => {
        db.prepare(`
      INSERT OR REPLACE INTO connections (id, name, type, host, port, username, password_encrypted, database, options_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(conn.id, conn.name, conn.type, conn.host || null, conn.port || null, conn.username || null, conn.password_encrypted || null, conn.database || null, conn.options_json || '{}');
    },
    deleteConnection: (id) => {
        db.prepare('DELETE FROM connections WHERE id = ?').run(id);
    },
    // Saved DB Queries
    getSavedDbQueries: (connId) => {
        if (connId) {
            return db.prepare('SELECT * FROM saved_queries WHERE connection_id = ?').all(connId);
        }
        return db.prepare('SELECT * FROM saved_queries').all();
    },
    saveDbQuery: (q) => {
        db.prepare('INSERT OR REPLACE INTO saved_queries (id, connection_id, query, name) VALUES (?, ?, ?, ?)')
            .run(q.id, q.connection_id, q.query, q.name);
    },
    deleteDbQuery: (id) => {
        db.prepare('DELETE FROM saved_queries WHERE id = ?').run(id);
    },
    // DB History
    getDbHistory: (connId) => {
        if (connId) {
            return db.prepare('SELECT * FROM db_history WHERE connection_id = ? ORDER BY timestamp DESC LIMIT 100').all(connId);
        }
        return db.prepare('SELECT * FROM db_history ORDER BY timestamp DESC LIMIT 100').all();
    },
    addDbHistory: (h) => {
        db.prepare('INSERT INTO db_history (id, connection_id, query, timestamp) VALUES (?, ?, ?, ?)')
            .run(h.id, h.connection_id, h.query, h.timestamp);
    },
    clearDbHistory: (connId) => {
        db.prepare('DELETE FROM db_history WHERE connection_id = ?').run(connId);
    },
    // Notes
    getNotes: () => db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all(),
    saveNote: (n) => {
        db.prepare('INSERT OR REPLACE INTO notes (id, title, content, updated_at) VALUES (?, ?, ?, ?)')
            .run(n.id, n.title, n.content, n.updated_at);
    },
    deleteNote: (id) => {
        db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    },
    // Code Snippets
    getCodeSnippets: () => db.prepare('SELECT * FROM code_snippets ORDER BY updated_at DESC').all(),
    saveCodeSnippet: (s) => {
        db.prepare('INSERT OR REPLACE INTO code_snippets (id, title, language, code, description, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
            .run(s.id, s.title, s.language, s.code, s.description || '', s.updated_at);
    },
    deleteCodeSnippet: (id) => {
        db.prepare('DELETE FROM code_snippets WHERE id = ?').run(id);
    }
};
