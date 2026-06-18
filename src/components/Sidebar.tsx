import React from 'react';
import { Send, Database, FileText, Code, Key, Cpu, Sliders, Printer, Table, Layers } from 'lucide-react';
import { useStore } from '../store';

export const Sidebar: React.FC = () => {
  const { sidebarTab, setSidebarTab } = useStore();

  const menuItems = [
    { id: 'api' as const, label: 'API Client', icon: Send },
    { id: 'db' as const, label: 'Database Client', icon: Database },
    { id: 'notes' as const, label: 'Workspace Notes', icon: FileText },
    { id: 'jsonFormatter' as const, label: 'JSON Formatter', icon: Code },
    { id: 'jwtDecoder' as const, label: 'JWT Decoder', icon: Key },
    { id: 'snippets' as const, label: 'Code Snippets', icon: Cpu },
    { id: 'envGen' as const, label: 'Env File Generator', icon: Sliders },
    { id: 'pdfGen' as const, label: 'PDF Generator', icon: Printer },
    { id: 'csvLoader' as const, label: 'CSV File Loader', icon: Table },
    { id: 'plugins' as const, label: 'Workspace Suite', icon: Layers },
  ];

  return (
    <div className="w-16 h-full flex flex-col items-center theme-bg-sidebar border-r theme-border py-4 select-none transition-colors duration-200">
      {/* Brand logo container */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-8 cursor-pointer transform hover:scale-105 transition-transform duration-200">
        <span className="text-white font-extrabold text-lg tracking-wider">DF</span>
      </div>

      {/* Action Buttons */}
      <div className="flex-1 flex flex-col gap-2 w-full px-2 overflow-y-auto scrollbar-none py-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = sidebarTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSidebarTab(item.id)}
              title={item.label}
              className={`w-full py-3 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/20 shadow-inner'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-hover)] hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
            </button>
          );
        })}
      </div>

      {/* Indicator info */}
      <div className="text-[10px] theme-text-secondary font-mono tracking-tight cursor-default">
        v1.0
      </div>
    </div>
  );
};
export default Sidebar;
