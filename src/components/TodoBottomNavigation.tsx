import { startTransition, useCallback, useState, useEffect } from 'react';
import { Home, Calendar, Settings, BarChart3, User, ClipboardList, History, CalendarDays, CalendarRange } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { getSetting } from '@/utils/settingsStorage';

const triggerNavHaptic = async () => {
  await triggerHaptic('heavy');
};

export interface TodoNavItem {
  id: string;
  label: string;
  customLabel?: string;
  icon: string;
  path: string;
  visible: boolean;
}

// Icon mapping for todo navigation
const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  BarChart3,
  User,
  Calendar,
  Settings,
  ClipboardList,
  History,
  CalendarDays,
  CalendarRange,
};

export const DEFAULT_TODO_NAV_ITEMS: TodoNavItem[] = [
  { id: 'home', label: 'Home', icon: 'Home', path: '/todo/today', visible: true },
  { id: 'progress', label: 'Progress', icon: 'BarChart3', path: '/todo/progress', visible: true },
  { id: 'profile', label: 'Profile', icon: 'User', path: '/profile', visible: true },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar', path: '/todo/calendar', visible: true },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/todo/settings', visible: true },
  { id: 'weeklyReview', label: 'Weekly Review', icon: 'ClipboardList', path: '/todo/weekly-review', visible: false },
  { id: 'taskHistory', label: 'History', icon: 'History', path: '/todo/task-history', visible: false },
  { id: 'today', label: 'Today', icon: 'CalendarDays', path: '/todo/today-view', visible: false },
  { id: 'upcoming', label: 'Upcoming', icon: 'CalendarRange', path: '/todo/upcoming', visible: false },
];

// Preload route modules on hover for instant navigation
const preloadRoutes: Record<string, () => Promise<any>> = {
  '/todo/today': () => import('@/pages/todo/Today'),
  '/todo/calendar': () => import('@/pages/todo/TodoCalendar'),
  '/todo/progress': () => import('@/pages/todo/Progress'),
  '/todo/habits': () => import('@/pages/todo/Habits'),
  '/todo/settings': () => import('@/pages/todo/TodoSettings'),
  '/todo/widgets-dashboard': () => import('@/pages/todo/WidgetsDashboard'),
  '/todo/weekly-review': () => import('@/pages/todo/WeeklyReview'),
  '/todo/task-history': () => import('@/pages/todo/TaskHistory'),
  '/todo/today-view': () => import('@/pages/todo/Today'),
  '/todo/upcoming': () => import('@/pages/todo/Upcoming'),
  '/profile': () => import('@/pages/Profile'),
};

// Hook to access todo nav items
export const useTodoNavigation = () => {
  const [navItems, setNavItems] = useState<TodoNavItem[]>(DEFAULT_TODO_NAV_ITEMS);

  useEffect(() => {
    const loadItems = async () => {
      const saved = await getSetting<TodoNavItem[] | null>('customTodoNavItems', null);
      if (saved && saved.length > 0) {
        const savedMap = new Map(saved.map(item => [item.id, item]));
        const merged = DEFAULT_TODO_NAV_ITEMS.map(defaultItem => {
          const savedItem = savedMap.get(defaultItem.id);
          return savedItem ? { ...defaultItem, ...savedItem, path: defaultItem.path } : defaultItem;
        });
        const orderedMerged = saved
          .map(s => merged.find(m => m.id === s.id))
          .filter(Boolean) as TodoNavItem[];
        merged.forEach(item => {
          if (!orderedMerged.find(o => o.id === item.id)) {
            orderedMerged.push(item);
          }
        });
        setNavItems(orderedMerged);
      }
    };
    
    loadItems();
    const handleChange = () => loadItems();
    window.addEventListener('todoNavItemsChanged', handleChange);
    return () => window.removeEventListener('todoNavItemsChanged', handleChange);
  }, []);

  return navItems;
};

export const TodoBottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const allNavItems = useTodoNavigation();
  const visibleItems = allNavItems.filter(item => item.visible);

  const getDisplayLabel = (item: TodoNavItem) => {
    return item.customLabel || t(`nav.${item.id}`, item.label);
  };

  const handlePreload = useCallback((path: string) => {
    const preloadFn = preloadRoutes[path];
    if (preloadFn) {
      preloadFn().catch(() => {});
    }
  }, []);

  const handleNavigation = useCallback((path: string) => {
    triggerNavHaptic();
    startTransition(() => {
      navigate(path, { state: { from: location.pathname } });
    });
  }, [navigate, location.pathname]);

  const gridCols = visibleItems.length <= 3 ? 'grid-cols-3' 
    : visibleItems.length === 4 ? 'grid-cols-4' 
    : 'grid-cols-5';

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
      }}
    >
      <div className={cn("grid h-14 max-w-screen-lg mx-auto px-1", gridCols)}>
        {visibleItems.map((item) => {
          const Icon = ICON_COMPONENTS[item.icon] || Home;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              type="button"
              onPointerDown={() => handlePreload(item.path)}
              onPointerUp={() => handleNavigation(item.path)}
              onMouseEnter={() => handlePreload(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 sm:gap-1 transition-colors min-w-0 px-1 touch-target touch-manipulation select-none",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={getDisplayLabel(item)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium truncate max-w-full">
                {getDisplayLabel(item)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
