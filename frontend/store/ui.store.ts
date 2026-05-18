import { create } from 'zustand';

interface UIState {
  isTabBarVisible: boolean;
  isHeaderVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  setHeaderVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTabBarVisible: true,
  isHeaderVisible: true,
  setTabBarVisible: (visible) => set({ isTabBarVisible: visible }),
  setHeaderVisible: (visible) => set({ isHeaderVisible: visible }),
}));
