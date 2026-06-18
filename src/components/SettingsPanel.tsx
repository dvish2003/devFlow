import React from 'react';
import { Sun, Moon, Monitor, Palette, Info, Zap, Database, Code2, FileText, Key, Sliders, Printer, Table, Settings2 } from 'lucide-react';
import { useStore } from '../store';

type ThemeKey = 'light' | 'dark' | 'system';

const THEMES: { id: ThemeKey; label: string; desc: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  {
    id: 'light',
    label: 'White & Blue',
    desc: 'Clean bright workspace with blue accents',
    Icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark Theme',
    desc: 'Low-light professional dark workspace',
    Icon: Moon,
  },
  {
    id: 'system',
    label: 'System',
    desc: 'Follows your OS appearance settings',
    Icon: Monitor,
  },
];

const FEATURES = [
  { icon: Zap, label: 'API Client', desc: 'Full-featured HTTP request builder with collections, history and environments.' },
  { icon: Database, label: 'Database Studio', desc: 'Connect to MySQL, PostgreSQL, MongoDB & SQLite with table explorer and query console.' },
  { icon: FileText, label: 'Notes', desc: 'Markdown note-taking workspace, auto-saved locally.' },
  { icon: Code2, label: 'Code Snippets', desc: 'VS Code-themed Monaco editor snippets library, saved to SQLite.' },
  { icon: Code2, label: 'JSON Formatter', desc: 'Prettify, validate, and minify JSON payloads.' },
  { icon: Key, label: 'JWT Decoder', desc: 'Decode and inspect JWT tokens with expiry checks.' },
  { icon: Sliders, label: 'Env Generator', desc: 'Build and export .env configuration files.' },
  { icon: Printer, label: 'PDF Generator', desc: 'Convert text, Markdown, .docx and other files to printable PDF.' },
  { icon: Table, label: 'CSV Loader', desc: 'Parse and explore CSV files in an interactive data grid.' },
];

export const SettingsPanel: React.FC = () => {
  const { theme, setTheme } = useStore();

  return (
    <div className="flex-grow flex flex-col h-full overflow-y-auto theme-bg-primary">
      <div className="max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-color)]/20 flex items-center justify-center flex-shrink-0">
            <Settings2 size={22} className="text-[var(--accent-color)]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold theme-text-primary">DevFlow Studio Settings</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Customize your workspace appearance and view all available features</p>
          </div>
        </div>

        {/* Appearance / Theme */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-[var(--accent-color)]" />
            <h2 className="text-sm font-bold theme-text-primary">Appearance</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEMES.map(({ id, label, desc, Icon }) => {
              const isActive = theme === id;
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all group ${
                    isActive
                      ? 'border-[var(--accent-color)] bg-[var(--accent-bg)] shadow-lg shadow-[var(--accent-color)]/10'
                      : 'theme-border theme-bg-secondary hover:border-[var(--accent-color)]/40'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--accent-color)] flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}

                  {/* Theme icon preview */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                    id === 'light'
                      ? 'bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm'
                      : id === 'dark'
                      ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-sm'
                      : 'bg-gradient-to-br from-purple-900 via-blue-900 to-slate-800 border border-purple-700 shadow-sm'
                  }`}>
                    <Icon
                      size={24}
                      className={
                        id === 'light' ? 'text-amber-500' :
                        id === 'dark' ? 'text-blue-400' :
                        'text-purple-300'
                      }
                    />
                  </div>

                  <div className="text-center">
                    <p className={`text-sm font-bold ${isActive ? 'text-[var(--accent-color)]' : 'theme-text-primary'}`}>
                      {label}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current theme indicator */}
          <div className="mt-3 px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border theme-border flex items-center gap-2.5">
            {theme === 'light' && <Sun size={14} className="text-amber-500" />}
            {theme === 'dark' && <Moon size={14} className="text-blue-400" />}
            {theme === 'system' && <Monitor size={14} className="text-purple-400" />}
            <span className="text-xs theme-text-secondary">
              Active theme: <strong className="theme-text-primary">{THEMES.find(t => t.id === theme)?.label}</strong>
            </span>
          </div>
        </section>

        {/* Feature Overview */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-[var(--accent-color)]" />
            <h2 className="text-sm font-bold theme-text-primary">Available Features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-4 rounded-xl theme-bg-secondary border theme-border hover:border-[var(--accent-color)]/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-color)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} className="text-[var(--accent-color)]" />
                </div>
                <div>
                  <p className="text-xs font-bold theme-text-primary">{label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* App info */}
        <section className="pb-4">
          <div className="px-5 py-4 rounded-2xl theme-bg-secondary border theme-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-sm">DF</span>
              </div>
              <div>
                <p className="text-sm font-bold theme-text-primary">DevFlow Studio</p>
                <p className="text-[10px] text-zinc-500">v1.0.0 · Electron + React + SQLite</p>
              </div>
            </div>
            <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
              Production Ready
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
export default SettingsPanel;
