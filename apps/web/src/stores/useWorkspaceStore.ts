import { create } from 'zustand';

type ActivePanel = 'screen' | 'browser' | 'whiteboard' | 'files' | 'notes';

interface WorkspaceState {
  activePanel: ActivePanel;
  sidebarOpen: boolean;
  bottomBarOpen: boolean;
  setPanel: (panel: ActivePanel) => void;
  toggleSidebar: () => void;
  toggleBottomBar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setBottomBarOpen: (open: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activePanel: 'screen',
  sidebarOpen: true,
  bottomBarOpen: true,

  setPanel: (panel) => set({ activePanel: panel }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleBottomBar: () => set((state) => ({ bottomBarOpen: !state.bottomBarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setBottomBarOpen: (open) => set({ bottomBarOpen: open }),
}));
