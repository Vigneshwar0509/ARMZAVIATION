import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface JobStore {
  savedJobIds: string[];
  saveJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  setSavedJobs: (jobIds: string[]) => void;
  clearSavedJobs: () => void;
  isJobSaved: (jobId: string) => boolean;
}

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      savedJobIds: [],
      saveJob: (jobId) => {
        const { savedJobIds } = get();
        if (!savedJobIds.includes(jobId)) {
          set({ savedJobIds: [...savedJobIds, jobId] });
        }
      },
      removeJob: (jobId) => {
        const { savedJobIds } = get();
        set({ savedJobIds: savedJobIds.filter((id) => id !== jobId) });
      },
      setSavedJobs: (jobIds) => set({ savedJobIds: jobIds }),
      clearSavedJobs: () => set({ savedJobIds: [] }),
      isJobSaved: (jobId) => {
        return get().savedJobIds.includes(jobId);
      },
    }),
    {
      name: 'job-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
