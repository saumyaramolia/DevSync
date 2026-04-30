import { create } from "zustand";

interface UIState {
  isSidebarCollapsed: boolean;
  activeDocumentId: string | null;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setActiveDocumentId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  activeDocumentId: null,
  setIsSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setActiveDocumentId: (id) => set({ activeDocumentId: id }),
}));
