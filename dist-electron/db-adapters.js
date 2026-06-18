"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbEngine = void 0;
exports.encryptPassword = encryptPassword;
exports.decryptPassword = decryptPassword;
const promise_1 = __importDefault(require("mysql2/promise"));
const pg_1 = require("pg");
const mongodb_1 = require("mongodb");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
// Encryption helpers
function encryptPassword(password) {
    if (!password)
        return '';
    if (electron_1.safeStorage.isEncryptionAvailable()) {
        return electron_1.safeStorage.encryptString(password).toString('base64');
    }
    return Buffer.from(password).toString('base64'); // Fallback if system safeStorage is not available
}
function decryptPassword(encryptedBase64) {
    if (!encryptedBase64)
        return '';
    try {
        const buffer = Buffer.from(encryptedBase64, 'base64');
        if (electron_1.safeStorage.isEncryptionAvailable()) {
            return electron_1.safeStorage.decryptString(buffer);
        }
        return buffer.toString('utf8');
    }
    catch (err) {
        console.error('Decryption failed, returning empty', err);
        return '';
    }
}
exports.dbEngine = {
    // Test connection
    testConnection: async (conn) => {
        const password = decryptPassword(conn.password_encrypted || '');
        const options = JSON.parse(conn.options_json || '{}');
        try {
            if (conn.type === 'mysql') {
                const connection = await promise_1.default.createConnection({
                    host: conn.host,
                    port: conn.port || 3306,
                    user: conn.username,
                    password,
                    database: conn.database,
                    connectTimeout: 5000,
                    ssl: options.ssl ? {} : undefined
                });
                await connection.end();
                return { success: true, message: 'MySQL connection successful' };
            }
            if (conn.type === 'postgres') {
                const client = new pg_1.Client({
                    host: conn.host,
                    port: conn.port || 5432,
                    user: conn.username,
                    password,
                    database: conn.database,
                    connectionTimeoutMillis: 5000,
                    ssl: options.ssl ? { rejectUnauthorized: false } : undefined
                });
                await client.connect();
                await client.end();
                return { success: true, message: 'PostgreSQL connection successful' };
            }
            if (conn.type === 'mongo') {
                // Build Mongo URI
                const auth = conn.username ? `${conn.username}:${encodeURIComponent(password)}@` : '';
                const hostStr = conn.host || 'localhost';
                const portStr = conn.port ? `:${conn.port}` : '';
                const uri = `mongodb://${auth}${hostStr}${portStr}/${conn.database || ''}`;
                const client = new mongodb_1.MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
                await client.connect();
                await client.close();
                return { success: true, message: 'MongoDB connection successful' };
            }
            if (conn.type === 'sqlite') {
                if (!conn.database) {
                    return { success: false, message: 'SQLite database path is required' };
                }
                const db = new better_sqlite3_1.default(conn.database, { fileMustExist: true });
                db.close();
                return { success: true, message: 'SQLite file verified successfully' };
            }
            return { success: false, message: `Unsupported DB type: ${conn.type}` };
        }
        catch (err) {
            return { success: false, message: err.message || 'Connection failed' };
        }
    },
    // Explore database structure
    getSchema: async (conn) => {
        const password = decryptPassword(conn.password_encrypted || '');
        const options = JSON.parse(conn.options_json || '{}');
        try {
            if (conn.type === 'mysql') {
                const connection = await promise_1.default.createConnection({
                    host: conn.host,
                    port: conn.port || 3306,
                    user: conn.username,
                    password,
                    database: conn.database,
                    ssl: options.ssl ? {} : undefined
                });
                const [rows] = await connection.query('SHOW TABLES');
                await connection.end();
                const tables = rows.map((r) => Object.values(r)[0]);
                return { tables };
            }
            if (conn.type === 'postgres') {
                const client = new pg_1.Client({
                    host: conn.host,
                    port: conn.port || 5432,
                    user: conn.username,
                    password,
                    database: conn.database,
                    ssl: options.ssl ? { rejectUnauthorized: false } : undefined
                });
                await client.connect();
                const res = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        `);
                await client.end();
                const tables = res.rows.map((r) => r.table_name);
                return { tables };
            }
            if (conn.type === 'mongo') {
                const auth = conn.username ? `${conn.username}:${encodeURIComponent(password)}@` : '';
                const hostStr = conn.host || 'localhost';
                const portStr = conn.port ? `:${conn.port}` : '';
                const uri = `mongodb://${auth}${hostStr}${portStr}/${conn.database || ''}`;
                const client = new mongodb_1.MongoClient(uri);
                await client.connect();
                const db = client.db(conn.database || 'test');
                const collections = await db.listCollections().toArray();
                await client.close();
                const tables = collections.map(c => c.name);
                return { tables };
            }
            if (conn.type === 'sqlite') {
                if (!conn.database)
                    return { tables: [] };
                const db = new better_sqlite3_1.default(conn.database, { readonly: true });
                const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
                db.close();
                return { tables: rows.map(r => r.name) };
            }
            return { tables: [] };
        }
        catch (err) {
            console.error('Failed to get schema', err);
            throw err;
        }
    },
    // Execute Query or command
    executeQuery: async (conn, query, params = {}) => {
        const password = decryptPassword(conn.password_encrypted || '');
        const options = JSON.parse(conn.options_json || '{}');
        try {
            if (conn.type === 'mysql') {
                const connection = await promise_1.default.createConnection({
                    host: conn.host,
                    port: conn.port || 3306,
                    user: conn.username,
                    password,
                    database: conn.database,
                    ssl: options.ssl ? {} : undefined
                });
                const [rows] = await connection.query(query);
                await connection.end();
                if (Array.isArray(rows)) {
                    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
                    return { rows, columns };
                }
                return { rows: [{ affectedRows: rows.affectedRows, insertId: rows.insertId }], columns: ['result'] };
            }
            if (conn.type === 'postgres') {
                const client = new pg_1.Client({
                    host: conn.host,
                    port: conn.port || 5432,
                    user: conn.username,
                    password,
                    database: conn.database,
                    ssl: options.ssl ? { rejectUnauthorized: false } : undefined
                });
                await client.connect();
                const res = await client.query(query);
                await client.end();
                if (Array.isArray(res.rows)) {
                    const columns = res.fields ? res.fields.map(f => f.name) : (res.rows.length > 0 ? Object.keys(res.rows[0]) : []);
                    return { rows: res.rows, columns };
                }
                return { rows: [{ command: res.command, rowCount: res.rowCount }], columns: ['result'] };
            }
            if (conn.type === 'mongo') {
                const auth = conn.username ? `${conn.username}:${encodeURIComponent(password)}@` : '';
                const hostStr = conn.host || 'localhost';
                const portStr = conn.port ? `:${conn.port}` : '';
                const uri = `mongodb://${auth}${hostStr}${portStr}/${conn.database || ''}`;
                const client = new mongodb_1.MongoClient(uri);
                await client.connect();
                const db = client.db(conn.database || 'test');
                // Mongo special commands parsing. Expected format: db.collection.find({ ... })
                // Basic parser for demonstration (eval-like or structured method calls)
                const match = query.match(/^db\.(\w+)\.(\w+)\((.*)\)/s);
                if (!match) {
                    await client.close();
                    throw new Error('Invalid MongoDB command format. Use format: db.collectionName.find() or db.collectionName.insertOne({ ... })');
                }
                const [_, collectionName, method, argumentsStr] = match;
                const col = db.collection(collectionName);
                let parsedArgs = [];
                if (argumentsStr.trim()) {
                    try {
                        // Safe JSON parse mapping for query params (relaxed JSON parse)
                        const wrappedArgs = `[${argumentsStr}]`;
                        parsedArgs = eval(`(${wrappedArgs})`); // Simple relaxed parser for queries
                    }
                    catch (e) {
                        throw new Error(`Failed to parse MongoDB arguments: ${e}`);
                    }
                }
                let result = null;
                if (method === 'find') {
                    const filter = parsedArgs[0] || {};
                    const projection = parsedArgs[1] || {};
                    result = await col.find(filter, { projection }).limit(200).toArray();
                }
                else if (method === 'insertOne') {
                    result = await col.insertOne(parsedArgs[0] || {});
                }
                else if (method === 'updateOne') {
                    result = await col.updateOne(parsedArgs[0] || {}, parsedArgs[1] || {});
                }
                else if (method === 'deleteOne') {
                    result = await col.deleteOne(parsedArgs[0] || {});
                }
                else {
                    throw new Error(`Unsupported MongoDB method: ${method}`);
                }
                await client.close();
                const rows = Array.isArray(result) ? result : [result];
                const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
                return { rows, columns };
            }
            if (conn.type === 'sqlite') {
                if (!conn.database)
                    throw new Error('SQLite file path not configured');
                const db = new better_sqlite3_1.default(conn.database);
                const stmt = db.prepare(query);
                let rows = [];
                if (stmt.reader) {
                    rows = stmt.all();
                }
                else {
                    const info = stmt.run();
                    rows = [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }];
                }
                db.close();
                const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
                return { rows, columns };
            }
            throw new Error(`Unsupported adapter query execution: ${conn.type}`);
        }
        catch (err) {
            console.error('Execution failed', err);
            throw err;
        }
    }
};
