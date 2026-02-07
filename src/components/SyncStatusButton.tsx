import { useState, useEffect, useCallback } from 'react';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { performSync, SyncState, SyncResult, addSyncListener, getLastSyncInfo } from '@/utils/driveSyncManager';
import { useToast } from '@/hooks/use-toast';

interface SyncStatusButtonProps {
  size?: 'sm' | 'md';
}

export const SyncStatusButton = ({ size = 'sm' }: SyncStatusButtonProps) => {
  const { user } = useGoogleAuth();
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<SyncState>('idle');

  useEffect(() => {
    const unsub = addSyncListener(setSyncState);
    return unsub;
  }, []);

  const handleSync = useCallback(async () => {
    if (syncState === 'syncing' || !user) return;

    const result: SyncResult = await performSync();

    if (result.success) {
      toast({
        title: 'Synced',
        description: `Notes: ${result.stats?.notesUploaded ?? 0}, Tasks: ${result.stats?.tasksUploaded ?? 0}`,
      });
    } else {
      toast({
        title: 'Sync failed',
        description: result.error || 'Try again.',
        variant: 'destructive',
      });
    }
  }, [syncState, user, toast]);

  // Don't render if not signed in
  if (!user) return null;

  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const btnClass = size === 'sm'
    ? 'h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9'
    : 'h-8 w-8 sm:h-9 sm:w-9';

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleSync}
      disabled={syncState === 'syncing'}
      className={`${btnClass} hover:bg-transparent active:bg-transparent touch-target`}
      title={syncState === 'syncing' ? 'Syncing...' : 'Sync to Google Drive'}
    >
      {syncState === 'syncing' ? (
        <Loader2 className={`${iconClass} animate-spin text-primary`} />
      ) : syncState === 'success' ? (
        <CheckCircle2 className={`${iconClass} text-primary`} />
      ) : syncState === 'error' ? (
        <AlertCircle className={`${iconClass} text-destructive`} />
      ) : (
        <Cloud className={`${iconClass} text-muted-foreground`} />
      )}
    </Button>
  );
};
