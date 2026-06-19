/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Plus, Database, Server, Eye, Trash2, ShieldAlert } from 'lucide-react';
import { useStore } from '../store';

export const DbExplorer: React.FC = () => {
  const {
    dbConnections,
    activeConnectionId,
    setActiveConnectionId,
    createDbConnection,
    deleteDbConnection,
    addDbTab,
    theme
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'mysql' | 'postgres' | 'mongo' | 'sqlite'>('sqlite');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(3306);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [ssl, setSsl] = useState(false);
  const [srv, setSrv] = useState(false);

  // Schema tree states
  const [tables, setTables] = useState<string[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);

  const activeConn = dbConnections.find(c => c.id === activeConnectionId);

  useEffect(() => {
    if (activeConn) {
      setLoadingSchema(true);
      window.api.getDbSchema(activeConn)
        .then(res => {
          setTables(res.tables || []);
          setLoadingSchema(false);
        })
        .catch(err => {
          console.error(err);
          setTables([]);
          setLoadingSchema(false);
        });
    } else {
      setTables([]);
    }
  }, [activeConnectionId, dbConnections]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const payload = { id: '', name, type, host, port: srv ? undefined : port, username, password, database, options_json: JSON.stringify({ ssl, srv }) };
    const res = await window.api.testConnection(payload);
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createDbConnection({
      name: name.trim(),
      type,
      host: type !== 'sqlite' ? host : undefined,
      port: type !== 'sqlite' && !srv ? port : undefined,
      username: type !== 'sqlite' ? username : undefined,
      password: password || undefined,
      database: database.trim(),
      options_json: JSON.stringify({ ssl, srv })
    });

    // Reset Form
    setName('');
    setPassword('');
    setDatabase('');
    setSrv(false);
    setSsl(false);
    setShowModal(false);
    setTestResult(null);
  };

  const handleOpenTable = (tableName: string) => {
    if (!activeConnectionId) return;
    addDbTab({
      type: 'table',
      name: tableName,
      connectionId: activeConnectionId,
      tableName
    });
  };

  const handleOpenQuery = () => {
    if (!activeConnectionId) return;
    addDbTab({
      type: 'query',
      name: `SQL Console`,
      connectionId: activeConnectionId,
      queryContent: activeConn?.type === 'mongo' ? 'db.collection.find()' : 'SELECT * FROM table LIMIT 100'
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full p-4 text-zinc-300 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#181822] pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Databases</h3>
        <button
          onClick={() => setShowModal(true)}
          className="p-1.5 rounded hover:bg-[#1a1a24] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          title="New DB Connection"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Active connections dropdown */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase font-bold text-zinc-500">Active Connection</label>
        <select
          value={activeConnectionId || ''}
          onChange={(e) => setActiveConnectionId(e.target.value || null)}
          className="w-full px-3 py-1.5 text-xs rounded-lg focus:outline-none cursor-pointer transition-all border bg-[#181822] border-[#181822]/30 focus:border-[#181822]"
        >
          <option value="">-- Disconnected --</option>
          {dbConnections.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
          ))}
        </select>
      </div>

      {/* Tables Explorer tree panel */}
      {activeConn ? (
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500">
              {activeConn.type === 'mongo' ? 'Collections' : 'Tables'}
            </span>
            <button
              onClick={handleOpenQuery}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded"
            >
              SQL Editor
            </button>
          </div>

          {loadingSchema ? (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 select-none animate-pulse">
              Loading structures...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 font-mono text-xs">
              {tables.map(t => (
                <div
                  key={t}
                  onClick={() => handleOpenTable(t)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#121217] cursor-pointer text-zinc-300 hover:text-zinc-100 group transition-all"
                >
                  <Database size={13} className="text-zinc-500 group-hover:text-indigo-400" />
                  <span className="truncate flex-1">{t}</span>
                  <Eye size={11} className="text-zinc-500 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
              {tables.length === 0 && (
                <span className="text-zinc-500 italic text-[11px] py-4 text-center">No structures detected</span>
              )}
            </div>
          )}

          {/* Delete active connection option */}
          <div className="border-t border-[#181822]/60 pt-3">
            <button
              onClick={() => deleteDbConnection(activeConn.id)}
              className="w-full py-1.5 text-xs text-zinc-500 hover:text-rose-400 flex items-center justify-center gap-1.5 rounded-lg border border-transparent hover:border-rose-500/10 hover:bg-rose-500/5 transition-all cursor-pointer font-semibold"
            >
              <Trash2 size={13} /> Remove Connection
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 select-none text-center leading-relaxed">
          Establish or select a database connection above to browse schemas
        </div>
      )}

      {/* New Connection Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className={`w-full max-w-md border rounded-xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto transition-colors ${
            theme === 'light' ? 'bg-[#ffffff] border-[#e4e4e7] text-zinc-800' : 'bg-[#0c0c0f] border-[#1c1c26] text-zinc-300'
          }`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
              <Server size={16} className="text-blue-500" /> New DB Connection
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] theme-text-secondary">Connection Name</label>
                <input
                  type="text"
                  required
                  placeholder="Production DB"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none ${
                    theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] theme-text-secondary">DB Type</label>
                <select
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setType(t);
                    setPort(t === 'postgres' ? 5432 : t === 'mongo' ? 27017 : 3306);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none cursor-pointer ${
                    theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                  }`}
                >
                  <option value="sqlite">SQLite</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="mongo">MongoDB</option>
                </select>
              </div>
            </div>

            {type === 'sqlite' ? (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] theme-text-secondary">SQLite Database Absolute File Path</label>
                <input
                  type="text"
                  required
                  placeholder="/Users/name/devflow.db"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none font-mono ${
                    theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                  }`}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`${type === 'mongo' && srv ? 'col-span-3' : 'col-span-2'} flex flex-col gap-1`}>
                    <label className="text-[11px] theme-text-secondary">Host / Connection String URI</label>
                    <input
                      type="text"
                      required
                      placeholder={type === 'mongo' && srv ? "cluster0.xxxx.mongodb.net" : "127.0.0.1"}
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none font-mono ${
                        theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                      }`}
                    />
                  </div>
                  {!(type === 'mongo' && srv) && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] theme-text-secondary">Port</label>
                      <input
                        type="number"
                        required
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none font-mono ${
                          theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] theme-text-secondary">Username</label>
                    <input
                      type="text"
                      placeholder="root"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none ${
                        theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] theme-text-secondary">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none ${
                        theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] theme-text-secondary">Database Name</label>
                  <input
                    type="text"
                    required
                    placeholder="my_database"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none ${
                      theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-blue-500/50' : 'bg-[#050507] text-zinc-200 border border-[#1a1a24] focus:border-blue-500/50'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ssl"
                      checked={ssl}
                      onChange={(e) => setSsl(e.target.checked)}
                      className="w-4 h-4 accent-blue-500 border-zinc-700 bg-zinc-800 rounded cursor-pointer"
                    />
                    <label htmlFor="ssl" className="text-xs theme-text-secondary cursor-pointer">Require SSL Link</label>
                  </div>
                  {type === 'mongo' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="srv"
                        checked={srv}
                        onChange={(e) => setSrv(e.target.checked)}
                        className="w-4 h-4 accent-blue-500 border-zinc-700 bg-zinc-800 rounded cursor-pointer"
                      />
                      <label htmlFor="srv" className="text-xs theme-text-secondary cursor-pointer">Atlas Cluster Connection (mongodb+srv)</label>
                    </div>
                  )}
                </div>
              </>
            )}

            {testResult && (
              <div className={`p-2.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
                testResult.success ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-rose-500/5 border-rose-500/10 text-rose-500'
              }`}>
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end border-t theme-border pt-3.5 mt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  theme === 'light' ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300' : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className={`px-4 py-2 text-xs font-bold rounded-xl border disabled:opacity-50 transition-colors cursor-pointer ${
                  theme === 'light' ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-650' : 'bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700/50 text-zinc-300'
                }`}
              >
                {testing ? 'Testing...' : 'Test Link'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default DbExplorer;
