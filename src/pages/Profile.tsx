import { useState, useEffect } from 'react';
import { ArrowLeft, HardDrive, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation } from '@/components/BottomNavigation';
import { TodoBottomNavigation } from '@/components/TodoBottomNavigation';
import { getSetting } from '@/utils/settingsStorage';
import { createBackup } from '@/utils/dataBackup';

export default function Profile() {
  const { t } = useTranslation();
  const location = useLocation();
  const [lastDashboard, setLastDashboard] = useState<'notes' | 'todo'>('notes');
  const [backupSize, setBackupSize] = useState<string>('');
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);

  // Calculate backup size
  const calculateBackupSize = async () => {
    setIsCalculatingSize(true);
    try {
      const backup = await createBackup();
      const jsonString = JSON.stringify(backup);
      const sizeBytes = new Blob([jsonString]).size;
      
      // Format size
      if (sizeBytes < 1024) {
        setBackupSize(`${sizeBytes} B`);
      } else if (sizeBytes < 1024 * 1024) {
        setBackupSize(`${(sizeBytes / 1024).toFixed(1)} KB`);
      } else {
        setBackupSize(`${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`);
      }
    } catch (error) {
      console.error('Error calculating backup size:', error);
      setBackupSize('--');
    } finally {
      setIsCalculatingSize(false);
    }
  };

  // Calculate backup size on mount
  useEffect(() => {
    calculateBackupSize();
  }, []);

  // Determine which dashboard the user came from
  useEffect(() => {
    const checkLastDashboard = async () => {
      const fromState = (location.state as any)?.from;
      if (fromState?.startsWith('/todo')) {
        setLastDashboard('todo');
      } else {
        const stored = await getSetting<string>('lastDashboard', 'notes');
        setLastDashboard(stored === 'todo' ? 'todo' : 'notes');
      }
    };
    checkLastDashboard();
  }, [location.state]);

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-muted/30" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <Link to={lastDashboard === 'todo' ? '/todo/today' : '/'} className="p-2 -ml-2 hover:bg-muted/50 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">{t('profile.title')}</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex flex-col items-center px-6 pt-12">
        {/* Profile placeholder */}
        <div className="flex flex-col items-center w-full max-w-sm">
          {/* Decorative blob */}
          <div className="relative mb-8">
            <div className="absolute -inset-12 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute top-0 left-0 w-6 h-6 bg-primary/10 rounded-full -translate-x-10 -translate-y-6" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary/10 rounded-full translate-x-14 translate-y-4" />
            <div className="relative w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-14 h-14 text-primary" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            {t('profile.guest', 'Guest User')}
          </h2>
          <p className="text-muted-foreground text-sm text-center mb-10 max-w-xs">
            {t('profile.localOnly', 'Your data is stored locally on this device.')}
          </p>

          {/* Backup Size Card */}
          <div className="w-full p-4 bg-secondary/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HardDrive className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t('profile.backupSize', 'Data Size')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.backupSizeDesc', 'Total local data')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isCalculatingSize ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                ) : (
                  <span className="text-lg font-semibold text-foreground">{backupSize}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lastDashboard === 'todo' ? <TodoBottomNavigation /> : <BottomNavigation />}
    </div>
  );
}
