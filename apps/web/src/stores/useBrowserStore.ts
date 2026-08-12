import { create } from 'zustand';
import type { BrowserTab } from '@roomx/shared';

type SyncMode = 'off' | 'presenter' | 'everyone';

interface BrowserState {
  tabs: BrowserTab[];
  activeTabId: string;
  syncMode: SyncMode;
  addTab: (tab: BrowserTab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabUrl: (tabId: string, url: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  setSyncMode: (mode: SyncMode) => void;
  setTabs: (tabs: BrowserTab[]) => void;
}

export const useBrowserStore = create<BrowserState>((set) => ({
  tabs: [],
  activeTabId: '',
  syncMode: 'off',

  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.isActive ? tab.id : state.activeTabId,
    })),

  removeTab: (tabId) =>
    set((state) => {
      const filtered = state.tabs.filter((t) => t.id !== tabId);
      const needNewActive = state.activeTabId === tabId;
      return {
        tabs: filtered,
        activeTabId: needNewActive
          ? filtered[filtered.length - 1]?.id || ''
          : state.activeTabId,
      };
    }),

  setActiveTab: (tabId) =>
    set((state) => ({
      activeTabId: tabId,
      tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === tabId })),
    })),

  updateTabUrl: (tabId, url) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, url } : t)),
    })),

  updateTabTitle: (tabId, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, title } : t)),
    })),

  setSyncMode: (mode) => set({ syncMode: mode }),

  setTabs: (tabs) => set({ tabs }),
}));
