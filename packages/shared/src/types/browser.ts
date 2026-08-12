export enum BrowserAction {
  NAVIGATE = 'navigate',
  BACK = 'back',
  FORWARD = 'forward',
  RELOAD = 'reload',
  NEW_TAB = 'newTab',
  CLOSE_TAB = 'closeTab',
  SWITCH_TAB = 'switchTab'
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isActive: boolean;
  isLoading: boolean;
  lastVisitedAt: Date;
}

export interface BrowserState {
  tabs: BrowserTab[];
  activeTabId: string;
  isSynced: boolean;
  isController: boolean;
  controllerId?: string;
  lastAction?: BrowserAction;
  lastActionAt?: Date;
}