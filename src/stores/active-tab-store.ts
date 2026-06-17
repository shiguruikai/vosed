import { create } from 'zustand';

export type TabValue = 'editor' | 'lines' | 'words';

export type ActiveTabState = Readonly<{
  activeTab: TabValue;
  setActiveTab: (value: TabValue) => void;
}>;

export const useActiveTab = create<ActiveTabState>((set) => ({
  activeTab: 'editor',
  setActiveTab: (value) => set({ activeTab: value }),
}));
