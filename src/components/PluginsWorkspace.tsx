import React from 'react';
import { ShieldCheck, Code, Cpu, Terminal, Database, Hammer, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useStore } from '../store';

export const PluginsWorkspace: React.FC = () => {
  const { setSidebarTab, theme } = useStore();

  const plugins = [
    { id: 'jsonFormatter' as const, name: 'JSON Formatter & Parser', desc: 'Prettify, compress, validate, and format JSON strings with syntax highlighting and validation warnings.', icon: Code, status: 'Active' },
    { id: 'jwtDecoder' as const, name: 'JWT Decoder', desc: 'Decode JSON Web Tokens (JWT) payload structures and inspect signature algorithms and expiration times.', icon: ShieldCheck, status: 'Active' },
    { id: 'db' as const, name: 'SQL Query Studio', desc: 'Connect to databases directly. Browse schemas, tables, run queries and inspect records in a tabular datagrid.', icon: Database, status: 'Active' },
    { id: 'terminal' as const, name: 'Terminal Emulator', desc: 'Integrated shell workspace supporting zsh, bash, cmd or powershell with full multiplexing and command history.', icon: Terminal, status: 'Active' },
    { id: 'snippets' as const, name: 'Snippet Manager', desc: 'Save, catalog and search code helper snippets with templates across 24 programming languages and Monaco autocomplete.', icon: Code, status: 'Active' },
    { id: 'envGen' as const, name: 'Env File Generator', desc: 'Generate and parse environment configs (.env) with security suggestions and variable templates.', icon: Hammer, status: 'Active' },
  ];

  const isLight = theme === 'light';

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden theme-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b theme-border flex-shrink-0 bg-[var(--bg-secondary)]/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Cpu size={16} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold theme-text-primary">Installed Plugins & Features</h2>
            <p className="text-[10px] theme-text-secondary mt-0.5">Toggle, launch and configure DevFlow Studio features</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
          Plugin Architecture Active
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Available Extension Panels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins.map((plugin) => {
              const Icon = plugin.icon;
              return (
                <div
                  key={plugin.id}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 group ${
                    isLight
                      ? 'bg-white border-[#e4e4e7] hover:border-blue-500/40 hover:shadow-sm'
                      : 'bg-[#0e0e11] border-[#1a1a24] hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${isLight ? 'bg-zinc-100 text-blue-600' : 'bg-zinc-900 text-blue-400'}`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {plugin.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold theme-text-primary mb-1">{plugin.name}</h4>
                    <p className="text-[11px] theme-text-secondary leading-relaxed font-medium mb-4">
                      {plugin.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => setSidebarTab(plugin.id)}
                    className="w-full py-1.5 rounded-lg bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Launch Panel <ArrowUpRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Developer Info */}
        <div className={`border rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isLight ? 'bg-indigo-50/45 border-indigo-100' : 'bg-indigo-950/10 border-indigo-900/30'
        }`}>
          <div className="flex flex-col gap-1 max-w-2xl">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Hammer size={14} /> DevFlow Studio Plugin SDK Specifications
            </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              You can extend DevFlow Studio by writing custom plugin tools. By using our standard react-manifest schema, you can mount features directly onto the left sidebar navigation list. Custom plugins have direct access to SQLite db handlers, system file managers, and terminal streams.
            </p>
          </div>
          <button className="px-4 py-2 border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
            Read SDK Docs <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default PluginsWorkspace;
