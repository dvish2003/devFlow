import React, { useEffect, useState } from 'react';
import { Play, Save, ChevronDown, CheckCircle, Database } from 'lucide-react';
import { useStore } from './store';
import type { DevFlowState } from './store';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import HeadersEditor from './components/RequestBuilder/HeadersEditor';
import ParamsEditor from './components/RequestBuilder/ParamsEditor';
import BodyEditor from './components/RequestBuilder/BodyEditor';
import AuthEditor from './components/RequestBuilder/AuthEditor';
import ResponseTabs from './components/ResponseViewer/ResponseTabs';
import CollectionManager from './components/CollectionManager';
import HistoryPanel from './components/HistoryPanel';
import PluginsPanel from './components/PluginsPanel';
import WelcomeGuide from './components/WelcomeGuide';

// Database Viewer Components
import DbExplorer from './components/DbExplorer';
import DbDataGrid from './components/DbDataGrid';
import DbQueryEditor from './components/DbQueryEditor';

// Workspace Utility Features
import NotesPanel from './components/NotesPanel';
import JsonFormatter from './components/JsonFormatter';
import JwtDecoder from './components/JwtDecoder';
import CodeSnippets from './components/CodeSnippets';
import EnvGenerator from './components/EnvGenerator';
import PdfGenerator from './components/PdfGenerator';
import CsvLoader from './components/CsvLoader';
import SettingsPanel from './components/SettingsPanel';
import TerminalPanel from './components/TerminalPanel';
import PluginsWorkspace from './components/PluginsWorkspace';

