import { useState, useCallback, useRef } from 'react';
import type { BrowserTab } from '@roomx/shared';
import { useBrowserStore } from '@/stores/useBrowserStore';
import { useSocket } from '@/hooks/useSocket';
import BrowserToolbar from './BrowserToolbar';
import BrowserTabs from './BrowserTabs';
import BrowserContent from './BrowserContent';

type SyncMode = 'off' | 'presenter' | 'everyone';

const DEFAULT_URL = 'https://www.google.com';

function createTab(url: string, title: string): BrowserTab {
  return {
    id: crypto.randomUUID(),
    url,
    title,
    isActive: true,
    isLoading: false,
    lastVisitedAt: new Date(),
  };
}

export default function BrowserWorkspace() {
  const tabs = useBrowserStore((s) => s.tabs);
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const syncMode = useBrowserStore((s) => s.syncMode);
  const addTab = useBrowserStore((s) => s.addTab);
  const removeTab = useBrowserStore((s) => s.removeTab);
  const setActiveTab = useBrowserStore((s) => s.setActiveTab);
  const updateTabUrl = useBrowserStore((s) => s.updateTabUrl);
  const updateTabTitle = useBrowserStore((s) => s.updateTabTitle);
  const setSyncMode = useBrowserStore((s) => s.setSyncMode);

  const { socket } = useSocket();
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const navigationHistory = useRef<string[]>([DEFAULT_URL]);
  const historyIndex = useRef(0);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const emitBrowserAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      if (syncMode !== 'off' && socket) {
        socket.emit('browser:action', {
          action,
          tabs: useBrowserStore.getState().tabs,
          activeTabId: useBrowserStore.getState().activeTabId,
          ...payload,
        });
      }
    },
    [syncMode, socket]
  );

  const handleNavigate = useCallback(
    (url: string) => {
      setCurrentUrl(url);
      navigationHistory.current = navigationHistory.current.slice(
        0,
        historyIndex.current + 1
      );
      navigationHistory.current.push(url);
      historyIndex.current = navigationHistory.current.length - 1;

      if (activeTabId) {
        updateTabUrl(activeTabId, url);
        emitBrowserAction('navigate', { url });
      }
    },
    [activeTabId, updateTabUrl, emitBrowserAction]
  );

  const handleBack = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const url = navigationHistory.current[historyIndex.current];
      setCurrentUrl(url);
      if (activeTabId) updateTabUrl(activeTabId, url);
    }
  }, [activeTabId, updateTabUrl]);

  const handleForward = useCallback(() => {
    if (historyIndex.current < navigationHistory.current.length - 1) {
      historyIndex.current++;
      const url = navigationHistory.current[historyIndex.current];
      setCurrentUrl(url);
      if (activeTabId) updateTabUrl(activeTabId, url);
    }
  }, [activeTabId, updateTabUrl]);

  const handleReload = useCallback(() => {
    setCurrentUrl((prev) => prev + '?_=' + Date.now());
  }, []);

  const handleHome = useCallback(() => {
    handleNavigate(DEFAULT_URL);
  }, [handleNavigate]);

  const handleNewTab = useCallback(() => {
    const tab = createTab(DEFAULT_URL, 'New Tab');
    addTab(tab);
    setActiveTab(tab.id);
    setCurrentUrl(DEFAULT_URL);
    navigationHistory.current = [DEFAULT_URL];
    historyIndex.current = 0;
    emitBrowserAction('newTab');
  }, [addTab, setActiveTab, emitBrowserAction]);

  const handleTabSelect = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        setCurrentUrl(tab.url);
        navigationHistory.current = [tab.url];
        historyIndex.current = 0;
      }
    },
    [tabs, setActiveTab]
  );

  const handleTabClose = useCallback(
    (tabId: string) => {
      const remaining = tabs.filter((t) => t.id !== tabId);
      removeTab(tabId);

      if (remaining.length === 0) {
        const newTab = createTab(DEFAULT_URL, 'New Tab');
        addTab(newTab);
        setActiveTab(newTab.id);
        setCurrentUrl(DEFAULT_URL);
        navigationHistory.current = [DEFAULT_URL];
        historyIndex.current = 0;
      } else if (activeTabId === tabId) {
        const next = remaining[remaining.length - 1];
        setActiveTab(next.id);
        setCurrentUrl(next.url);
        navigationHistory.current = [next.url];
        historyIndex.current = 0;
      }
      emitBrowserAction('closeTab', { tabId });
    },
    [tabs, activeTabId, removeTab, addTab, setActiveTab, emitBrowserAction]
  );

  const handleUrlChange = useCallback(
    (titleOrUrl: string) => {
      if (activeTabId) {
        if (titleOrUrl && !titleOrUrl.startsWith('http')) {
          updateTabTitle(activeTabId, titleOrUrl);
        }
      }
    },
    [activeTabId, updateTabTitle]
  );

  const handleSyncModeChange = useCallback(
    (mode: SyncMode) => {
      setSyncMode(mode);
      if (mode !== 'off') {
        emitBrowserAction('sync-started');
      } else {
        socket?.emit('browser:sync-stopped');
      }
    },
    [setSyncMode, emitBrowserAction, socket]
  );

  if (tabs.length === 0) {
    handleNewTab();
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-950 rounded-xl border border-white/10 overflow-hidden">
      <BrowserTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
      />
      <BrowserToolbar
        url={currentUrl}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onHome={handleHome}
        onNewTab={handleNewTab}
        syncMode={syncMode}
        onSyncModeChange={handleSyncModeChange}
      />
      <div className="flex-1 overflow-hidden">
        <BrowserContent url={currentUrl} onUrlChange={handleUrlChange} />
      </div>
    </div>
  );
}
