import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hourglass, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { loadTodoItems } from '@/utils/todoItemsStorage';
import { TodoItem } from '@/types/note';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

interface TaskEffortData {
  name: string;
  estimated: number;
  actual: number;
}

export const EffortComparisonWidget = () => {
  const [chartData, setChartData] = useState<TaskEffortData[]>([]);
  const [summary, setSummary] = useState({ totalEstimated: 0, totalActual: 0, taskCount: 0 });

  useEffect(() => {
    const loadData = async () => {
      const tasks = await loadTodoItems();

      // Find tasks with both estimation and time tracking
      const tasksWithBoth = tasks.filter(
        (t: TodoItem) => t.estimatedHours && t.timeTracking && t.timeTracking.totalSeconds > 0
      );

      if (tasksWithBoth.length === 0) {
        setChartData([]);
        setSummary({ totalEstimated: 0, totalActual: 0, taskCount: 0 });
        return;
      }

      // Take last 8 tasks for chart
      const recent = tasksWithBoth.slice(-8);
      const data = recent.map((t: TodoItem) => ({
        name: t.text.length > 12 ? t.text.substring(0, 12) + '…' : t.text,
        estimated: t.estimatedHours!,
        actual: parseFloat((t.timeTracking!.totalSeconds / 3600).toFixed(1)),
      }));

      const totalEstimated = tasksWithBoth.reduce((sum: number, t: TodoItem) => sum + (t.estimatedHours || 0), 0);
      const totalActual = tasksWithBoth.reduce((sum: number, t: TodoItem) => sum + ((t.timeTracking?.totalSeconds || 0) / 3600), 0);

      setChartData(data);
      setSummary({
        totalEstimated: parseFloat(totalEstimated.toFixed(1)),
        totalActual: parseFloat(totalActual.toFixed(1)),
        taskCount: tasksWithBoth.length,
      });
    };

    loadData();
    window.addEventListener('tasksUpdated', loadData);
    return () => window.removeEventListener('tasksUpdated', loadData);
  }, []);

  if (summary.taskCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-5 border shadow-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <Hourglass className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Effort Estimation</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Add effort estimates and track time on tasks to see estimated vs actual comparisons here.
        </p>
      </motion.div>
    );
  }

  const accuracy = summary.totalEstimated > 0
    ? Math.round((summary.totalActual / summary.totalEstimated) * 100)
    : 0;
  const isOver = accuracy > 100;
  const isClose = accuracy >= 80 && accuracy <= 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-5 border shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2">
        <Hourglass className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">Estimated vs Actual</h3>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{summary.totalEstimated}h</p>
          <p className="text-[10px] text-muted-foreground">Estimated</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{summary.totalActual}h</p>
          <p className="text-[10px] text-muted-foreground">Actual</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            {isClose ? (
              <Minus className="h-4 w-4 text-success" />
            ) : isOver ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-info" />
            )}
            <p className={cn(
              "text-lg font-bold",
              isClose ? "text-success" : isOver ? "text-destructive" : "text-info"
            )}>
              {accuracy}%
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">Accuracy</p>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={25}
                unit="h"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [`${value}h`, name === 'estimated' ? 'Estimated' : 'Actual']}
              />
              <Bar dataKey="estimated" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.5} />
              <Bar dataKey="actual" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.actual > entry.estimated ? 'hsl(var(--destructive))' : 'hsl(var(--success))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Based on {summary.taskCount} task{summary.taskCount !== 1 ? 's' : ''} with both estimates and time tracking
      </p>
    </motion.div>
  );
};
