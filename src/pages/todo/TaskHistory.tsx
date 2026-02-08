import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TodoItem } from '@/types/note';
import { TodoLayout } from './TodoLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  History, CheckCircle2, Repeat, Calendar, Clock, ArrowUpDown,
  Archive, ArchiveRestore, Trash2, MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { loadTodoItems, saveTodoItems } from '@/utils/todoItemsStorage';
import { loadArchivedTasks, unarchiveTasks, deleteArchivedTasks, clearAllArchivedTasks } from '@/utils/taskCleanup';
import { getRepeatLabel } from '@/utils/recurringTasks';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { 
  format, isToday, isYesterday, isThisWeek, isThisMonth
} from 'date-fns';

type ViewType = 'completed' | 'archived';
type FilterType = 'all' | 'recurring' | 'today' | 'week' | 'month';
type SortType = 'newest' | 'oldest' | 'name';

const TaskHistory = () => {
  const { t } = useTranslation();
  const [activeItems, setActiveItems] = useState<TodoItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<TodoItem[]>([]);
  const [view, setView] = useState<ViewType>('completed');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const loadData = useCallback(async () => {
    const [active, archived] = await Promise.all([loadTodoItems(), loadArchivedTasks()]);
    setActiveItems(active);
    setArchivedItems(archived);
  }, []);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('tasksUpdated', handler);
    return () => window.removeEventListener('tasksUpdated', handler);
  }, [loadData]);

  const sourceItems = view === 'completed'
    ? activeItems.filter(t => t.completed)
    : archivedItems;

  const filteredTasks = useMemo(() => {
    let filtered = [...sourceItems];

    switch (filter) {
      case 'recurring':
        filtered = filtered.filter(t => t.repeatType && t.repeatType !== 'none');
        break;
      case 'today':
        filtered = filtered.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
        break;
      case 'week':
        filtered = filtered.filter(t => t.dueDate && isThisWeek(new Date(t.dueDate)));
        break;
      case 'month':
        filtered = filtered.filter(t => t.dueDate && isThisMonth(new Date(t.dueDate)));
        break;
    }

    filtered.sort((a, b) => {
      const getTime = (t: TodoItem) => {
        if (t.completedAt) return new Date(t.completedAt).getTime();
        if (t.dueDate) return new Date(t.dueDate).getTime();
        return parseInt(t.id) || 0;
      };
      switch (sortBy) {
        case 'newest': return getTime(b) - getTime(a);
        case 'oldest': return getTime(a) - getTime(b);
        case 'name': return a.text.localeCompare(b.text);
        default: return 0;
      }
    });

    return filtered;
  }, [sourceItems, filter, sortBy]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, TodoItem[]> = {};
    filteredTasks.forEach(task => {
      const date = task.completedAt ? new Date(task.completedAt) 
        : task.dueDate ? new Date(task.dueDate) 
        : new Date(parseInt(task.id) || Date.now());
      let key: string;
      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      else if (isThisWeek(date)) key = 'This Week';
      else if (isThisMonth(date)) key = 'This Month';
      else key = format(date, 'MMMM yyyy');
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const handleUnarchive = async (taskId: string) => {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    const restored = await unarchiveTasks([taskId]);
    if (restored.length > 0) {
      const current = await loadTodoItems();
      await saveTodoItems([...restored, ...current]);
      window.dispatchEvent(new CustomEvent('tasksUpdated'));
      toast.success('Task restored!', { icon: '↩️' });
    }
    await loadData();
  };

  const handleDeleteArchived = async (taskId: string) => {
    await deleteArchivedTasks([taskId]);
    toast.success('Permanently deleted');
    await loadData();
  };

  const handleClearAll = async () => {
    const count = await clearAllArchivedTasks();
    toast.success(`Cleared ${count} archived tasks`);
    setConfirmClearAll(false);
    await loadData();
  };

  const formatTaskDate = (task: TodoItem): string => {
    const date = task.completedAt ? new Date(task.completedAt)
      : task.dueDate ? new Date(task.dueDate) 
      : new Date(parseInt(task.id) || Date.now());
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday ' + format(date, 'h:mm a');
    return format(date, 'MMM d, h:mm a');
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-orange-500 bg-orange-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <TodoLayout title="Task History">
      <main className="container mx-auto px-4 py-6 pb-32">
        <div className="max-w-lg mx-auto space-y-4">
          {/* View Toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="completed" className="text-xs flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed ({activeItems.filter(t => t.completed).length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="text-xs flex items-center gap-1.5">
                <Archive className="h-3.5 w-3.5" />
                Archived ({archivedItems.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="recurring" className="text-xs">Recurring</TabsTrigger>
              <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
              <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sort & Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {view === 'archived' ? (
                <Archive className="h-4 w-4 text-primary" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <span>{filteredTasks.length} tasks</span>
            </div>
            <div className="flex items-center gap-1">
              {view === 'archived' && archivedItems.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmClearAll(true)} className="text-destructive text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear All
                </Button>
              )}
              <Button 
                variant="ghost" size="sm"
                onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'name' : 'newest')}
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {sortBy === 'newest' ? t('taskHistory.newest') : sortBy === 'oldest' ? t('taskHistory.oldest') : t('taskHistory.alphabetical')}
              </Button>
            </div>
          </div>

          {/* Task List */}
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([groupName, tasks]) => (
                <div key={groupName}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {groupName}
                    <Badge variant="secondary" className="ml-auto">{tasks.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <Card key={task.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {view === 'archived' ? (
                              <Archive className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-medium", view === 'completed' && "line-through text-muted-foreground")}>{task.text}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTaskDate(task)}
                                </span>
                                {task.priority && task.priority !== 'none' && (
                                  <Badge className={cn("text-[10px] px-1.5", getPriorityColor(task.priority))}>
                                    {task.priority}
                                  </Badge>
                                )}
                                {task.repeatType && task.repeatType !== 'none' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5">
                                    <Repeat className="h-2.5 w-2.5 mr-1" />
                                    {getRepeatLabel(task.repeatType, task.repeatDays, task.advancedRepeat)}
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                              )}
                            </div>
                            {view === 'archived' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleUnarchive(task.id)}>
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Restore Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteArchived(task.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Permanently
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  {view === 'archived' ? (
                    <>
                      <Archive className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="font-medium text-lg mb-1">No archived tasks</h3>
                      <p className="text-sm text-muted-foreground">
                        Completed tasks are automatically archived after 3 days
                      </p>
                    </>
                  ) : (
                    <>
                      <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="font-medium text-lg mb-1">No completed tasks</h3>
                      <p className="text-sm text-muted-foreground">Complete some tasks to see them here</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>

      {/* Confirm Clear All */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Archived Tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {archivedItems.length} archived tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TodoLayout>
  );
};

export default TaskHistory;
