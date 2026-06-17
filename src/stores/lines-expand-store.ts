import { create } from 'zustand';

type LinesExpandState = Readonly<{
  isExpanded: boolean;
  toggleExpand: () => void;
  setIsExpanded: (expanded: boolean) => void;
}>;

export const useLinesExpandStore = create<LinesExpandState>((set) => ({
  isExpanded: false,
  toggleExpand: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setIsExpanded: (expanded) => set({ isExpanded: expanded }),
}));
