import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useHardwareBackButton } from '@/hooks/useHardwareBackButton';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { getSetting, setSetting } from '@/utils/settingsStorage';
import {
  Briefcase, BookOpen, Dumbbell, Home, Plane, Calendar, Rocket,
  GraduationCap, Heart, PartyPopper, Search, Plus, Trash2, Edit2,
  FolderPlus, ListPlus, Star, LayoutTemplate, ChevronRight, X
} from 'lucide-react';
import { TodoItem, Folder, TaskSection, Priority, ColoredTag } from '@/types/note';

// ─── Types ───

export interface ProjectTemplateSectionDef {
  name: string;
  color: string;
  tasks: ProjectTemplateTaskDef[];
}

export interface ProjectTemplateTaskDef {
  text: string;
  priority?: Priority;
  tags?: ColoredTag[];
  subtasks?: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  folderColor: string;
  sections: ProjectTemplateSectionDef[];
  isCustom?: boolean;
}

// ─── Icon map ───
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase, BookOpen, Dumbbell, Home, Plane, Calendar, Rocket,
  GraduationCap, Heart, PartyPopper, Star, LayoutTemplate, FolderPlus, ListPlus,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

// ─── Built-in templates ───

const DEFAULT_PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    icon: 'Rocket',
    description: 'Plan and execute a product launch with marketing, development, and post-launch phases',
    category: 'Work',
    folderColor: '#3b82f6',
    sections: [
      {
        name: 'Pre-Launch',
        color: '#f59e0b',
        tasks: [
          { text: 'Define target audience', priority: 'high', tags: [{ name: 'strategy', color: '#3b82f6' }] },
          { text: 'Create landing page', priority: 'high', subtasks: ['Write copy', 'Design mockups', 'Develop page', 'Set up analytics'] },
          { text: 'Prepare marketing materials', priority: 'medium' },
          { text: 'Set up social media accounts', priority: 'medium' },
          { text: 'Build email waitlist', priority: 'medium' },
        ],
      },
      {
        name: 'Launch Day',
        color: '#ef4444',
        tasks: [
          { text: 'Send launch email blast', priority: 'high' },
          { text: 'Publish social media announcements', priority: 'high' },
          { text: 'Monitor analytics dashboard', priority: 'high' },
          { text: 'Respond to early feedback', priority: 'medium' },
        ],
      },
      {
        name: 'Post-Launch',
        color: '#10b981',
        tasks: [
          { text: 'Gather user feedback', priority: 'high' },
          { text: 'Fix critical bugs', priority: 'high' },
          { text: 'Write launch retrospective', priority: 'medium' },
          { text: 'Plan next iteration', priority: 'medium' },
        ],
      },
    ],
  },
  {
    id: 'event-planning',
    name: 'Event Planning',
    icon: 'PartyPopper',
    description: 'Organize any event from start to finish with logistics, marketing, and follow-up',
    category: 'Events',
    folderColor: '#ec4899',
    sections: [
      {
        name: 'Planning',
        color: '#8b5cf6',
        tasks: [
          { text: 'Set event date and budget', priority: 'high' },
          { text: 'Book venue', priority: 'high', subtasks: ['Research venues', 'Visit shortlisted', 'Negotiate pricing', 'Sign contract'] },
          { text: 'Create guest list', priority: 'medium' },
          { text: 'Plan menu/catering', priority: 'medium' },
        ],
      },
      {
        name: 'Promotion',
        color: '#f59e0b',
        tasks: [
          { text: 'Design invitations', priority: 'medium' },
          { text: 'Send invitations', priority: 'high' },
          { text: 'Create event page', priority: 'medium' },
          { text: 'Track RSVPs', priority: 'medium' },
        ],
      },
      {
        name: 'Day-Of',
        color: '#ef4444',
        tasks: [
          { text: 'Setup and decoration', priority: 'high' },
          { text: 'Coordinate vendors', priority: 'high' },
          { text: 'Welcome guests', priority: 'high' },
          { text: 'Photography/video', priority: 'medium' },
        ],
      },
      {
        name: 'Follow-Up',
        color: '#10b981',
        tasks: [
          { text: 'Send thank you notes', priority: 'medium' },
          { text: 'Share photos', priority: 'low' },
          { text: 'Budget reconciliation', priority: 'medium' },
        ],
      },
    ],
  },
  {
    id: 'course-study',
    name: 'Course / Study Plan',
    icon: 'GraduationCap',
    description: 'Structure learning with modules, assignments, and review phases',
    category: 'Education',
    folderColor: '#8b5cf6',
    sections: [
      {
        name: 'Module 1 - Foundations',
        color: '#3b82f6',
        tasks: [
          { text: 'Read introductory material', priority: 'high', tags: [{ name: 'reading', color: '#8b5cf6' }] },
          { text: 'Watch lecture videos', priority: 'high' },
          { text: 'Complete exercises', priority: 'medium' },
          { text: 'Take notes', priority: 'medium' },
        ],
      },
      {
        name: 'Module 2 - Deep Dive',
        color: '#10b981',
        tasks: [
          { text: 'Study advanced topics', priority: 'high' },
          { text: 'Practice problems', priority: 'high' },
          { text: 'Group discussion', priority: 'medium' },
        ],
      },
      {
        name: 'Review & Exam',
        color: '#f59e0b',
        tasks: [
          { text: 'Review all notes', priority: 'high' },
          { text: 'Practice past exams', priority: 'high' },
          { text: 'Final revision', priority: 'high' },
        ],
      },
    ],
  },
  {
    id: 'fitness-program',
    name: 'Fitness Program',
    icon: 'Dumbbell',
    description: '12-week fitness plan with workout phases and nutrition tracking',
    category: 'Health',
    folderColor: '#ef4444',
    sections: [
      {
        name: 'Week 1-4: Foundation',
        color: '#10b981',
        tasks: [
          { text: 'Set fitness goals', priority: 'high', tags: [{ name: 'fitness', color: '#ef4444' }] },
          { text: 'Body measurements', priority: 'medium' },
          { text: 'Plan meal prep schedule', priority: 'medium', subtasks: ['Calculate macros', 'Create meal plan', 'Grocery list'] },
          { text: 'Start beginner workouts', priority: 'high' },
        ],
      },
      {
        name: 'Week 5-8: Build',
        color: '#f59e0b',
        tasks: [
          { text: 'Increase workout intensity', priority: 'high' },
          { text: 'Mid-program measurements', priority: 'medium' },
          { text: 'Adjust nutrition plan', priority: 'medium' },
        ],
      },
      {
        name: 'Week 9-12: Peak',
        color: '#ef4444',
        tasks: [
          { text: 'Advanced workouts', priority: 'high' },
          { text: 'Final measurements', priority: 'medium' },
          { text: 'Set next program goals', priority: 'medium' },
        ],
      },
    ],
  },
  {
    id: 'home-renovation',
    name: 'Home Renovation',
    icon: 'Home',
    description: 'Plan a home renovation with budgeting, contractors, and timeline tracking',
    category: 'Personal',
    folderColor: '#f59e0b',
    sections: [
      {
        name: 'Planning & Budget',
        color: '#3b82f6',
        tasks: [
          { text: 'Set renovation budget', priority: 'high' },
          { text: 'Get contractor quotes', priority: 'high', subtasks: ['Research contractors', 'Schedule visits', 'Compare quotes'] },
          { text: 'Create design plan', priority: 'high' },
          { text: 'Get permits if needed', priority: 'high' },
        ],
      },
      {
        name: 'Execution',
        color: '#f59e0b',
        tasks: [
          { text: 'Order materials', priority: 'high' },
          { text: 'Schedule work timeline', priority: 'high' },
          { text: 'Supervise construction', priority: 'medium' },
          { text: 'Weekly progress review', priority: 'medium' },
        ],
      },
      {
        name: 'Finishing',
        color: '#10b981',
        tasks: [
          { text: 'Final inspection', priority: 'high' },
          { text: 'Touch-ups and fixes', priority: 'medium' },
          { text: 'Cleaning', priority: 'medium' },
          { text: 'Before/after photos', priority: 'low' },
        ],
      },
    ],
  },
  {
    id: 'travel-planning',
    name: 'Trip Planning',
    icon: 'Plane',
    description: 'Plan your trip with booking, packing, and itinerary phases',
    category: 'Travel',
    folderColor: '#0ea5e9',
    sections: [
      {
        name: 'Booking',
        color: '#3b82f6',
        tasks: [
          { text: 'Book flights', priority: 'high', tags: [{ name: 'travel', color: '#0ea5e9' }] },
          { text: 'Reserve accommodation', priority: 'high' },
          { text: 'Get travel insurance', priority: 'medium' },
          { text: 'Check visa requirements', priority: 'high' },
        ],
      },
      {
        name: 'Preparation',
        color: '#f59e0b',
        tasks: [
          { text: 'Create packing list', priority: 'medium', subtasks: ['Clothes', 'Toiletries', 'Electronics', 'Documents'] },
          { text: 'Plan daily itinerary', priority: 'medium' },
          { text: 'Download offline maps', priority: 'low' },
          { text: 'Exchange currency', priority: 'medium' },
        ],
      },
      {
        name: 'Day Before',
        color: '#ef4444',
        tasks: [
          { text: 'Pack bags', priority: 'high' },
          { text: 'Check in online', priority: 'high' },
          { text: 'Charge devices', priority: 'medium' },
          { text: 'Set out-of-office reply', priority: 'low' },
        ],
      },
    ],
  },
  {
    id: 'weekly-sprint',
    name: 'Weekly Sprint',
    icon: 'Calendar',
    description: 'Agile-style weekly sprint with planning, execution, and review',
    category: 'Work',
    folderColor: '#6366f1',
    sections: [
      {
        name: 'Sprint Planning',
        color: '#3b82f6',
        tasks: [
          { text: 'Review backlog', priority: 'high' },
          { text: 'Define sprint goals', priority: 'high' },
          { text: 'Assign tasks', priority: 'medium' },
          { text: 'Estimate effort', priority: 'medium' },
        ],
      },
      {
        name: 'In Progress',
        color: '#f59e0b',
        tasks: [
          { text: 'Daily standups', priority: 'high' },
          { text: 'Feature development', priority: 'high' },
          { text: 'Code review', priority: 'medium' },
        ],
      },
      {
        name: 'Sprint Review',
        color: '#10b981',
        tasks: [
          { text: 'Demo completed work', priority: 'high' },
          { text: 'Sprint retrospective', priority: 'medium' },
          { text: 'Update documentation', priority: 'low' },
        ],
      },
    ],
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    icon: 'BookOpen',
    description: 'Plan and track content creation across platforms',
    category: 'Work',
    folderColor: '#ec4899',
    sections: [
      {
        name: 'Ideas & Research',
        color: '#8b5cf6',
        tasks: [
          { text: 'Brainstorm content topics', priority: 'high', tags: [{ name: 'content', color: '#ec4899' }] },
          { text: 'Research trending topics', priority: 'medium' },
          { text: 'Competitor analysis', priority: 'low' },
        ],
      },
      {
        name: 'Creation',
        color: '#3b82f6',
        tasks: [
          { text: 'Write blog post', priority: 'high', subtasks: ['Outline', 'Draft', 'Edit', 'Add images'] },
          { text: 'Create social media graphics', priority: 'medium' },
          { text: 'Record video/podcast', priority: 'medium' },
        ],
      },
      {
        name: 'Publishing',
        color: '#10b981',
        tasks: [
          { text: 'Schedule posts', priority: 'high' },
          { text: 'Cross-promote on platforms', priority: 'medium' },
          { text: 'Monitor engagement', priority: 'medium' },
          { text: 'Analyze performance', priority: 'low' },
        ],
      },
    ],
  },
];

