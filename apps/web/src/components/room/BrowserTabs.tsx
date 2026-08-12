import { X, Plus } from 'lucide-react';
import type { BrowserTab } from '@roomx/shared';

interface BrowserTabsProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export default function BrowserTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}: BrowserTabsProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-white/5 backdrop-blur-md border-b border-white/10 overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            onMouseUp={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                onTabClose(tab.id);
              }
            }}
            className={`group flex items-center gap-2 min-w-0 max-w-[180px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              isActive
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300 border border-transparent'
            }`}
            title={tab.url}
          >
            {tab.favicon ? (
              <img
                src={tab.favicon}
                alt=""
                className="w-3.5 h-3.5 shrink-0 rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <span className="truncate">{tab.title || 'New Tab'}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }
              }}
              className="ml-1 p-0.5 rounded hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        );
      })}
      <button
        onClick={onNewTab}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        title="New Tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
