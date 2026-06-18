import React, { useState } from 'react';
import { Plus, Trash2, Download, Copy, Check, FileCode } from 'lucide-react';

interface EnvVar {
  key: string;
  value: string;
}

export const EnvGenerator: React.FC = () => {
  const [vars, setVars] = useState<EnvVar[]>([
    { key: 'PORT', value: '3000' },
    { key: 'DATABASE_URL', value: 'postgresql://db:password@localhost:5432/main' },
    { key: 'JWT_SECRET', value: 'supersecretphrasekey' }
  ]);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setVars(prev => [...prev, { key: newKey.trim().toUpperCase().replace(/ /g, '_'), value: newVal }]);
    setNewKey('');
    setNewVal('');
  };

  const handleRemove = (index: number) => {
    setVars(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdate = (index: number, patch: Partial<EnvVar>) => {
    setVars(prev => prev.map((v, idx) => idx === index ? { ...v, ...patch } : v));
  };

  const generateEnvString = () => {
    return vars.map(v => `${v.key}=${v.value}`).join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateEnvString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const envString = generateEnvString();
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(envString);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", ".env");
    dlAnchorElem.click();
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden p-4 gap-4 theme-bg-primary">
      <div className="border-b theme-border pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dotenv File Generator</h3>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-[350px]">
        {/* Left builder panel */}
        <div className="flex flex-col gap-3 min-w-0">
          <span className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Configure Env Variables</span>

          <form onSubmit={handleAdd} className="flex gap-2 bg-[var(--bg-secondary)] p-3 rounded-xl border theme-border">
            <input
              type="text"
              placeholder="ENV_KEY"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-1/3 px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
            <input
              type="text"
              placeholder="value_setting"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {vars.map((v, index) => (
              <div key={index} className="flex items-center gap-2 bg-[var(--bg-secondary)] p-2.5 rounded-xl border theme-border animate-fade-in">
                <input
                  type="text"
                  value={v.key}
                  onChange={(e) => handleUpdate(index, { key: e.target.value.toUpperCase().replace(/ /g, '_') })}
                  className="w-1/3 bg-transparent text-xs theme-text-primary font-mono font-bold focus:outline-none border-b border-transparent focus:border-[var(--accent-color)]/30 px-1 py-0.5"
                />
                <input
                  type="text"
                  value={v.value}
                  onChange={(e) => handleUpdate(index, { value: e.target.value })}
                  className="flex-1 bg-transparent text-xs theme-text-primary font-mono focus:outline-none border-b border-transparent focus:border-[var(--accent-color)]/30 px-1 py-0.5"
                />
                <button
                  onClick={() => handleRemove(index)}
                  className="p-1 text-zinc-500 hover:text-rose-500 rounded hover:bg-rose-500/10 cursor-pointer transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {vars.length === 0 && (
              <div className="text-[11px] text-zinc-500 text-center py-8">No variables loaded. Add key values above!</div>
            )}
          </div>
        </div>

        {/* Right Output panel */}
        <div className="flex flex-col gap-2 min-w-0 h-full">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Preview .env File</span>
            <div className="flex gap-1.5">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-[11px] font-bold theme-bg-primary text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 text-[11px] font-bold bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <Download size={12} />
                Export .env
              </button>
            </div>
          </div>

          <div className="flex-1 rounded-xl border theme-border theme-bg-secondary overflow-hidden p-4 relative">
            <textarea
              readOnly
              value={generateEnvString()}
              className="w-full h-full bg-transparent text-xs font-mono theme-text-primary focus:outline-none resize-none overflow-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default EnvGenerator;
