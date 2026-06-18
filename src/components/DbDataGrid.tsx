import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useStore } from '../store';

interface DbDataGridProps {
  connectionId: string;
  tableName: string;
  tabId: string;
}

export const DbDataGrid: React.FC<DbDataGridProps> = ({ connectionId, tableName, tabId }) => {
  const { dbConnections, dbTabs, updateDbTabResults, theme } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [filterStr, setFilterStr] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC');

  // Editing cell states
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colName: string; originalVal: any } | null>(null);
  const [editValue, setEditValue] = useState('');

  const conn = dbConnections.find(c => c.id === connectionId);
  const tab = dbTabs.find(t => t.id === tabId);

  const loadData = async () => {
    if (!conn) return;
    setLoading(true);
    setError(null);

    try {
      let query = '';
      if (conn.type === 'mongo') {
        query = `db.${tableName}.find()`;
      } else {
        const offset = (page - 1) * pageSize;
        const orderBy = sortCol ? `ORDER BY ${sortCol} ${sortDir}` : '';
        const filter = filterStr.trim() ? `WHERE ${filterStr}` : '';
        query = `SELECT * FROM ${tableName} ${filter} ${orderBy} LIMIT ${pageSize} OFFSET ${offset}`;
      }

      const res = await window.api.executeDbQuery(conn, query);
      updateDbTabResults(tabId, res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [connectionId, tableName, page, sortCol, sortDir, filterStr]);

  const handleExport = (format: 'csv' | 'json') => {
    if (!tab?.results) return;
    const rows = tab.results.rows;
    let content = '';

    if (format === 'json') {
      content = JSON.stringify(rows, null, 2);
    } else {
      const headers = tab.results.columns;
      const csvRows = [
        headers.join(','),
        ...rows.map(row => headers.map(fieldName => JSON.stringify(row[fieldName] ?? '')).join(','))
      ];
      content = csvRows.join('\r\n');
    }

    const defaultPath = `${tableName}_export_${Date.now()}.${format}`;
    window.api.saveToFile(defaultPath, content);
  };

  const handleDeleteRow = async (row: any) => {
    if (!conn) return;
    const confirmDelete = confirm('Are you sure you want to delete this row?');
    if (!confirmDelete) return;

    try {
      let query = '';
      if (conn.type === 'sqlite' || conn.type === 'mysql' || conn.type === 'postgres') {
        // SQLite uses rowid or primary keys. Fallback to matching object properties
        const conditions = Object.entries(row)
          .filter(([_, val]) => val !== null && typeof val !== 'object')
          .map(([key, val]) => `${key} = ${typeof val === 'number' ? val : `'${val}'`}`)
          .join(' AND ');
        query = `DELETE FROM ${tableName} WHERE ${conditions} LIMIT 1`;
      } else if (conn.type === 'mongo') {
        const idVal = row._id || row.id;
        query = `db.${tableName}.deleteOne({ _id: ObjectId("${idVal}") })`;
      }

      await window.api.executeDbQuery(conn, query);
      loadData();
    } catch (err: any) {
      alert('Failed to delete row: ' + err.message);
    }
  };

  const handleCellClick = (rowIndex: number, colName: string, val: any) => {
    // MongoDB documents are JSON objects, edit using Console/JSON tab instead
    if (conn?.type === 'mongo') return;
    setEditingCell({ rowIndex, colName, originalVal: val });
    setEditValue(val !== null ? String(val) : '');
  };

  const handleCellSave = async () => {
    if (!editingCell || !conn) return;
    const row = tab?.results?.rows[editingCell.rowIndex];
    if (!row) return;

    try {
      const col = editingCell.colName;
      const conditions = Object.entries(row)
        .filter(([key, val]) => key !== col && val !== null && typeof val !== 'object')
        .map(([key, val]) => `${key} = ${typeof val === 'number' ? val : `'${val}'`}`)
        .join(' AND ');

      const safeVal = isNaN(Number(editValue)) ? `'${editValue}'` : Number(editValue);
      const query = `UPDATE ${tableName} SET ${col} = ${safeVal} WHERE ${conditions}`;
      await window.api.executeDbQuery(conn, query);
      loadData();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setEditingCell(null);
    }
  };

  const columns = tab?.results?.columns || [];
  const rows = tab?.results?.rows || [];

  return (
    <div className="h-full w-full flex flex-col gap-3">
      {/* Table grid toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
        theme === 'light' ? 'bg-[#ffffff] border-[#e4e4e7]' : 'bg-[#0d0d10] border-[#1a1a24]'
      }`}>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400">
            {tableName}
          </span>
          <button
            onClick={loadData}
            title="Refresh rows"
            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Filter query e.g. age > 20"
            value={filterStr}
            onChange={(e) => setFilterStr(e.target.value)}
            className={`px-3 py-1.5 text-xs rounded-lg focus:outline-none w-52 ${
              theme === 'light' ? 'bg-[#ffffff] text-zinc-800 border border-[#e4e4e7] focus:border-indigo-500/50' : 'bg-[#0e0e11] text-zinc-200 border border-[#1a1a24] focus:border-indigo-500/50'
            }`}
          />
          <button
            onClick={() => handleExport('csv')}
            title="Export CSV"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 border transition-colors cursor-pointer ${
              theme === 'light' ? 'bg-[#ffffff] hover:bg-zinc-50 border-[#e4e4e7] text-zinc-600' : 'bg-zinc-800/50 hover:bg-zinc-800 border-[#1a1a24] text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            title="Export JSON"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 border transition-colors cursor-pointer ${
              theme === 'light' ? 'bg-[#ffffff] hover:bg-zinc-50 border-[#e4e4e7] text-zinc-600' : 'bg-zinc-800/50 hover:bg-zinc-800 border-[#1a1a24] text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download size={13} /> JSON
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Grid Content */}
      <div className={`flex-1 overflow-auto rounded-xl border relative ${
        theme === 'light' ? 'bg-[#ffffff] border-[#e4e4e7]' : 'bg-[#09090b] border-[#1a1a24]'
      }`}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/10 backdrop-blur-[1px] text-xs text-zinc-400 font-semibold select-none">
            Querying rows...
          </div>
        ) : (
          <table className={`w-full text-left border-collapse text-xs font-mono select-text`}>
            <thead>
              <tr className={`border-b sticky top-0 ${
                theme === 'light' ? 'bg-[#f4f4f7] border-[#e4e4e7] text-zinc-600' : 'bg-[#0e0e12] border-[#1a1a24] text-zinc-400'
              }`}>
                <th className={`p-2.5 border-r w-12 text-center ${theme === 'light' ? 'border-[#e4e4e7]' : 'border-[#1a1a24]'}`}>Action</th>
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => {
                      setSortCol(col);
                      setSortDir(sortCol === col && sortDir === 'ASC' ? 'DESC' : 'ASC');
                    }}
                    className={`p-2.5 border-r cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 select-none group ${
                      theme === 'light' ? 'border-[#e4e4e7]' : 'border-[#1a1a24]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{col}</span>
                      {sortCol === col && (
                        <span className="text-[10px] text-indigo-400 font-bold">{sortDir}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className={`border-b transition-colors ${
                  theme === 'light' ? 'border-[#e4e4e7] hover:bg-zinc-50/70 text-zinc-700' : 'border-[#13131c] hover:bg-[#121217] text-zinc-300'
                }`}>
                  <td className={`p-2 border-r text-center ${theme === 'light' ? 'border-[#e4e4e7]' : 'border-[#1a1a24]'}`}>
                    <button
                      onClick={() => handleDeleteRow(row)}
                      className="p-1 rounded text-zinc-455 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                  {columns.map(col => {
                    const cellVal = row[col];
                    const isEditing = editingCell?.rowIndex === rIdx && editingCell?.colName === col;

                    return (
                      <td
                        key={col}
                        onClick={() => handleCellClick(rIdx, col, cellVal)}
                        className={`p-2 border-r truncate max-w-[200px] ${theme === 'light' ? 'border-[#e4e4e7]' : 'border-[#1a1a24]'}`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1.5 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          <span>{cellVal !== null ? String(cellVal) : <em className="text-zinc-650 dark:text-zinc-600">null</em>}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {rows.length === 0 && !loading && (
          <div className="w-full text-center py-12 text-zinc-500 italic select-none">
            Table does not contain rows matching selection
          </div>
        )}
      </div>

      {/* Pagination control footer */}
      {conn?.type !== 'mongo' && (
        <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
          theme === 'light' ? 'bg-[#ffffff] border-[#e4e4e7] text-zinc-500' : 'bg-[#0d0d10] border-[#1a1a24] text-zinc-500'
        }`}>
          <span>Page {page}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={rows.length < pageSize}
              className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DbDataGrid;
