import mysql from 'mysql2/promise';
import { Client } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';
import Database from 'better-sqlite3';
import { safeStorage } from 'electron';

// Encryption helpers
export function encryptPassword(password: string): string {
  if (!password) return '';
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(password).toString('base64');
  }
  return Buffer.from(password).toString('base64'); // Fallback if system safeStorage is not available
}

export function decryptPassword(encryptedBase64: string): string {
  if (!encryptedBase64) return '';
  try {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buffer);
    }
    return buffer.toString('utf8');
  } catch (err) {
    console.error('Decryption failed, returning empty', err);
    return '';
  }
}

export function buildMongoUri(conn: DbConnection, passwordDecrypted: string): string {
  const options = JSON.parse(conn.options_json || '{}');
  const isSrv = options.srv === true;
  const auth = conn.username ? `${conn.username}:${encodeURIComponent(passwordDecrypted)}@` : '';
  const hostStr = conn.host || 'localhost';
  const portStr = !isSrv && conn.port ? `:${conn.port}` : '';
  const protocol = isSrv ? 'mongodb+srv' : 'mongodb';
  return `${protocol}://${auth}${hostStr}${portStr}/${conn.database || ''}`;
}

export interface DbConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgres' | 'mongo' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password_encrypted?: string;
  database?: string;
  options_json?: string;
}

export const dbEngine = {
  // Test connection
  testConnection: async (conn: DbConnection): Promise<{ success: boolean; message: string }> => {
    const password = decryptPassword(conn.password_encrypted || '');
    const options = JSON.parse(conn.options_json || '{}');

    try {
      if (conn.type === 'mysql') {
        const connection = await mysql.createConnection({
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
        const client = new Client({
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
        const uri = buildMongoUri(conn, password);
        const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        await client.close();
        return { success: true, message: 'MongoDB connection successful' };
      }

      if (conn.type === 'sqlite') {
        if (!conn.database) {
          return { success: false, message: 'SQLite database path is required' };
        }
        const db = new Database(conn.database, { fileMustExist: true });
        db.close();
        return { success: true, message: 'SQLite file verified successfully' };
      }

      return { success: false, message: `Unsupported DB type: ${conn.type}` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed' };
    }
  },

  // Explore database structure
  getSchema: async (conn: DbConnection): Promise<{ databases?: string[]; tables: string[] }> => {
    const password = decryptPassword(conn.password_encrypted || '');
    const options = JSON.parse(conn.options_json || '{}');

    try {
      if (conn.type === 'mysql') {
        const connection = await mysql.createConnection({
          host: conn.host,
          port: conn.port || 3306,
          user: conn.username,
          password,
          database: conn.database,
          ssl: options.ssl ? {} : undefined
        });
        const [rows]: any[] = await connection.query('SHOW TABLES');
        await connection.end();
        const tables = rows.map((r: any) => Object.values(r)[0] as string);
        return { tables };
      }

      if (conn.type === 'postgres') {
        const client = new Client({
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
        const tables = res.rows.map((r: any) => r.table_name);
        return { tables };
      }

      if (conn.type === 'mongo') {
        const uri = buildMongoUri(conn, password);
        const client = new MongoClient(uri);
        await client.connect();
        const db = client.db(conn.database || 'test');
        const collections = await db.listCollections().toArray();
        await client.close();
        const tables = collections.map(c => c.name);
        return { tables };
      }

      if (conn.type === 'sqlite') {
        if (!conn.database) return { tables: [] };
        const db = new Database(conn.database, { readonly: true });
        const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as any[];
        db.close();
        return { tables: rows.map(r => r.name) };
      }

      return { tables: [] };
    } catch (err) {
      console.error('Failed to get schema', err);
      throw err;
    }
  },

  // Execute Query or command
  executeQuery: async (conn: DbConnection, query: string, params: any = {}): Promise<{ rows: any[]; columns: string[] }> => {
    const password = decryptPassword(conn.password_encrypted || '');
    const options = JSON.parse(conn.options_json || '{}');

    try {
      if (conn.type === 'mysql') {
        const connection = await mysql.createConnection({
          host: conn.host,
          port: conn.port || 3306,
          user: conn.username,
          password,
          database: conn.database,
          ssl: options.ssl ? {} : undefined
        });
        const [rows]: any[] = await connection.query(query);
        await connection.end();

        if (Array.isArray(rows)) {
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
          return { rows, columns };
        }
        return { rows: [{ affectedRows: rows.affectedRows, insertId: rows.insertId }], columns: ['result'] };
      }

      if (conn.type === 'postgres') {
        const client = new Client({
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
        const uri = buildMongoUri(conn, password);
        const client = new MongoClient(uri);
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

        let parsedArgs: any[] = [];
        if (argumentsStr.trim()) {
          try {
            // Safe JSON parse mapping for query params (relaxed JSON parse)
            const wrappedArgs = `[${argumentsStr}]`;
            parsedArgs = eval(`(${wrappedArgs})`); // Simple relaxed parser for queries
          } catch (e) {
            throw new Error(`Failed to parse MongoDB arguments: ${e}`);
          }
        }

        let result: any = null;
        if (method === 'find') {
          const filter = parsedArgs[0] || {};
          const projection = parsedArgs[1] || {};
          result = await col.find(filter, { projection }).limit(200).toArray();
        } else if (method === 'insertOne') {
          result = await col.insertOne(parsedArgs[0] || {});
        } else if (method === 'updateOne') {
          result = await col.updateOne(parsedArgs[0] || {}, parsedArgs[1] || {});
        } else if (method === 'deleteOne') {
          result = await col.deleteOne(parsedArgs[0] || {});
        } else {
          throw new Error(`Unsupported MongoDB method: ${method}`);
        }

        await client.close();
        const rows = Array.isArray(result) ? result : [result];
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        return { rows, columns };
      }

      if (conn.type === 'sqlite') {
        if (!conn.database) throw new Error('SQLite file path not configured');
        const db = new Database(conn.database);
        const stmt = db.prepare(query);
        let rows: any[] = [];
        if (stmt.reader) {
          rows = stmt.all();
        } else {
          const info = stmt.run();
          rows = [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }];
        }
        db.close();
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        return { rows, columns };
      }

      throw new Error(`Unsupported adapter query execution: ${conn.type}`);
    } catch (err: any) {
      console.error('Execution failed', err);
      throw err;
    }
  }
};
