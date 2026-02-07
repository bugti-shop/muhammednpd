import { useEffect, useRef, useCallback } from 'react';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { performIncrementalSync } from '@/utils/driveSyncManager';

const DEBOUNCE_MS = 5000; // 5s debounce after focus
const MIN_SYNC_INTERVAL_MS = 60_000; // Don't sync more than once per minute

/**
 * Auto-syncs with Google Drive when the app regains focus.
 * Uses incremental sync (change tokens) to avoid unnecessary uploads.
 */
export const useAutoSync = () => {
  const { user } = useGoogleAuth();
  const lastSyncRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedSync = useCallback(() => {
    if (!user) return;

    // Clear any pending debounce
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < MIN_SYNC_INTERVAL_MS) return;

      lastSyncRef.current = now;
      try {
        await performIncrementalSync();
      } catch (e) {
        console.warn('Auto-sync failed:', e);
      }
    }, DEBOUNCE_MS);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleFocus = () => debouncedSync();

    // Browser visibility API
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') debouncedSync();
    };

    // Capacitor app resume (native)
    const handleResume = () => debouncedSync();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('appResume', handleResume);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('appResume', handleResume);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, debouncedSync]);
};