export const App: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    tabs,
    activeTabId,
    environments,
    variables,
    loadData,
    updateActiveTabRequest,
    setActiveTabSending,
    setActiveTabResponse,
    addHistoryItem,
    saveRequest,
    collections,

    // Database state mappings
    theme,
    setTheme,
    dbTabs,
    activeDbTabId,
    setActiveDbTabId,
    closeDbTab,
    showWelcome,
    setShowWelcome
  } = useStore();

  const [activeBuilderTab, setActiveBuilderTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [apiSubTab, setApiSubTab] = useState<'builder' | 'collections' | 'history'>('builder');

  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(288); // default height 288px
  const [prevTab, setPrevTab] = useState<DevFlowState['sidebarTab']>('api');

  // Handle resizing of terminal panel via dragging top border
  const handleTerminalResize = (mouseDownEvent: React.MouseEvent) => {
    const startY = mouseDownEvent.clientY;
    const startHeight = terminalHeight;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const deltaY = mouseMoveEvent.clientY - startY;
      const newHeight = Math.max(120, Math.min(window.innerHeight - 100, startHeight - deltaY));
      setTerminalHeight(newHeight);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // Load Initial Workspace Data from SQLite
  useEffect(() => {
    loadData().then(() => {
      setDbStatus('connected');
    }).catch(() => {
      setDbStatus('disconnected');
    });
  }, [loadData]);

  // Welcome dialog first-time check
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenWelcome');
    if (!hasSeen) {
      setShowWelcome(true);
    }
  }, [setShowWelcome]);

  // Handle sidebar terminal clicks to toggle bottom terminal panel
  useEffect(() => {
    if (sidebarTab === 'terminal') {
      setShowTerminal(prev => !prev);
      setSidebarTab(prevTab);
    } else {
      setPrevTab(sidebarTab);
    }
  }, [sidebarTab, setSidebarTab, prevTab]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Keyboard shortcut Ctrl/Cmd + Enter to trigger request execution
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (sidebarTab === 'api') {
          e.preventDefault();
          handleSend();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, variables, environments, sidebarTab]);

  const handleSend = async () => {
    if (!activeTab || !activeTab.request.url) {
      alert('Please specify a destination URL');
      return;
    }

    setActiveTabSending(true);

    // Filter active environment variables to replace in engine
    const activeEnv = environments.find(e => e.is_active === 1);
    const activeVariables = activeEnv ? variables.filter(v => v.environment_id === activeEnv.id) : [];

    try {
      const response = await window.api.executeRequest(activeTab.request, activeVariables);
      setActiveTabResponse(response);

      // Record in SQLite History log
      await addHistoryItem({
        method: activeTab.request.method,
        url: activeTab.request.url,
        status: response.status,
        response_time: response.duration
      });
    } catch (err: any) {
      setActiveTabResponse({
        success: false,
        status: 0,
        statusText: err.message || 'Execution Error',
        headers: {},
        duration: 0,
        size: 0,
        body: String(err)
      });
    }
  };

  const handleSaveDraft = async () => {
    if (activeTab) {
      await saveRequest(activeTab.request);
    }
  };

  const activeEnv = environments.find(e => e.is_active === 1);

  const builderTabs = [
    { id: 'params' as const, label: 'Params' },
    { id: 'headers' as const, label: 'Headers' },
    { id: 'body' as const, label: 'Body' },
    { id: 'auth' as const, label: 'Auth' }
  ];

  const activeDbTab = dbTabs.find(t => t.id === activeDbTabId);

  return (
    <div className="h-screen w-screen flex font-sans overflow-hidden transition-colors duration-200 theme-bg-primary theme-text-primary">
      {/* Side Main Navigation Bar */}
      <Sidebar />

      {/* Primary Sidebar Content panel */}
      {['api', 'db', 'plugins'].includes(sidebarTab) && (
        <div className="w-80 flex-shrink-0 h-full border-r flex flex-col overflow-hidden transition-colors theme-bg-secondary theme-border">
          {sidebarTab === 'api' && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Sub-tabs header for API Client */}
              <div className="flex border-b theme-border theme-bg-primary px-2 py-1.5 gap-1 select-none">
                <button
                  onClick={() => setApiSubTab('builder')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
                    apiSubTab === 'builder'
                      ? 'bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/10 shadow-sm'
                      : 'theme-text-secondary hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  Request
                </button>
                <button
                  onClick={() => setApiSubTab('collections')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
                    apiSubTab === 'collections'
                      ? 'bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/10 shadow-sm'
                      : 'theme-text-secondary hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  Collections
                </button>
                <button
                  onClick={() => setApiSubTab('history')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer ${
                    apiSubTab === 'history'
                      ? 'bg-[var(--accent-bg)] text-[var(--accent-color)] border border-[var(--accent-color)]/10 shadow-sm'
                      : 'theme-text-secondary hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  History
                </button>
              </div>

              {/* Sub-tab content */}
              <div className="flex-1 overflow-y-auto">
                {apiSubTab === 'builder' && (
                  <div className="flex flex-col gap-4 p-4 h-full">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b theme-border pb-3">
                      Request Builder
                    </h3>
                    {activeTab && (
                      <div className="flex-grow overflow-y-auto flex flex-col gap-3">
                        <label className="text-[11px] font-semibold text-zinc-455 uppercase tracking-wider">Draft Config</label>
                        <input
                          type="text"
                          placeholder="Request draft name..."
                          value={activeTab.request.name}
                          onChange={(e) => updateActiveTabRequest(r => ({ ...r, name: e.target.value }))}
                          className="px-3 py-1.5 text-xs theme-text-primary theme-bg-primary border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
                        />
                        <label className="text-[11px] font-semibold text-zinc-550 uppercase tracking-wider">Collection</label>
                        <select
                          value={activeTab.request.collection_id || ''}
                          onChange={(e) => {
                            const val = e.target.value || null;
                            updateActiveTabRequest(r => ({ ...r, collection_id: val }));
                            if (val) {
                              setApiSubTab('collections');
                            }
                          }}
                          className="px-3 py-1.5 text-xs theme-text-primary theme-bg-primary border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none cursor-pointer"
                        >
                          <option value="">None (Scratch Draft)</option>
                          {collections.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <p className="text-[11px] theme-text-secondary leading-relaxed font-medium">
                          Set URL execution patterns, parameters, header values and customize body configurations. Hit send or use <kbd className="bg-blue-100/80 px-1.5 py-0.5 rounded text-[10px]">Ctrl+Enter</kbd> to launch request.
                        </p>
                      </div>
                    )}
                    {/* DB status bar */}
                    <div className="border-t theme-border pt-3 flex items-center justify-between text-[10px] theme-text-secondary">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Database size={12} className={dbStatus === 'connected' ? 'text-emerald-500' : 'text-zinc-650'} />
                        SQLite Status
                      </span>
                      <span className={dbStatus === 'connected' ? 'text-emerald-500 font-bold' : 'text-zinc-650'}>
                        {dbStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                {apiSubTab === 'collections' && <CollectionManager />}
                {apiSubTab === 'history' && <HistoryPanel />}
              </div>
            </div>
          )}
          {sidebarTab === 'db' && <DbExplorer />}
          {sidebarTab === 'plugins' && <PluginsPanel />}
        </div>
      )}

      {/* Main Workspace workbench */}
      <div className="flex-grow min-w-0 h-full flex flex-col overflow-hidden relative">

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {sidebarTab === 'db' ? (
            /* Database Workspaces Main panel */
            <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors theme-bg-primary">
              {/* DB Tabs header */}
              <div className="flex items-center border-b overflow-x-auto w-full select-none scrollbar-none theme-bg-secondary theme-border">
                <div className="flex items-center min-w-max">
                  {dbTabs.map((t) => {
                    const isActive = t.id === activeDbTabId;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveDbTabId(t.id)}
                        className={`flex items-center gap-2 px-4 h-10 border-r theme-border cursor-pointer group transition-all duration-150 ${
                          isActive
                            ? 'theme-bg-primary theme-text-primary font-semibold border-t-2 border-t-[var(--accent-color)]'
                            : 'theme-text-secondary hover:theme-text-primary hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <span className="text-[10px] bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 uppercase font-bold tracking-wider scale-95 border border-blue-100">
                          {t.type}
                        </span>
                        <span className="text-xs truncate max-w-[120px]">{t.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeDbTab(t.id);
                          }}
                          className="p-0.5 rounded hover:bg-blue-100/50 theme-text-secondary hover:theme-text-primary opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DB Active tab details display */}
              <div className="p-4 flex-grow overflow-hidden flex flex-col">
                {activeDbTab ? (
                  activeDbTab.type === 'table' && activeDbTab.tableName ? (
                    <DbDataGrid
                      key={activeDbTab.id}
                      connectionId={activeDbTab.connectionId}
                      tableName={activeDbTab.tableName}
                      tabId={activeDbTab.id}
                    />
                  ) : (
                    <DbQueryEditor
                      key={activeDbTab.id}
                      connectionId={activeDbTab.connectionId}
                      tabId={activeDbTab.id}
                      initialQuery={activeDbTab.queryContent}
                    />
                  )
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 select-none gap-2">
                    <Database size={32} className="text-zinc-650" />
                    <span className="text-xs font-semibold uppercase tracking-wider">No Active Database Workspace</span>
                    <span className="text-[11px] text-zinc-600">Select tables from explorer tree to view data or open consoles</span>
                  </div>
                )}
              </div>
            </div>
          ) : sidebarTab === 'notes' ? (
            <NotesPanel />
          ) : sidebarTab === 'jsonFormatter' ? (
            <JsonFormatter />
          ) : sidebarTab === 'jwtDecoder' ? (
            <JwtDecoder />
          ) : sidebarTab === 'snippets' ? (
            <CodeSnippets />
          ) : sidebarTab === 'envGen' ? (
            <EnvGenerator />
          ) : sidebarTab === 'pdfGen' ? (
            <PdfGenerator />
          ) : sidebarTab === 'csvLoader' ? (
            <CsvLoader />
          ) : sidebarTab === 'settings' ? (
            <SettingsPanel />
          ) : sidebarTab === 'plugins' ? (
            <PluginsWorkspace />
          ) : (
            /* API Workbench Workspace Panel */
            activeTab ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <Tabs />

                <div className="p-4 flex flex-col gap-4 flex-grow overflow-y-auto">
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={activeTab.request.method}
                        onChange={(e) => updateActiveTabRequest(r => ({ ...r, method: e.target.value }))}
                        className="h-10 px-3 pr-8 text-xs font-bold text-[var(--accent-color)] theme-bg-primary border theme-border rounded-xl focus:border-[var(--accent-color)]/50 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                        <option value="OPTIONS">OPTIONS</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-3.5 text-zinc-500 pointer-events-none" size={13} />
                    </div>

                    <input
                      type="text"
                      placeholder="https://api.example.com/v1/resource"
                      value={activeTab.request.url}
                      onChange={(e) => updateActiveTabRequest(r => ({ ...r, url: e.target.value }))}
                      className="flex-1 h-10 px-4 text-xs font-mono theme-text-primary theme-bg-primary border theme-border rounded-xl focus:border-[var(--accent-color)]/50 focus:outline-none"
                    />

                    <button
                      onClick={handleSend}
                      disabled={activeTab.isSending}
                      className="h-10 px-5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play size={14} className="fill-current" />
                      Send
                    </button>

                    <button
                      onClick={handleSaveDraft}
                      className="h-10 px-4 theme-bg-primary text-[var(--accent-color)] border theme-border hover:bg-[var(--bg-secondary)] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Save changes to SQLite"
                    >
                      <Save size={14} />
                      Save
                    </button>
                  </div>



                  <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-[350px]">
                    <div className="flex flex-col gap-3 min-w-0">
                      <div className="flex gap-2 border-b border-[#181822] pb-2">
                        {builderTabs.map((bt) => (
                          <button
                            key={bt.id}
                            onClick={() => setActiveBuilderTab(bt.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              activeBuilderTab === bt.id
                                ? 'bg-[var(--accent-color)] text-white'
                                : 'theme-text-secondary hover:bg-[var(--bg-secondary)]'
                            }`}
                          >
                            {bt.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {activeBuilderTab === 'params' && <ParamsEditor />}
                        {activeBuilderTab === 'headers' && <HeadersEditor />}
                        {activeBuilderTab === 'body' && <BodyEditor />}
                        {activeBuilderTab === 'auth' && <AuthEditor />}
                      </div>
                    </div>

                    <div className="min-w-0 h-full">
                      <ResponseTabs />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 select-none gap-2 h-full">
                <span className="text-xs font-semibold uppercase tracking-wider">No Active Request Tab</span>
                <span className="text-[11px] text-zinc-650">Select or create requests from collections/history on the left</span>
              </div>
            )
          )}
        </div>
        {showTerminal && sidebarTab !== 'settings' && (
          <div 
            style={{ height: `${terminalHeight}px` }}
            className="border-t border-zinc-800 bg-[#0d0f14] flex flex-col flex-shrink-0 relative"
          >
            {/* Resizing Drag Handle */}
            <div 
              onMouseDown={handleTerminalResize}
              className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-emerald-500/40 transition-colors z-50"
              title="Drag to resize terminal"
            />
            <TerminalPanel onClose={() => setShowTerminal(false)} />
          </div>
        )}
      </div>
      <WelcomeGuide />
    </div>
  );
};
export default App;
