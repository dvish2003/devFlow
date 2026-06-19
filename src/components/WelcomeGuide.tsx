import React, { useState } from 'react';
import { useStore } from '../store';
import { X, Play, Database, Terminal, Settings2, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export const WelcomeGuide: React.FC = () => {
  const { showWelcome, setShowWelcome } = useStore();
  const [activeTab, setActiveTab] = useState<'welcome' | 'api' | 'db' | 'terminal' | 'install'>('welcome');

  if (!showWelcome) return null;

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcome(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in select-text">
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl w-full max-w-2xl h-[560px] shadow-2xl flex overflow-hidden relative text-zinc-100">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all cursor-pointer z-10"
        >
          <X size={16} />
        </button>

        {/* Sidebar Nav */}
        <div className="w-48 bg-[#0a0a0c] border-r border-zinc-800 p-4 flex flex-col gap-1.5 flex-shrink-0 select-none">
          <div className="flex items-center gap-2 px-2 py-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-xs">DF</span>
            </div>
            <span className="font-extrabold text-sm tracking-wider">DevFlow Guide</span>
          </div>

          <button
            onClick={() => setActiveTab('welcome')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'welcome'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            👋 Welcome Guide
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'api'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            ⚡ API Client
          </button>
          <button
            onClick={() => setActiveTab('db')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'db'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            🗄️ Database Studio
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            🖥️ Terminal
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'install'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            📦 Packaging & Setup
          </button>

          <div className="mt-auto pt-4 border-t border-zinc-800/50 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-2 text-[10px] text-zinc-500">
              <CheckCircle size={10} className="text-emerald-500" />
              <span>v1.0 Ready</span>
            </div>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-grow p-6 flex flex-col h-full overflow-y-auto">
          {activeTab === 'welcome' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/15 mb-2">
                <span className="text-white font-extrabold text-lg">DF</span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100">Welcome to DevFlow Studio</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                DevFlow Studio is a unified desktop environment tailored for developers. It packs a fully featured HTTP request builder, an interactive SQL database studio explorer, utility workspace features (Notes, JWT, PDF, CSV), and a multi-tab integrated terminal, all backed by a high-performance local SQLite storage.
              </p>
              <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-blue-400">💡 Quick Navigation Tips:</span>
                <ul className="list-disc list-inside text-[11px] text-zinc-400 flex flex-col gap-1">
                  <li>Use the leftmost main sidebar to jump between features.</li>
                  <li>Click settings icon <Settings2 size={12} className="inline mx-0.5" /> to toggle theme appearances or inspect current state.</li>
                  <li>Toggle the Terminal using the main sidebar option or customize terminal themes from its dropdown list.</li>
                </ul>
              </div>
              <button
                onClick={() => setActiveTab('api')}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer max-w-max self-start"
              >
                Explore Features →
              </button>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center gap-2 text-blue-400">
                <Play size={18} className="fill-current" />
                <h3 className="text-sm font-bold uppercase tracking-wider">⚡ API Client Features</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Build headers, parameters, auth settings, and request bodies (JSON, Urlencoded, Form-Data) using our HTTP request client builder:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                  <p className="text-xs font-bold text-zinc-200">📂 Custom Collections</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Organize request histories into folders. Use the new Custom modal prompt dialogs by clicking the <span className="font-bold text-blue-400">+</span> icon.
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                  <p className="text-xs font-bold text-zinc-200">⌨️ Keyboard Shortcuts</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Trigger request executions quickly using <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-[9px] text-zinc-350">Ctrl+Enter</kbd> (or Cmd+Enter on macOS).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('db')}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer max-w-max self-start"
              >
                Next: Database Studio →
              </button>
            </div>
          )}

          {activeTab === 'db' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center gap-2 text-amber-500">
                <Database size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">🗄️ Database Studio</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Explore local databases or connect to remote production servers directly from the app interface:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                  <p className="text-xs font-bold text-zinc-200">🔍 Schema Explorer</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Browse columns, foreign keys, and indexes directly from the side explorer tree. Double click tables to view records instantly.
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                  <p className="text-xs font-bold text-zinc-200">💻 Multiple SQL Consoles</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Open query editors to test and execute commands. View output details inside dynamic, sortable and filterable grids.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('terminal')}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer max-w-max self-start"
              >
                Next: Integrated Terminal →
              </button>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400">
                <Terminal size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">🖥️ Integrated Terminal</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Run commands inside a secure shell linked via Electron IPC to your default local terminal:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                  <p className="text-xs font-bold text-zinc-200">🎨 Terminal Themes</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Choose from multiple themes (Default Dark, Matrix, Solarized, Cyberpunk, Light) from the dropdown selector.
                  </p>
                </div>
                <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl">
                  <p className="text-xs font-bold text-zinc-200">➕ Multi-tab Layout</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Open, manage, rename, or kill multiple console tabs synchronously. Fits layouts perfectly.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('install')}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer max-w-max self-start"
              >
                Next: Packaging & Install →
              </button>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="flex flex-col gap-4 animate-fade-in text-xs">
              <div className="flex items-center gap-2 text-purple-400">
                <Cpu size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">📦 Packaging & Executable Setup</h3>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Compile and export self-contained binary executables for macOS, Windows, or Linux using `electron-builder` configurations:
              </p>
              
              <div className="flex flex-col gap-3 mt-2">
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-zinc-200">🛠️ Build Terminal Scripts:</span>
                  <div className="flex flex-col gap-1.5 font-mono text-[10px] text-zinc-400 bg-black/40 p-2.5 rounded border border-zinc-800">
                    <div><span className="text-purple-400"># macOS:</span> npm run package:mac <span className="text-zinc-500">→ exports .dmg in /dist</span></div>
                    <div><span className="text-purple-400"># Windows:</span> npm run package:win <span className="text-zinc-500">→ exports .exe in /dist</span></div>
                    <div><span className="text-purple-400"># Linux:</span> npm run package:linux <span className="text-zinc-500">→ exports .deb in /dist</span></div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-zinc-200">⚠️ Setup Guidelines:</span>
                  <ul className="list-disc list-inside text-[10px] text-zinc-500 flex flex-col gap-1 leading-normal">
                    <li><strong className="text-zinc-350">macOS (.dmg):</strong> Double-click the exported DMG and drag DevFlow to Applications.</li>
                    <li><strong className="text-zinc-350">Windows (.exe):</strong> Launch the installer EXE file; installs program automatically.</li>
                    <li><strong className="text-zinc-350">Linux (.deb):</strong> Install package using command: <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-400">sudo dpkg -i devflow*.deb</code>.</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <ShieldAlert size={12} className="text-amber-500" />
                  <span>Always run build before packaging.</span>
                </div>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Get Started →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default WelcomeGuide;
