// In-memory progress tracking for sync operations
interface SyncProgress {
  status: "idle" | "syncing" | "completed" | "error";
  currentStep: string;
  currentCategory?: string;
  categoriesProcessed: number;
  totalCategories: number;
  businessesInserted: number;
  businessesSkipped: number;
  categoriesAdded: number;
  categoriesUpdated: number;
  categoriesRemoved: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

let syncProgress: SyncProgress = {
  status: "idle",
  currentStep: "Ready",
  categoriesProcessed: 0,
  totalCategories: 0,
  businessesInserted: 0,
  businessesSkipped: 0,
  categoriesAdded: 0,
  categoriesUpdated: 0,
  categoriesRemoved: 0,
};

export function getSyncProgress(): SyncProgress {
  return { ...syncProgress };
}

export function resetSyncProgress(totalCategories: number) {
  syncProgress = {
    status: "syncing",
    currentStep: "Starting sync...",
    categoriesProcessed: 0,
    totalCategories,
    businessesInserted: 0,
    businessesSkipped: 0,
    categoriesAdded: 0,
    categoriesUpdated: 0,
    categoriesRemoved: 0,
    startTime: Date.now(),
  };
}

export function updateSyncProgress(updates: Partial<SyncProgress>) {
  syncProgress = { ...syncProgress, ...updates };
}

export function completeSyncProgress() {
  syncProgress.status = "completed";
  syncProgress.endTime = Date.now();
  syncProgress.currentStep = "Sync completed!";
}

export function errorSyncProgress(error: string) {
  syncProgress.status = "error";
  syncProgress.error = error;
  syncProgress.endTime = Date.now();
  syncProgress.currentStep = `Error: ${error}`;
}
