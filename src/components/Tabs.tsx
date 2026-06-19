/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef } from 'react';
import { Plus, X, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';

const generateUniqueReqId = () => `req_${Date.now()}`;

export const Tabs: React.FC = () => {
  const { tabs, activeTabId, setActiveTabId, closeTab, addTab } = useStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleDuplicate = (e: React.MouseEvent, tab: any) => {
    e.stopPropagation();
    addTab({
      ...tab.request,
      id: generateUniqueReqId(),
      name: `${tab.request.name} (Copy)`
    });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex items-center theme-bg-secondary border-b theme-border w-full select-none transition-colors duration-200 relative overflow-hidden flex-shrink-0">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="h-10 px-2.5 theme-text-secondary hover:theme-text-primary hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 border-r theme-border transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
        title="Scroll Left"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Tabs scroll area */}
      <div
        ref={scrollContainerRef}
        className="flex-grow flex items-center overflow-x-auto scrollbar-none transition-all duration-200"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex items-center">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const methodColor = getMethodColor(tab.request.method);

            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 h-10 border-r theme-border cursor-pointer group transition-all duration-150 flex-shrink-0 min-w-[120px] max-w-[165px] ${
                  isActive
                    ? 'theme-bg-primary theme-text-primary font-semibold border-t-2 border-t-[var(--accent-color)]'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                }`}
              >
                {/* Method tag */}
                <span className={`text-[10px] font-bold tracking-wider uppercase flex-shrink-0 ${methodColor}`}>
                  {tab.request.method}
                </span>

                {/* Tab name */}
                <span className="text-xs truncate flex-grow">
                  {tab.name || 'Untitled Request'}
                </span>

                {/* Dirty Indicator / Duplicate & Close button actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {tab.isDirty && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block group-hover:hidden" />
                  )}
                  
                  <button
                    onClick={(e) => handleDuplicate(e, tab)}
                    title="Duplicate Tab"
                    className="p-0.5 rounded hover:bg-[#1f1f27] text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy size={11} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-[#1f1f27] text-zinc-500 hover:text-zinc-300 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="h-10 px-2.5 theme-text-secondary hover:theme-text-primary hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 border-l theme-border transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
        title="Scroll Right"
      >
        <ChevronRight size={14} />
      </button>

      {/* Add new tab action button */}
      <button
        onClick={() => addTab()}
        className="p-2 mx-1 text-zinc-500 hover:text-zinc-200 hover:bg-[#0e0e12] rounded-lg transition-colors cursor-pointer flex-shrink-0"
        title="New Request (Draft)"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export const getMethodColor = (method: string): string => {
  switch (method) {
    case 'GET': return 'text-emerald-400';
    case 'POST': return 'text-amber-400';
    case 'PUT': return 'text-sky-400';
    case 'DELETE': return 'text-rose-400';
    case 'PATCH': return 'text-purple-400';
    default: return 'text-zinc-400';
  }
};

export default Tabs;
