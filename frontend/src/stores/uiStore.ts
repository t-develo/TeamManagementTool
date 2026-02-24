import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  modalData: unknown;
}

interface UiActions {
  toggleSidebar: () => void;
  openModal: (name: string, data?: unknown) => void;
  closeModal: () => void;
}

type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openModal: (name: string, data?: unknown) =>
    set({ activeModal: name, modalData: data ?? null }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
