import React from 'react';
import { ShieldCheck, Code, Cpu, Terminal, Database, GitBranch, Hammer } from 'lucide-react';

export const PluginsPanel: React.FC = () => {
  const futureModules = [
    { name: 'JSON Formatter & Parser', desc: 'Prettify, compress, validate and format JSON strings.', icon: Code, status: 'Ready to expand' },
    { name: 'JWT Decoder', desc: 'Decode JWT payloads and check expiration/signatures securely.', icon: ShieldCheck, status: 'Ready to expand' },
    { name: 'SQL Query Studio', desc: 'Connect to SQLite/MySQL/PostgreSQL databases directly.', icon: Database, status: 'Planned' },
    { name: 'Terminal Emulator', desc: 'Full workspace shell emulator to run native platform scripts.', icon: Terminal, status: 'Planned' },
    { name: 'Snippet Manager', desc: 'Save and index helper code snippets with search tag support.', icon: Cpu, status: 'Planned' },
    { name: 'Git Workspace Client', desc: 'Visualize repo branch networks, stage edits, and trigger commits.', icon: GitBranch, status: 'Planned' },
  ];

  return (
    <div className="flex flex-col gap-4 h-full p-4 theme-text-primary overflow-y-auto">
      <div className="border-b theme-border pb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Workspace Plugins</h3>
        <span className="text-[10px] bg-blue-50 text-[var(--accent-color)] border border-blue-100 px-2 py-0.5 rounded-full font-mono font-bold">Plugin Architecture</span>
      </div>

      <div className="flex flex-col gap-3 pr-1">
        {futureModules.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl border theme-border bg-[var(--bg-primary)] hover:border-[var(--accent-color)]/30 transition-all group duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--accent-color)] transition-colors">
                    <Icon size={15} />
                  </div>
                  <span className="text-xs font-bold theme-text-primary">{m.name}</span>
                </div>
                <span className="text-[9px] bg-[var(--bg-secondary)] theme-text-secondary px-2 py-0.5 rounded-md font-mono border theme-border">{m.status}</span>
              </div>
              <p className="text-[11px] theme-text-secondary font-medium leading-relaxed">{m.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
          <Hammer size={14} /> Plugin SDK Specs
        </div>
        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
          DevFlow Studio utilizes dynamic pre-mount lifecycle hooks. You can load new tools dynamically by registering React nodes directly into the plugin manifest interface.
        </p>
      </div>
    </div>
  );
};
export default PluginsPanel;