const CATEGORIES = [...new Set(DEFAULT_PROJECT_TEMPLATES.map(t => t.category))];

const FOLDER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#6366f1'];

// ─── Props ───

interface ProjectTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (data: {
    folder: Omit<Folder, 'id' | 'createdAt'>;
    sections: Omit<TaskSection, 'id'>[];
    tasks: { sectionIndex: number; task: Omit<TodoItem, 'id' | 'completed'> }[];
  }) => void;
}

// ─── Component ───

export const ProjectTemplateSheet = ({ isOpen, onClose, onApplyTemplate }: ProjectTemplateSheetProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<ProjectTemplate[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Star');
  const [formFolderColor, setFormFolderColor] = useState(FOLDER_COLORS[0]);
  const [formSections, setFormSections] = useState<{ name: string; color: string; tasks: string }[]>([
    { name: 'To Do', color: '#3b82f6', tasks: '' },
    { name: 'In Progress', color: '#f59e0b', tasks: '' },
    { name: 'Done', color: '#10b981', tasks: '' },
  ]);

  useHardwareBackButton({ onBack: onClose, enabled: isOpen, priority: 'sheet' });

  useEffect(() => {
    getSetting<ProjectTemplate[]>('customProjectTemplates', []).then(setCustomTemplates);
  }, []);

  const allTemplates = [...DEFAULT_PROJECT_TEMPLATES, ...customTemplates];

  const filteredTemplates = allTemplates.filter(t => {
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped = filteredTemplates.reduce((acc, t) => {
    const cat = t.isCustom ? 'My Templates' : t.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<string, ProjectTemplate[]>);

  const handleApply = (template: ProjectTemplate) => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});

    const sectionDefs = template.sections.map((s, i) => ({
      name: s.name,
      color: s.color,
      isCollapsed: false,
      order: i,
    }));

    const taskDefs = template.sections.flatMap((s, sIdx) =>
      s.tasks.map(task => ({
        sectionIndex: sIdx,
        task: {
          text: task.text,
          priority: task.priority,
          coloredTags: task.tags,
          subtasks: task.subtasks?.map((st, j) => ({
            id: `sub-${Date.now()}-${sIdx}-${j}`,
            text: st,
            completed: false,
          })) as TodoItem[] | undefined,
        },
      }))
    );

    onApplyTemplate({
      folder: { name: template.name, color: template.folderColor, isDefault: false, isFavorite: true },
      sections: sectionDefs,
      tasks: taskDefs,
    });

    toast.success(`Project "${template.name}" created!`, { icon: '📁' });
    onClose();
  };

  const getIcon = (iconName: string) => ICON_MAP[iconName] || Star;

  const totalTasks = (t: ProjectTemplate) => t.sections.reduce((sum, s) => sum + s.tasks.length, 0);

  // Save custom template
  const handleSaveCustom = () => {
    if (!formName.trim()) return;
    const newTemplate: ProjectTemplate = {
      id: `custom-proj-${Date.now()}`,
      name: formName.trim(),
      icon: formIcon,
      description: formDescription.trim(),
      category: 'Custom',
      folderColor: formFolderColor,
      isCustom: true,
      sections: formSections.filter(s => s.name.trim()).map(s => ({
        name: s.name.trim(),
        color: s.color,
        tasks: s.tasks.split('\n').filter(l => l.trim()).map(l => ({ text: l.trim(), priority: 'medium' as Priority })),
      })),
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    setSetting('customProjectTemplates', updated);
    setShowCreateDialog(false);
    toast.success('Template saved!');
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    setSetting('customProjectTemplates', updated);
    toast.success('Template deleted');
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-0">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Project Templates
            </SheetTitle>
          </SheetHeader>

          <div className="px-5 pb-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors",
                  !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors",
                    selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
              {customTemplates.length > 0 && (
                <button
                  onClick={() => setSelectedCategory('Custom')}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors",
                    selectedCategory === 'Custom' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  My Templates
                </button>
              )}
            </div>
          </div>

          {/* Template list */}
          <ScrollArea className="h-[50vh] px-5">
            <div className="space-y-5 pb-6">
              {Object.entries(grouped).map(([category, templates]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</h3>
                  <div className="space-y-2">
                    {templates.map(template => {
                      const Icon = getIcon(template.icon);
                      return (
                        <button
                          key={template.id}
                          onClick={() => setPreviewTemplate(template)}
                          className="w-full text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: template.folderColor + '20' }}
                            >
                              <Icon className="h-5 w-5" style={{ color: template.folderColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{template.name}</span>
                                {template.isCustom && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Custom</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{template.description}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] text-muted-foreground">{template.sections.length} sections</span>
                                <span className="text-[11px] text-muted-foreground">{totalTasks(template)} tasks</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 mt-1 flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <LayoutTemplate className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No templates found</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Create custom button */}
          <div className="px-5 py-3 border-t">
            <Button variant="outline" className="w-full" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Template
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview / Apply Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          {previewTemplate && (() => {
            const Icon = getIcon(previewTemplate.icon);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: previewTemplate.folderColor + '20' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: previewTemplate.folderColor }} />
                    </div>
                    {previewTemplate.name}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>

                <ScrollArea className="flex-1 max-h-[45vh]">
                  <div className="space-y-4 pr-2">
                    {previewTemplate.sections.map((section, sIdx) => (
                      <div key={sIdx}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
                          <span className="text-sm font-medium">{section.name}</span>
                          <Badge variant="secondary" className="text-[10px] ml-auto">{section.tasks.length}</Badge>
                        </div>
                        <div className="space-y-1 ml-5">
                          {section.tasks.map((task, tIdx) => (
                            <div key={tIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mt-1.5 flex-shrink-0" />
                              <span>{task.text}</span>
                              {task.subtasks && (
                                <Badge variant="outline" className="text-[9px] ml-auto flex-shrink-0">
                                  +{task.subtasks.length}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 pt-2">
                  {previewTemplate.isCustom && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleDeleteCustom(previewTemplate.id);
                        setPreviewTemplate(null);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                  <Button className="flex-1" onClick={() => handleApply(previewTemplate)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create Custom Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Project Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My Project" />
            </div>

            <div>
              <Label>Description</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description..." />
            </div>

            <div>
              <Label className="mb-2 block">Icon</Label>
              <div className="flex gap-2 flex-wrap">
                {ICON_OPTIONS.map(name => {
                  const Ic = ICON_MAP[name];
                  return (
                    <button
                      key={name}
                      onClick={() => setFormIcon(name)}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center border transition-colors",
                        formIcon === name ? "border-primary bg-primary/10" : "border-border"
                      )}
                    >
                      <Ic className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Folder Color</Label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormFolderColor(color)}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: formFolderColor === color ? 'white' : 'transparent',
                      boxShadow: formFolderColor === color ? `0 0 0 2px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Sections & Tasks</Label>
              <p className="text-xs text-muted-foreground mb-3">Add sections with their tasks (one task per line)</p>
              <div className="space-y-3">
                {formSections.map((section, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={section.name}
                        onChange={(e) => {
                          const updated = [...formSections];
                          updated[idx].name = e.target.value;
                          setFormSections(updated);
                        }}
                        placeholder={`Section ${idx + 1}`}
                        className="flex-1 h-8 text-sm"
                      />
                      {formSections.length > 1 && (
                        <button
                          onClick={() => setFormSections(formSections.filter((_, i) => i !== idx))}
                          className="p-1 hover:bg-destructive/10 rounded"
                        >
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                    <Textarea
                      value={section.tasks}
                      onChange={(e) => {
                        const updated = [...formSections];
                        updated[idx].tasks = e.target.value;
                        setFormSections(updated);
                      }}
                      placeholder="Task 1&#10;Task 2&#10;Task 3"
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormSections([...formSections, { name: '', color: FOLDER_COLORS[formSections.length % FOLDER_COLORS.length], tasks: '' }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Section
                </Button>
              </div>
            </div>

            <Button onClick={handleSaveCustom} disabled={!formName.trim()} className="w-full">
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
