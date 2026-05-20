import { create } from 'zustand';

interface AdminState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
