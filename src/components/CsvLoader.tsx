import React, { useState } from 'react';
import { Upload, FileSpreadsheet, ExternalLink, Link, Clipboard, Check, Search } from 'lucide-react';

export const CsvLoader: React.FC = () => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCell, setCopiedCell] = useState<{ row: number; col: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return;

    // Helper to split CSV line respecting quotes
    const splitCsvLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const parsedHeaders = splitCsvLine(lines[0]);
    const parsedRows = lines.slice(1).map(line => {
      const values = splitCsvLine(line);
      const rowObj: Record<string, string> = {};
      parsedHeaders.forEach((header, idx) => {
        rowObj[header] = values[idx] || '';
      });
      return rowObj;
    });

    setHeaders(parsedHeaders);
    setRows(parsedRows);
  };

  const isLink = (val: string) => {
    return val.startsWith('http://') || val.startsWith('https://');
  };

  const handleCellClick = (val: string, rIdx: number, col: string) => {
    navigator.clipboard.writeText(val);
    setCopiedCell({ row: rIdx, col });
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const filteredRows = rows.filter(row =>
    Object.values(row).some(val =>
      val.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden p-4 gap-4 theme-bg-primary">
      <div className="border-b theme-border pb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">CSV Grid File Loader</h3>
        {fileName && (
          <span className="text-[10px] bg-blue-50 text-[var(--accent-color)] border border-blue-100 px-2.5 py-0.5 rounded-lg font-mono font-bold">
            {fileName}
          </span>
        )}
      </div>

      {!rows.length ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed theme-border rounded-xl p-8 bg-[var(--bg-secondary)] gap-3 select-none">
          <FileSpreadsheet size={42} className="text-blue-500/40" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold theme-text-primary">No CSV File Uploaded</span>
            <span className="text-[10px] theme-text-secondary">Load local data tables directly into a grid</span>
          </div>
          <label className="px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
            <Upload size={14} /> Upload CSV File
            <input type="file" onChange={handleFileUpload} accept=".csv" className="hidden" />
          </label>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex justify-between items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={13} />
              <input
                type="text"
                placeholder="Filter grid data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs theme-text-primary bg-white border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
              />
            </div>
            <label className="text-[10px] uppercase font-bold text-[var(--accent-color)] hover:opacity-85 cursor-pointer flex items-center gap-1 transition-all">
              <Upload size={12} /> Reload Different File
              <input type="file" onChange={handleFileUpload} accept=".csv" className="hidden" />
            </label>
          </div>

          <div className="flex-grow overflow-auto border theme-border rounded-xl bg-white relative">
            <table className="w-full text-left border-collapse text-xs font-sans select-text">
              <thead>
                <tr className="bg-[var(--bg-sidebar)] border-b theme-border text-zinc-650 sticky top-0 z-10">
                  {headers.map(header => (
                    <th key={header} className="p-2.5 border-r theme-border font-bold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b theme-border hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors">
                    {headers.map(col => {
                      const val = row[col] || '';
                      const isCopied = copiedCell?.row === rIdx && copiedCell?.col === col;
                      return (
                        <td key={col} className="p-2.5 border-r theme-border truncate max-w-[200px] relative group">
                          {isLink(val) ? (
                            <a
                              href={val}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Link size={11} className="flex-shrink-0" />
                              <span className="truncate">{val}</span>
                            </a>
                          ) : (
                            <span className="select-text">{val}</span>
                          )}

                          {/* Quick cell copy button */}
                          <button
                            onClick={() => handleCellClick(val, rIdx, col)}
                            className="absolute right-1 top-2 p-1 bg-white border theme-border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-zinc-500 hover:text-[var(--accent-color)]"
                            title="Copy cell value"
                          >
                            {isCopied ? <Check size={10} className="text-emerald-500" /> : <Clipboard size={10} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center text-[10px] theme-text-secondary font-medium px-1">
            <span>Showing {filteredRows.length} of {rows.length} entries</span>
            <span>Click any URL link to launch in default browser.</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default CsvLoader;
