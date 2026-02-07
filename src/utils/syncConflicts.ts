import { Note, TodoItem } from '@/types/note';

export interface SyncConflict {
  id: string;
  type: 'note' | 'task';
  localItem: Note | TodoItem;
  remoteItem: Note | TodoItem;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  detectedAt: Date;
}

// In-memory store for unresolved conflicts
let pendingConflicts: SyncConflict[] = [];
const conflictListeners = new Set<(conflicts: SyncConflict[]) => void>();

export const getPendingConflicts = (): SyncConflict[] => [...pendingConflicts];

export const addConflict = (conflict: SyncConflict) => {
  // Replace existing conflict for the same item
  pendingConflicts = pendingConflicts.filter(c => c.id !== conflict.id);
  pendingConflicts.push(conflict);
  notifyConflictListeners();
};

export const addConflicts = (conflicts: SyncConflict[]) => {
  const ids = new Set(conflicts.map(c => c.id));
  pendingConflicts = pendingConflicts.filter(c => !ids.has(c.id));
  pendingConflicts.push(...conflicts);
  notifyConflictListeners();
};

export const resolveConflict = (conflictId: string) => {
  pendingConflicts = pendingConflicts.filter(c => c.id !== conflictId);
  notifyConflictListeners();
};

export const clearAllConflicts = () => {
  pendingConflicts = [];
  notifyConflictListeners();
};

export const addConflictListener = (listener: (conflicts: SyncConflict[]) => void): (() => void) => {
  conflictListeners.add(listener);
  return () => { conflictListeners.delete(listener); };
};

const notifyConflictListeners = () => {
  const snapshot = [...pendingConflicts];
  conflictListeners.forEach(fn => fn(snapshot));
};
