import React from 'react';
import { Send, Database, FileText, Braces, Key, Code2, Sliders, Printer, Table, Settings, Layers, TerminalSquare } from 'lucide-react';
import { useStore } from '../store';

export const Sidebar: React.FC = () => {
  const { sidebarTab, setSidebarTab } = useStore();

  const mainItems = [
    { id: 'api' as const, label: 'API Client', icon: Send },
    { id: 'db' as const, label: 'Database Studio', icon: Database },
    { id: 'terminal' as const, label: 'Terminal', icon: TerminalSquare },
  ];

  const utilityItems = [
    { id: 'notes' as const, label: 'Notes', icon: FileText },
    { id: 'snippets' as const, label: 'Code Snippets', icon: Code2 },
    { id: 'jsonFormatter' as const, label: 'JSON Formatter', icon: Braces },
    { id: 'jwtDecoder' as const, label: 'JWT Decoder', icon: Key },
    { id: 'envGen' as const, label: 'Env File Generator', icon: Sliders },
    { id: 'pdfGen' as const, label: 'PDF / Doc Generator', icon: Printer },
    { id: 'csvLoader' as const, label: 'CSV File Loader', icon: Table },
    { id: 'plugins' as const, label: 'Plugins', icon: Layers },
  ];

  const bottomItems = [
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const NavBtn = ({ id, label, icon: Icon }: { id: typeof sidebarTab; label: string; icon: React.FC<any> }) => {
    const isActive = sidebarTab === id;
    return (
      <button
        key={id}
        onClick={() => setSidebarTab(id)}
        title={label}
        className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 cursor-pointer relative ${
          isActive
            ? 'bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/25 shadow-inner'
            : 'text-zinc-500 hover:text-[var(--accent-color)] hover:bg-[var(--accent-bg)]/40'
        }`}
      >
        <Icon size={18} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
        {isActive && (
          <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent-color)] rounded-full" />
        )}
      </button>
    );
  };

  return (
    <div className="w-14 h-full flex flex-col items-center theme-bg-sidebar border-r theme-border py-3 select-none transition-colors duration-200">
      {/* Brand */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 cursor-pointer transform hover:scale-105 transition-transform duration-200 flex-shrink-0">
        <span className="text-white font-extrabold text-sm tracking-wider">DF</span>
      </div>

      {/* Main tools */}
      <div className="w-full px-1.5 flex flex-col gap-1 flex-shrink-0">
        {mainItems.map(item => (
          <NavBtn key={item.id} {...item} />
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-[var(--border-color)] my-2 flex-shrink-0" />

      {/* Utility tools - scrollable */}
      <div className="w-full px-1.5 flex flex-col gap-1 flex-1 overflow-y-auto scrollbar-none min-h-0">
        {utilityItems.map(item => (
          <NavBtn key={item.id} {...item} />
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-[var(--border-color)] my-2 flex-shrink-0" />

      {/* Bottom settings */}
      <div className="w-full px-1.5 flex flex-col gap-1 flex-shrink-0">
        {bottomItems.map(item => (
          <NavBtn key={item.id} {...item} />
        ))}
      </div>

      <div className="text-[9px] theme-text-secondary font-mono mt-2 flex-shrink-0">v1.0</div>
    </div>
  );
};
export default Sidebar;
