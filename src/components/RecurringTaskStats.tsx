/**
 * Recurring Task Intelligence Stats Component
 * Shows streak, completion rate, weekly view, and auto-adjust suggestions
 */

import { TodoItem } from '@/types/note';
import { getCompletionRate, getWeeklyCompletionData } from '@/utils/recurringTaskIntelligence';
import { cn } from '@/lib/utils';
import { Flame, TrendingUp, SkipForward, CalendarClock, Lightbulb } from 'lucide-react';

interface RecurringTaskStatsProps {
  task: TodoItem;
}

export const RecurringTaskStats = ({ task }: RecurringTaskStatsProps) => {
  const stats = task.recurringStats;
  if (!stats || stats.completionHistory.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-xs text-muted-foreground">
          Complete this task a few times to see recurring stats
        </p>
      </div>
    );
  }

  const completionRate = getCompletionRate(stats, 30);
  const weekData = getWeeklyCompletionData(stats);
  const completionPct = Math.round(completionRate * 100);

  return (
    <div className="space-y-4">
      {/* Streak & Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard
          icon={<Flame className="h-3.5 w-3.5 text-orange-500" />}
          label="Streak"
          value={stats.currentStreak}
          highlight={stats.currentStreak >= 7}
        />
        <StatCard
          icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
          label="Best"
          value={stats.bestStreak}
        />
        <StatCard
          icon={<SkipForward className="h-3.5 w-3.5 text-amber-500" />}
          label="Skipped"
          value={stats.totalSkipped}
        />
        <StatCard
          icon={<CalendarClock className="h-3.5 w-3.5 text-blue-500" />}
          label="Deferred"
          value={stats.totalDeferred}
        />
      </div>

      {/* Completion Rate Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">30-day completion</span>
          <span className={cn(
            "text-xs font-bold",
            completionPct >= 80 ? "text-emerald-500" :
            completionPct >= 50 ? "text-amber-500" : "text-destructive"
          )}>
            {completionPct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              completionPct >= 80 ? "bg-emerald-500" :
              completionPct >= 50 ? "bg-amber-500" : "bg-destructive"
            )}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Weekly Mini Heatmap */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">This week</p>
        <div className="flex gap-1.5">
          {weekData.map((day, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className={cn(
                  "h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors",
                  day.completed
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : day.skipped
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : day.deferred
                    ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                    : "bg-muted text-muted-foreground/40"
                )}
              >
                {day.completed ? '✓' : day.skipped ? '→' : day.deferred ? '⏳' : '·'}
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5 block">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Adjust Suggestion */}
      {stats.suggestedTimeAdjustment && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-foreground/80">{stats.suggestedTimeAdjustment}</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div className={cn(
    "flex flex-col items-center gap-1 p-2 rounded-lg border",
    highlight ? "border-orange-500/30 bg-orange-500/5" : "border-border bg-muted/30"
  )}>
    {icon}
    <span className={cn("text-lg font-bold", highlight && "text-orange-500")}>{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);
