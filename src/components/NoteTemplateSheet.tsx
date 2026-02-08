import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useHardwareBackButton } from '@/hooks/useHardwareBackButton';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';
import { getSetting, setSetting } from '@/utils/settingsStorage';
import {
  BookOpen, Briefcase, GraduationCap, Heart, Utensils, FileText,
  Search, Plus, Trash2, ChevronRight, X, Star, LayoutTemplate,
  Notebook, Receipt, Calendar, Lightbulb, Globe, Dumbbell
} from 'lucide-react';
import { Note, NoteType, Folder } from '@/types/note';

// ─── Types ───

export interface NoteTemplateDef {
  title: string;
  type: NoteType;
  content: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  folderColor: string;
  notes: NoteTemplateDef[];
  isCustom?: boolean;
}

// ─── Icon map ───
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Briefcase, GraduationCap, Heart, Utensils, FileText,
  Star, LayoutTemplate, Notebook, Receipt, Calendar, Lightbulb, Globe, Dumbbell,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

// ─── Built-in templates ───

const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting-pack',
    name: 'Meeting Notes Pack',
    icon: 'Calendar',
    description: 'Ready-to-use meeting notes with agenda, action items, and follow-up templates',
    category: 'Work',
    folderColor: '#3b82f6',
    notes: [
      {
        title: 'Weekly Team Standup',
        type: 'regular',
        content: `<h2>Weekly Team Standup</h2>
<p><strong>Date:</strong> [Enter date]</p>
<p><strong>Attendees:</strong> [Team members]</p>
<hr/>
<h3>📋 Agenda</h3>
<ul><li>Progress updates from each team member</li><li>Blockers and challenges</li><li>Upcoming priorities</li></ul>
<h3>🗒️ Discussion Notes</h3>
<table><thead><tr><th>Person</th><th>Update</th><th>Blockers</th></tr></thead><tbody><tr><td>Member 1</td><td></td><td></td></tr><tr><td>Member 2</td><td></td><td></td></tr><tr><td>Member 3</td><td></td><td></td></tr></tbody></table>
<h3>✅ Action Items</h3>
<ul><li><strong>[Person]</strong> — Task description — <em>Due: [date]</em></li><li><strong>[Person]</strong> — Task description — <em>Due: [date]</em></li></ul>
<h3>📅 Next Meeting</h3>
<p>Date: [Next meeting date] | Time: [Time]</p>`,
      },
      {
        title: 'Client Meeting Notes',
        type: 'regular',
        content: `<h2>Client Meeting Notes</h2>
<p><strong>Client:</strong> [Client Name]</p>
<p><strong>Date:</strong> [Enter date] | <strong>Duration:</strong> [Duration]</p>
<hr/>
<h3>🎯 Objectives</h3>
<ol><li>Discuss project progress</li><li>Review deliverables</li><li>Address client feedback</li></ol>
<h3>📝 Key Discussions</h3>
<p>[Summarize key points discussed during the meeting]</p>
<h3>💡 Client Feedback</h3>
<blockquote><p>"[Insert client feedback or quotes here]"</p></blockquote>
<h3>📊 Deliverables Status</h3>
<table><thead><tr><th>Deliverable</th><th>Status</th><th>ETA</th><th>Notes</th></tr></thead><tbody><tr><td>Design mockups</td><td>✅ Complete</td><td>-</td><td></td></tr><tr><td>Development</td><td>🔄 In Progress</td><td>[Date]</td><td></td></tr><tr><td>Testing</td><td>⏳ Pending</td><td>[Date]</td><td></td></tr></tbody></table>
<h3>🔜 Next Steps</h3>
<ul><li>Follow up on feedback by [date]</li><li>Send updated proposal</li><li>Schedule next check-in</li></ul>`,
      },
      {
        title: 'Meeting Follow-Up Email Draft',
        type: 'regular',
        content: `<h2>Meeting Follow-Up Email</h2>
<p><strong>To:</strong> [Recipients]</p>
<p><strong>Subject:</strong> Follow-up: [Meeting Topic] - [Date]</p>
<hr/>
<p>Hi [Name],</p>
<p>Thank you for taking the time to meet today. Here's a summary of what we discussed:</p>
<h3>Key Takeaways</h3>
<ol><li>[Point 1]</li><li>[Point 2]</li><li>[Point 3]</li></ol>
<h3>Action Items</h3>
<table><thead><tr><th>Owner</th><th>Action</th><th>Deadline</th></tr></thead><tbody><tr><td>[Name]</td><td>[Task]</td><td>[Date]</td></tr><tr><td>[Name]</td><td>[Task]</td><td>[Date]</td></tr></tbody></table>
<p>Please let me know if I've missed anything. Looking forward to our next meeting on [date].</p>
<p>Best regards,<br/>[Your Name]</p>`,
      },
    ],
  },
  {
    id: 'study-notes',
    name: 'Study Notes Collection',
    icon: 'GraduationCap',
    description: 'Cornell notes, flashcard lists, and study planners for effective learning',
    category: 'Education',
    folderColor: '#8b5cf6',
    notes: [
      {
        title: 'Cornell Notes Template',
        type: 'regular',
        content: `<h2>📖 Cornell Notes</h2>
<p><strong>Subject:</strong> [Subject Name] | <strong>Date:</strong> [Date] | <strong>Topic:</strong> [Topic]</p>
<hr/>
<table><thead><tr><th style="width:30%">Cue / Questions</th><th style="width:70%">Notes</th></tr></thead><tbody>
<tr><td><strong>Key concept 1?</strong></td><td>Detailed notes about this concept go here. Include examples, definitions, and important details.</td></tr>
<tr><td><strong>Key concept 2?</strong></td><td>More detailed notes. Use bullet points for clarity:<br/>• Point A<br/>• Point B<br/>• Point C</td></tr>
<tr><td><strong>Key concept 3?</strong></td><td>Additional notes with supporting evidence and examples.</td></tr>
</tbody></table>
<hr/>
<h3>📝 Summary</h3>
<p>[Write a 3-5 sentence summary of the main ideas from this lecture/reading in your own words]</p>
<h3>❓ Questions for Review</h3>
<ul><li>What are the main differences between [concept A] and [concept B]?</li><li>How does [concept] apply to [real-world scenario]?</li></ul>`,
      },
      {
        title: 'Study Planner',
        type: 'regular',
        content: `<h2>📅 Study Planner</h2>
<p><strong>Exam/Goal:</strong> [Exam name] | <strong>Date:</strong> [Exam date]</p>
<hr/>
<h3>📚 Subjects & Topics</h3>
<table><thead><tr><th>Subject</th><th>Topics to Cover</th><th>Priority</th><th>Status</th></tr></thead><tbody>
<tr><td>Subject 1</td><td>Topic A, Topic B</td><td>🔴 High</td><td>⏳ Not Started</td></tr>
<tr><td>Subject 2</td><td>Topic C, Topic D</td><td>🟡 Medium</td><td>🔄 In Progress</td></tr>
<tr><td>Subject 3</td><td>Topic E</td><td>🟢 Low</td><td>✅ Done</td></tr>
</tbody></table>
<h3>📆 Weekly Schedule</h3>
<table><thead><tr><th>Day</th><th>Morning</th><th>Afternoon</th><th>Evening</th></tr></thead><tbody>
<tr><td><strong>Monday</strong></td><td>Subject 1</td><td>Subject 2</td><td>Review</td></tr>
<tr><td><strong>Tuesday</strong></td><td>Subject 3</td><td>Practice</td><td>Subject 1</td></tr>
<tr><td><strong>Wednesday</strong></td><td>Subject 2</td><td>Subject 3</td><td>Review</td></tr>
</tbody></table>
<h3>🏆 Study Goals</h3>
<ul><li>Complete all practice problems by [date]</li><li>Review weak areas daily</li><li>Do at least 2 mock tests</li></ul>`,
      },
      {
        title: 'Flashcard List',
        type: 'regular',
        content: `<h2>🃏 Flashcard Review List</h2>
<p><strong>Subject:</strong> [Subject] | <strong>Chapter:</strong> [Chapter]</p>
<hr/>
<table><thead><tr><th style="width:40%">Term / Question</th><th style="width:40%">Answer / Definition</th><th style="width:20%">Confidence</th></tr></thead><tbody>
<tr><td><strong>Term 1</strong></td><td>Definition or answer for term 1</td><td>⭐⭐⭐</td></tr>
<tr><td><strong>Term 2</strong></td><td>Definition or answer for term 2</td><td>⭐⭐</td></tr>
<tr><td><strong>Term 3</strong></td><td>Definition or answer for term 3</td><td>⭐</td></tr>
<tr><td><strong>Term 4</strong></td><td>Definition or answer for term 4</td><td>⭐⭐⭐</td></tr>
</tbody></table>
<h3>📊 Review Progress</h3>
<p>⭐ = Need more practice | ⭐⭐ = Getting there | ⭐⭐⭐ = Confident</p>`,
      },
    ],
  },
  {
    id: 'project-docs',
    name: 'Project Documentation',
    icon: 'Briefcase',
    description: 'PRD, project brief, and retrospective templates for project management',
    category: 'Work',
    folderColor: '#10b981',
    notes: [
      {
        title: 'Project Brief',
        type: 'regular',
        content: `<h2>📋 Project Brief</h2>
<p><strong>Project Name:</strong> [Project Name]</p>
<p><strong>Owner:</strong> [Your Name] | <strong>Start Date:</strong> [Date] | <strong>Target Completion:</strong> [Date]</p>
<hr/>
<h3>🎯 Objective</h3>
<p>[Clearly state what this project aims to achieve in 2-3 sentences]</p>
<h3>📊 Scope</h3>
<table><thead><tr><th>In Scope</th><th>Out of Scope</th></tr></thead><tbody>
<tr><td>Feature/task 1</td><td>Feature not included</td></tr>
<tr><td>Feature/task 2</td><td>Future enhancement</td></tr>
<tr><td>Feature/task 3</td><td>Different project</td></tr>
</tbody></table>
<h3>👥 Stakeholders</h3>
<table><thead><tr><th>Name</th><th>Role</th><th>Responsibility</th></tr></thead><tbody>
<tr><td>[Name]</td><td>Project Lead</td><td>Overall direction</td></tr>
<tr><td>[Name]</td><td>Designer</td><td>UI/UX design</td></tr>
<tr><td>[Name]</td><td>Developer</td><td>Implementation</td></tr>
</tbody></table>
<h3>📅 Key Milestones</h3>
<ol><li><strong>[Date]</strong> — Milestone 1 description</li><li><strong>[Date]</strong> — Milestone 2 description</li><li><strong>[Date]</strong> — Launch / delivery</li></ol>
<h3>⚠️ Risks & Mitigations</h3>
<ul><li><strong>Risk:</strong> [Description] → <strong>Mitigation:</strong> [Plan]</li></ul>`,
      },
      {
        title: 'Product Requirements Document',
        type: 'regular',
        content: `<h2>📄 Product Requirements Document (PRD)</h2>
<p><strong>Feature:</strong> [Feature Name] | <strong>Version:</strong> 1.0 | <strong>Author:</strong> [Name]</p>
<hr/>
<h3>Problem Statement</h3>
<p>[Describe the problem this feature solves. Who experiences it? How often?]</p>
<h3>Proposed Solution</h3>
<p>[High-level description of the solution]</p>
<h3>User Stories</h3>
<table><thead><tr><th>As a...</th><th>I want to...</th><th>So that...</th><th>Priority</th></tr></thead><tbody>
<tr><td>User</td><td>[action]</td><td>[benefit]</td><td>P0</td></tr>
<tr><td>Admin</td><td>[action]</td><td>[benefit]</td><td>P1</td></tr>
</tbody></table>
<h3>Success Metrics</h3>
<ul><li>Metric 1: [Target]</li><li>Metric 2: [Target]</li></ul>
<h3>Technical Considerations</h3>
<p>[Any technical constraints, dependencies, or architecture notes]</p>`,
      },
      {
        title: 'Project Retrospective',
        type: 'regular',
        content: `<h2>🔄 Project Retrospective</h2>
<p><strong>Project:</strong> [Name] | <strong>Date:</strong> [Date] | <strong>Duration:</strong> [Timeline]</p>
<hr/>
<h3>✅ What Went Well</h3>
<ul><li>[Success point 1]</li><li>[Success point 2]</li><li>[Success point 3]</li></ul>
<h3>❌ What Could Be Improved</h3>
<ul><li>[Improvement area 1]</li><li>[Improvement area 2]</li></ul>
<h3>📊 Key Metrics</h3>
<table><thead><tr><th>Metric</th><th>Target</th><th>Actual</th><th>Status</th></tr></thead><tbody>
<tr><td>Delivery Date</td><td>[Date]</td><td>[Date]</td><td>✅ On Time</td></tr>
<tr><td>Budget</td><td>[Amount]</td><td>[Amount]</td><td>🟡 Over</td></tr>
<tr><td>Quality Score</td><td>[Score]</td><td>[Score]</td><td>✅ Met</td></tr>
</tbody></table>
<h3>💡 Lessons Learned</h3>
<ol><li>[Key lesson 1]</li><li>[Key lesson 2]</li></ol>
<h3>🔜 Action Items for Next Project</h3>
<ul><li>[Action 1]</li><li>[Action 2]</li></ul>`,
      },
    ],
  },
  {
    id: 'recipe-collection',
    name: 'Recipe Collection',
    icon: 'Utensils',
    description: 'Beautifully structured recipe cards with ingredients tables and step-by-step instructions',
    category: 'Personal',
    folderColor: '#f59e0b',
    notes: [
      {
        title: 'Classic Pasta Recipe',
        type: 'regular',
        content: `<h2>🍝 Classic Garlic Butter Pasta</h2>
<p><strong>Prep Time:</strong> 10 min | <strong>Cook Time:</strong> 15 min | <strong>Servings:</strong> 4</p>
<p><strong>Difficulty:</strong> ⭐ Easy</p>
<hr/>
<h3>📋 Ingredients</h3>
<table><thead><tr><th>Ingredient</th><th>Amount</th><th>Notes</th></tr></thead><tbody>
<tr><td>Spaghetti</td><td>400g</td><td>Or any pasta shape</td></tr>
<tr><td>Butter</td><td>4 tbsp</td><td>Unsalted</td></tr>
<tr><td>Garlic cloves</td><td>6</td><td>Minced</td></tr>
<tr><td>Olive oil</td><td>2 tbsp</td><td>Extra virgin</td></tr>
<tr><td>Parmesan</td><td>1 cup</td><td>Freshly grated</td></tr>
<tr><td>Red pepper flakes</td><td>½ tsp</td><td>Optional</td></tr>
<tr><td>Fresh parsley</td><td>¼ cup</td><td>Chopped</td></tr>
</tbody></table>
<h3>👨‍🍳 Instructions</h3>
<ol>
<li>Bring a large pot of salted water to boil. Cook pasta according to package directions. Reserve 1 cup pasta water before draining.</li>
<li>In a large skillet, melt butter with olive oil over medium heat.</li>
<li>Add minced garlic and red pepper flakes. Cook for 1-2 minutes until fragrant (don't burn!).</li>
<li>Add drained pasta to the skillet. Toss to coat.</li>
<li>Add Parmesan and ½ cup pasta water. Toss until creamy, adding more water as needed.</li>
<li>Garnish with fresh parsley and extra Parmesan. Serve immediately.</li>
</ol>
<h3>💡 Tips</h3>
<ul><li>Don't overcook the garlic — it goes bitter quickly</li><li>Pasta water is the secret to a silky sauce</li><li>Add grilled chicken or shrimp for protein</li></ul>`,
      },
      {
        title: 'Meal Prep Planner',
        type: 'regular',
        content: `<h2>🥗 Weekly Meal Prep Planner</h2>
<p><strong>Week of:</strong> [Date]</p>
<hr/>
<h3>📆 Meal Plan</h3>
<table><thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Snacks</th></tr></thead><tbody>
<tr><td><strong>Mon</strong></td><td>Oatmeal</td><td>Chicken salad</td><td>Pasta</td><td>Fruits</td></tr>
<tr><td><strong>Tue</strong></td><td>Smoothie</td><td>Wrap</td><td>Stir fry</td><td>Nuts</td></tr>
<tr><td><strong>Wed</strong></td><td>Eggs</td><td>Soup</td><td>Grilled fish</td><td>Yogurt</td></tr>
<tr><td><strong>Thu</strong></td><td>Pancakes</td><td>Bowl</td><td>Tacos</td><td>Veggies</td></tr>
<tr><td><strong>Fri</strong></td><td>Toast</td><td>Leftovers</td><td>Pizza night</td><td>Popcorn</td></tr>
</tbody></table>
<h3>🛒 Shopping List</h3>
<table><thead><tr><th>Category</th><th>Items</th><th>✓</th></tr></thead><tbody>
<tr><td>Produce</td><td>Spinach, tomatoes, onions, garlic</td><td>☐</td></tr>
<tr><td>Protein</td><td>Chicken breast, eggs, fish</td><td>☐</td></tr>
<tr><td>Dairy</td><td>Milk, yogurt, cheese</td><td>☐</td></tr>
<tr><td>Pantry</td><td>Rice, pasta, olive oil, spices</td><td>☐</td></tr>
</tbody></table>`,
      },
    ],
  },
  {
    id: 'travel-journal',
    name: 'Travel Journal',
    icon: 'Globe',
    description: 'Trip planner, packing checklist, and daily travel journal templates',
    category: 'Travel',
    folderColor: '#0ea5e9',
    notes: [
      {
        title: 'Trip Planner',
        type: 'regular',
        content: `<h2>✈️ Trip Planner</h2>
<p><strong>Destination:</strong> [City, Country]</p>
<p><strong>Dates:</strong> [Start] → [End] | <strong>Budget:</strong> $[Amount]</p>
<hr/>
<h3>🏨 Accommodation</h3>
<table><thead><tr><th>Dates</th><th>Hotel/Airbnb</th><th>Address</th><th>Confirmation #</th><th>Cost</th></tr></thead><tbody>
<tr><td>[Date range]</td><td>[Name]</td><td>[Address]</td><td>[#]</td><td>$[Cost]</td></tr>
</tbody></table>
<h3>🚗 Transportation</h3>
<table><thead><tr><th>Type</th><th>Details</th><th>Time</th><th>Booking Ref</th></tr></thead><tbody>
<tr><td>✈️ Flight</td><td>[Airline] [Flight #]</td><td>[Time]</td><td>[Ref]</td></tr>
<tr><td>🚗 Car Rental</td><td>[Company]</td><td>[Pickup time]</td><td>[Ref]</td></tr>
</tbody></table>
<h3>📍 Itinerary</h3>
<table><thead><tr><th>Day</th><th>Morning</th><th>Afternoon</th><th>Evening</th></tr></thead><tbody>
<tr><td>Day 1</td><td>Arrival, check-in</td><td>City tour</td><td>Welcome dinner</td></tr>
<tr><td>Day 2</td><td>Museum visit</td><td>Local market</td><td>Beach sunset</td></tr>
<tr><td>Day 3</td><td>Day trip</td><td>Shopping</td><td>Local cuisine</td></tr>
</tbody></table>
<h3>📞 Important Contacts</h3>
<ul><li>Emergency: [Number]</li><li>Hotel: [Number]</li><li>Embassy: [Number]</li></ul>`,
      },
      {
        title: 'Packing Checklist',
        type: 'regular',
        content: `<h2>🧳 Packing Checklist</h2>
<p><strong>Trip:</strong> [Destination] | <strong>Duration:</strong> [X] days | <strong>Weather:</strong> [Expected conditions]</p>
<hr/>
<h3>👔 Clothing</h3>
<table><thead><tr><th>Item</th><th>Qty</th><th>Packed ✓</th></tr></thead><tbody>
<tr><td>T-shirts</td><td>5</td><td>☐</td></tr>
<tr><td>Pants/shorts</td><td>3</td><td>☐</td></tr>
<tr><td>Underwear</td><td>7</td><td>☐</td></tr>
<tr><td>Socks</td><td>5</td><td>☐</td></tr>
<tr><td>Jacket</td><td>1</td><td>☐</td></tr>
<tr><td>Sleepwear</td><td>2</td><td>☐</td></tr>
</tbody></table>
<h3>🧴 Toiletries</h3>
<table><thead><tr><th>Item</th><th>Packed ✓</th></tr></thead><tbody>
<tr><td>Toothbrush & toothpaste</td><td>☐</td></tr>
<tr><td>Shampoo & conditioner</td><td>☐</td></tr>
<tr><td>Sunscreen</td><td>☐</td></tr>
<tr><td>Deodorant</td><td>☐</td></tr>
<tr><td>Medications</td><td>☐</td></tr>
</tbody></table>
<h3>📱 Electronics</h3>
<table><thead><tr><th>Item</th><th>Packed ✓</th></tr></thead><tbody>
<tr><td>Phone & charger</td><td>☐</td></tr>
<tr><td>Power bank</td><td>☐</td></tr>
<tr><td>Camera</td><td>☐</td></tr>
<tr><td>Travel adapter</td><td>☐</td></tr>
</tbody></table>
<h3>📄 Documents</h3>
<table><thead><tr><th>Item</th><th>Packed ✓</th></tr></thead><tbody>
<tr><td>Passport / ID</td><td>☐</td></tr>
<tr><td>Boarding passes</td><td>☐</td></tr>
<tr><td>Travel insurance</td><td>☐</td></tr>
<tr><td>Hotel confirmations</td><td>☐</td></tr>
</tbody></table>`,
      },
      {
        title: 'Daily Travel Journal',
        type: 'regular',
        content: `<h2>📔 Travel Journal — Day [#]</h2>
<p><strong>Date:</strong> [Date] | <strong>Location:</strong> [City, Country]</p>
<p><strong>Weather:</strong> [☀️/🌧️/⛅] | <strong>Mood:</strong> [😊/🤩/😌]</p>
<hr/>
<h3>🌅 Morning</h3>
<p>[What did you do? Where did you go? How did it feel?]</p>
<h3>☀️ Afternoon</h3>
<p>[Activities, sightseeing, discoveries...]</p>
<h3>🌙 Evening</h3>
<p>[Dinner, nightlife, relaxation...]</p>
<h3>🍽️ Food Highlights</h3>
<table><thead><tr><th>Meal</th><th>Restaurant</th><th>Dish</th><th>Rating</th></tr></thead><tbody>
<tr><td>Breakfast</td><td>[Name]</td><td>[Dish]</td><td>⭐⭐⭐⭐</td></tr>
<tr><td>Lunch</td><td>[Name]</td><td>[Dish]</td><td>⭐⭐⭐</td></tr>
<tr><td>Dinner</td><td>[Name]</td><td>[Dish]</td><td>⭐⭐⭐⭐⭐</td></tr>
</tbody></table>
<h3>📸 Photo Moments</h3>
<p>[Describe your favorite photo moments or add images later]</p>
<h3>💡 Reflections</h3>
<p>[What surprised you today? What would you do differently?]</p>`,
      },
    ],
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: 'Heart',
    description: 'Workout log, wellness tracker, and gratitude journal for a balanced life',
    category: 'Health',
    folderColor: '#ef4444',
    notes: [
      {
        title: 'Workout Log',
        type: 'regular',
        content: `<h2>💪 Workout Log</h2>
<p><strong>Date:</strong> [Date] | <strong>Duration:</strong> [Time] | <strong>Type:</strong> [Strength/Cardio/HIIT]</p>
<hr/>
<h3>🏋️ Exercises</h3>
<table><thead><tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Notes</th></tr></thead><tbody>
<tr><td>Bench Press</td><td>4</td><td>10</td><td>60kg</td><td>Good form</td></tr>
<tr><td>Squats</td><td>4</td><td>12</td><td>80kg</td><td>Increase next time</td></tr>
<tr><td>Deadlift</td><td>3</td><td>8</td><td>100kg</td><td>PR!</td></tr>
<tr><td>Pull-ups</td><td>3</td><td>10</td><td>BW</td><td></td></tr>
<tr><td>Plank</td><td>3</td><td>60s</td><td>-</td><td>Hold steady</td></tr>
</tbody></table>
<h3>📊 Session Summary</h3>
<ul><li><strong>Energy Level:</strong> ⚡⚡⚡⚡ (4/5)</li><li><strong>Difficulty:</strong> 🔥🔥🔥 (3/5)</li><li><strong>Satisfaction:</strong> ⭐⭐⭐⭐⭐ (5/5)</li></ul>
<h3>📝 Notes</h3>
<p>[How did the workout feel? Any adjustments for next time?]</p>`,
      },
      {
        title: 'Daily Wellness Tracker',
        type: 'regular',
        content: `<h2>🌿 Daily Wellness Tracker</h2>
<p><strong>Date:</strong> [Date]</p>
<hr/>
<h3>😊 Mood Check</h3>
<p>Morning: [😊/😐/😢] | Afternoon: [😊/😐/😢] | Evening: [😊/😐/😢]</p>
<h3>📊 Daily Metrics</h3>
<table><thead><tr><th>Metric</th><th>Goal</th><th>Actual</th><th>Status</th></tr></thead><tbody>
<tr><td>💧 Water</td><td>8 glasses</td><td>[X]</td><td>[✅/❌]</td></tr>
<tr><td>😴 Sleep</td><td>8 hours</td><td>[X]</td><td>[✅/❌]</td></tr>
<tr><td>🚶 Steps</td><td>10,000</td><td>[X]</td><td>[✅/❌]</td></tr>
<tr><td>🧘 Meditation</td><td>10 min</td><td>[X]</td><td>[✅/❌]</td></tr>
<tr><td>📖 Reading</td><td>30 min</td><td>[X]</td><td>[✅/❌]</td></tr>
</tbody></table>
<h3>🙏 Gratitude</h3>
<ol><li>[Something you're grateful for today]</li><li>[Something you're grateful for today]</li><li>[Something you're grateful for today]</li></ol>
<h3>✍️ Journal</h3>
<p>[How was your day? Any wins? Any challenges?]</p>`,
      },
    ],
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    icon: 'Lightbulb',
    description: 'Story outline, character sheet, and brainstorm templates for writers',
    category: 'Creative',
    folderColor: '#ec4899',
    notes: [
      {
        title: 'Story Outline',
        type: 'regular',
        content: `<h2>📖 Story Outline</h2>
<p><strong>Title:</strong> [Working Title] | <strong>Genre:</strong> [Genre] | <strong>Word Count Goal:</strong> [Target]</p>
<hr/>
<h3>🎭 Premise</h3>
<p>[One-sentence summary of your story: A [character] must [goal] before [stakes]]</p>
<h3>📐 Three-Act Structure</h3>
<table><thead><tr><th>Act</th><th>Section</th><th>Events</th></tr></thead><tbody>
<tr><td rowspan="3"><strong>Act 1</strong><br/>Setup</td><td>Opening</td><td>[How the story begins, introducing the world]</td></tr>
<tr><td>Inciting Incident</td><td>[What disrupts the character's normal life]</td></tr>
<tr><td>First Plot Point</td><td>[Character commits to the journey]</td></tr>
<tr><td rowspan="3"><strong>Act 2</strong><br/>Confrontation</td><td>Rising Action</td><td>[Challenges and obstacles]</td></tr>
<tr><td>Midpoint</td><td>[Major revelation or shift]</td></tr>
<tr><td>Crisis</td><td>[Darkest moment, all seems lost]</td></tr>
<tr><td rowspan="2"><strong>Act 3</strong><br/>Resolution</td><td>Climax</td><td>[Final confrontation]</td></tr>
<tr><td>Resolution</td><td>[How things settle, new normal]</td></tr>
</tbody></table>
<h3>🎨 Themes</h3>
<ul><li>[Primary theme]</li><li>[Secondary theme]</li></ul>`,
      },
      {
        title: 'Character Profile Sheet',
        type: 'regular',
        content: `<h2>👤 Character Profile</h2>
<hr/>
<h3>Basic Info</h3>
<table><thead><tr><th>Attribute</th><th>Details</th></tr></thead><tbody>
<tr><td><strong>Full Name</strong></td><td>[Character name]</td></tr>
<tr><td><strong>Age</strong></td><td>[Age]</td></tr>
<tr><td><strong>Occupation</strong></td><td>[Job/role]</td></tr>
<tr><td><strong>Appearance</strong></td><td>[Physical description]</td></tr>
<tr><td><strong>Personality</strong></td><td>[Key traits]</td></tr>
</tbody></table>
<h3>🧠 Psychology</h3>
<table><thead><tr><th>Aspect</th><th>Details</th></tr></thead><tbody>
<tr><td><strong>Greatest Fear</strong></td><td>[What terrifies them]</td></tr>
<tr><td><strong>Deepest Desire</strong></td><td>[What they truly want]</td></tr>
<tr><td><strong>Fatal Flaw</strong></td><td>[Their weakness]</td></tr>
<tr><td><strong>Strength</strong></td><td>[What makes them special]</td></tr>
<tr><td><strong>Secret</strong></td><td>[What they hide from others]</td></tr>
</tbody></table>
<h3>📖 Backstory</h3>
<p>[Brief history that shaped who they are today]</p>
<h3>🔄 Character Arc</h3>
<p><strong>Starts as:</strong> [Who they are at the beginning]</p>
<p><strong>Ends as:</strong> [Who they become by the end]</p>`,
      },
      {
        title: 'Brainstorm & Ideas',
        type: 'regular',
        content: `<h2>💡 Brainstorm Session</h2>
<p><strong>Topic:</strong> [What are you brainstorming?] | <strong>Date:</strong> [Date]</p>
<hr/>
<h3>🌊 Brain Dump</h3>
<p>[Write everything that comes to mind without filtering. Quantity over quality!]</p>
<h3>⭐ Top Ideas</h3>
<table><thead><tr><th>#</th><th>Idea</th><th>Potential</th><th>Effort</th></tr></thead><tbody>
<tr><td>1</td><td>[Best idea]</td><td>🔥🔥🔥</td><td>Low</td></tr>
<tr><td>2</td><td>[Second idea]</td><td>🔥🔥</td><td>Medium</td></tr>
<tr><td>3</td><td>[Third idea]</td><td>🔥🔥🔥</td><td>High</td></tr>
</tbody></table>
<h3>🔗 Connections & Patterns</h3>
<p>[Do any of these ideas connect? Can they be combined?]</p>
<h3>🚀 Next Steps</h3>
<ol><li>[Action to explore idea #1]</li><li>[Action to validate idea #2]</li><li>[Research needed for idea #3]</li></ol>`,
      },
    ],
  },
  {
    id: 'finance-toolkit',
    name: 'Finance Toolkit',
    icon: 'Receipt',
    description: 'Budget tracker, invoice template, and expense report for personal & business finance',
    category: 'Finance',
    folderColor: '#10b981',
    notes: [
      {
        title: 'Monthly Budget Tracker',
        type: 'regular',
        content: `<h2>💰 Monthly Budget Tracker</h2>
<p><strong>Month:</strong> [Month Year] | <strong>Total Budget:</strong> $[Amount]</p>
<hr/>
<h3>📊 Income</h3>
<table><thead><tr><th>Source</th><th>Expected</th><th>Actual</th><th>Difference</th></tr></thead><tbody>
<tr><td>Salary</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>Freelance</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>Other</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td><strong>Total</strong></td><td><strong>$[Total]</strong></td><td><strong>$[Total]</strong></td><td><strong>$0</strong></td></tr>
</tbody></table>
<h3>💸 Expenses</h3>
<table><thead><tr><th>Category</th><th>Budgeted</th><th>Spent</th><th>Remaining</th></tr></thead><tbody>
<tr><td>🏠 Rent/Mortgage</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>🛒 Groceries</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>🚗 Transportation</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>💡 Utilities</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>📱 Subscriptions</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>🍽️ Dining Out</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>🎉 Entertainment</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>💊 Health</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td>📦 Other</td><td>$[Amount]</td><td>$[Amount]</td><td>$0</td></tr>
<tr><td><strong>Total</strong></td><td><strong>$[Total]</strong></td><td><strong>$[Total]</strong></td><td><strong>$0</strong></td></tr>
</tbody></table>
<h3>🏦 Savings Goals</h3>
<table><thead><tr><th>Goal</th><th>Target</th><th>Saved This Month</th><th>Total Progress</th></tr></thead><tbody>
<tr><td>Emergency Fund</td><td>$[Target]</td><td>$[Amount]</td><td>$[Total] / $[Target]</td></tr>
<tr><td>Vacation</td><td>$[Target]</td><td>$[Amount]</td><td>$[Total] / $[Target]</td></tr>
</tbody></table>
<h3>📝 Notes</h3>
<p>[Any observations, adjustments needed, or financial goals for next month]</p>`,
      },
      {
        title: 'Invoice Template',
        type: 'regular',
        content: `<h2>🧾 Invoice</h2>
<p><strong>Invoice #:</strong> INV-[Number] | <strong>Date:</strong> [Date] | <strong>Due Date:</strong> [Date]</p>
<hr/>
<h3>From</h3>
<p><strong>[Your Name / Business Name]</strong><br/>[Address Line 1]<br/>[City, State ZIP]<br/>Email: [email] | Phone: [phone]</p>
<h3>Bill To</h3>
<p><strong>[Client Name / Company]</strong><br/>[Address Line 1]<br/>[City, State ZIP]<br/>Email: [client email]</p>
<hr/>
<h3>📋 Services / Items</h3>
<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
<tr><td>[Service/Item 1]</td><td>1</td><td>$[Rate]</td><td>$[Amount]</td></tr>
<tr><td>[Service/Item 2]</td><td>2</td><td>$[Rate]</td><td>$[Amount]</td></tr>
<tr><td>[Service/Item 3]</td><td>1</td><td>$[Rate]</td><td>$[Amount]</td></tr>
</tbody></table>
<table><tbody>
<tr><td style="text-align:right"><strong>Subtotal</strong></td><td style="width:120px">$[Subtotal]</td></tr>
<tr><td style="text-align:right"><strong>Tax (X%)</strong></td><td>$[Tax]</td></tr>
<tr><td style="text-align:right"><strong>Discount</strong></td><td>-$[Discount]</td></tr>
<tr><td style="text-align:right"><strong>Total Due</strong></td><td><strong>$[Total]</strong></td></tr>
</tbody></table>
<h3>💳 Payment Methods</h3>
<ul><li>Bank Transfer: [Account details]</li><li>PayPal: [email]</li><li>Other: [details]</li></ul>
<h3>📌 Terms & Notes</h3>
<p>Payment due within [X] days. Late payments may incur a [X]% fee.<br/>[Additional notes or thank you message]</p>`,
      },
      {
        title: 'Expense Report',
        type: 'regular',
        content: `<h2>📊 Expense Report</h2>
<p><strong>Employee:</strong> [Name] | <strong>Department:</strong> [Dept] | <strong>Period:</strong> [Date Range]</p>
<hr/>
<h3>💳 Expenses</h3>
<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payment Method</th><th>Amount</th><th>Receipt</th></tr></thead><tbody>
<tr><td>[Date]</td><td>Travel</td><td>[Description]</td><td>Card</td><td>$[Amount]</td><td>✅</td></tr>
<tr><td>[Date]</td><td>Meals</td><td>[Description]</td><td>Cash</td><td>$[Amount]</td><td>✅</td></tr>
<tr><td>[Date]</td><td>Supplies</td><td>[Description]</td><td>Card</td><td>$[Amount]</td><td>☐</td></tr>
<tr><td>[Date]</td><td>Software</td><td>[Description]</td><td>Card</td><td>$[Amount]</td><td>✅</td></tr>
<tr><td>[Date]</td><td>Other</td><td>[Description]</td><td>[Method]</td><td>$[Amount]</td><td>☐</td></tr>
</tbody></table>
<h3>📈 Summary by Category</h3>
<table><thead><tr><th>Category</th><th>Total</th></tr></thead><tbody>
<tr><td>Travel</td><td>$[Amount]</td></tr>
<tr><td>Meals</td><td>$[Amount]</td></tr>
<tr><td>Supplies</td><td>$[Amount]</td></tr>
<tr><td>Software</td><td>$[Amount]</td></tr>
<tr><td><strong>Grand Total</strong></td><td><strong>$[Total]</strong></td></tr>
</tbody></table>
<h3>✍️ Approval</h3>
<p>Submitted by: [Name] — Date: [Date]<br/>Approved by: _________________ — Date: _________</p>`,
      },
    ],
  },
  {
    id: 'daily-journaling',
    name: 'Daily Journaling',
    icon: 'Notebook',
    description: 'Morning pages, gratitude journal, and weekly reflection templates for mindful living',
    category: 'Journaling',
    folderColor: '#f59e0b',
    notes: [
      {
        title: 'Morning Pages',
        type: 'regular',
        content: `<h2>🌅 Morning Pages</h2>
<p><strong>Date:</strong> [Date] | <strong>Woke up at:</strong> [Time] | <strong>Sleep quality:</strong> [⭐⭐⭐⭐⭐]</p>
<hr/>
<h3>🧘 Morning Check-In</h3>
<table><thead><tr><th>Question</th><th>Answer</th></tr></thead><tbody>
<tr><td>How do I feel right now?</td><td>[Physically, mentally, emotionally]</td></tr>
<tr><td>What did I dream about?</td><td>[Dream notes or "none recalled"]</td></tr>
<tr><td>What am I looking forward to?</td><td>[Today's highlight]</td></tr>
<tr><td>What might be challenging?</td><td>[Anticipated challenge]</td></tr>
</tbody></table>
<h3>🎯 Today's Intentions</h3>
<ol><li><strong>Top Priority:</strong> [The ONE thing I must do today]</li><li>[Second priority]</li><li>[Third priority]</li></ol>
<h3>✍️ Free Writing</h3>
<p>[Stream of consciousness — write whatever comes to mind for 10 minutes without stopping or editing. Let your thoughts flow freely...]</p>
<h3>💡 Ideas That Came Up</h3>
<ul><li>[Capture any ideas, insights, or creative sparks from your writing]</li></ul>
<h3>🙏 Affirmation</h3>
<blockquote><p>"[Write a positive affirmation for today]"</p></blockquote>`,
      },
      {
        title: 'Gratitude Journal',
        type: 'regular',
        content: `<h2>🙏 Gratitude Journal</h2>
<p><strong>Date:</strong> [Date] | <strong>Overall Mood:</strong> [😊 Great / 🙂 Good / 😐 Okay / 😢 Low]</p>
<hr/>
<h3>✨ Three Things I'm Grateful For</h3>
<table><thead><tr><th>#</th><th>I'm Grateful For...</th><th>Why It Matters</th></tr></thead><tbody>
<tr><td>1</td><td>[Something big or small]</td><td>[How it made you feel / why it's important]</td></tr>
<tr><td>2</td><td>[A person, experience, or thing]</td><td>[The impact it had on your day]</td></tr>
<tr><td>3</td><td>[An often overlooked blessing]</td><td>[Why you're noticing it today]</td></tr>
</tbody></table>
<h3>🌟 Today's Wins</h3>
<ul><li><strong>Big win:</strong> [Something you accomplished or experienced]</li><li><strong>Small win:</strong> [A tiny moment of joy or progress]</li></ul>
<h3>❤️ Acts of Kindness</h3>
<p><strong>Kindness I received:</strong> [Someone's gesture toward you]</p>
<p><strong>Kindness I gave:</strong> [How you helped or brightened someone's day]</p>
<h3>📸 Moment I Want to Remember</h3>
<p>[Describe a specific moment from today in vivid detail — sights, sounds, feelings]</p>
<h3>🌙 Evening Reflection</h3>
<p>If I could relive one moment from today, it would be: [Moment]</p>
<p>Tomorrow, I'm looking forward to: [Something positive]</p>`,
      },
      {
        title: 'Weekly Reflection',
        type: 'regular',
        content: `<h2>📝 Weekly Reflection</h2>
<p><strong>Week of:</strong> [Start Date] — [End Date]</p>
<hr/>
<h3>🏆 This Week's Highlights</h3>
<table><thead><tr><th>Day</th><th>Highlight</th><th>How I Felt</th></tr></thead><tbody>
<tr><td>Monday</td><td>[Best moment]</td><td>[Emoji/mood]</td></tr>
<tr><td>Tuesday</td><td>[Best moment]</td><td>[Emoji/mood]</td></tr>
<tr><td>Wednesday</td><td>[Best moment]</td><td>[Emoji/mood]</td></tr>
<tr><td>Thursday</td><td>[Best moment]</td><td>[Emoji/mood]</td></tr>
<tr><td>Friday</td><td>[Best moment]</td><td>[Emoji/mood]</td></tr>
<tr><td>Saturday</td><td>[Best moment]</td><td>[Emoji/mood]</td></tr>
<tr><td>Sunday</td><td>[Best moment]</td><td>[Emoji/mood]</td></tr>
</tbody></table>
<h3>✅ Goals Review</h3>
<table><thead><tr><th>Goal</th><th>Progress</th><th>Status</th></tr></thead><tbody>
<tr><td>[Goal 1]</td><td>[What I did]</td><td>[✅ Done / 🔄 In Progress / ❌ Missed]</td></tr>
<tr><td>[Goal 2]</td><td>[What I did]</td><td>[✅ / 🔄 / ❌]</td></tr>
<tr><td>[Goal 3]</td><td>[What I did]</td><td>[✅ / 🔄 / ❌]</td></tr>
</tbody></table>
<h3>💡 Lessons Learned</h3>
<ol><li>[Key insight from this week]</li><li>[Something I'd do differently]</li><li>[A pattern I noticed about myself]</li></ol>
<h3>🎯 Next Week's Focus</h3>
<ul><li><strong>Priority 1:</strong> [Most important goal]</li><li><strong>Priority 2:</strong> [Secondary goal]</li><li><strong>Habit to build:</strong> [One habit to focus on]</li></ul>
<h3>💭 One Word to Describe This Week</h3>
<p style="font-size:1.5em;text-align:center"><strong>[Word]</strong></p>`,
      },
    ],
  },
  {
    id: 'interview-prep',
    name: 'Interview Prep',
    icon: 'Briefcase',
    description: 'STAR method responses, company research notes, and question bank for job interviews',
    category: 'Career',
    folderColor: '#6366f1',
    notes: [
      {
        title: 'STAR Method Responses',
        type: 'regular',
        content: `<h2>⭐ STAR Method Interview Responses</h2>
<p><strong>Position:</strong> [Job Title] | <strong>Company:</strong> [Company Name]</p>
<hr/>
<h3>📋 How to Use STAR</h3>
<p><strong>S</strong>ituation → <strong>T</strong>ask → <strong>A</strong>ction → <strong>R</strong>esult</p>
<hr/>
<h3>Story 1: [Theme — e.g., Leadership]</h3>
<table><thead><tr><th>Component</th><th>Your Response</th></tr></thead><tbody>
<tr><td><strong>Situation</strong></td><td>[Set the scene. Where were you working? What was happening?]</td></tr>
<tr><td><strong>Task</strong></td><td>[What was your responsibility? What needed to be done?]</td></tr>
<tr><td><strong>Action</strong></td><td>[What specific steps did YOU take? Use "I" not "we"]</td></tr>
<tr><td><strong>Result</strong></td><td>[What was the outcome? Use numbers/metrics if possible]</td></tr>
</tbody></table>
<p><strong>Best for questions like:</strong> "Tell me about a time you led a team..." / "Describe a leadership challenge..."</p>
<hr/>
<h3>Story 2: [Theme — e.g., Problem Solving]</h3>
<table><thead><tr><th>Component</th><th>Your Response</th></tr></thead><tbody>
<tr><td><strong>Situation</strong></td><td>[Context]</td></tr>
<tr><td><strong>Task</strong></td><td>[Your role]</td></tr>
<tr><td><strong>Action</strong></td><td>[Your steps]</td></tr>
<tr><td><strong>Result</strong></td><td>[Outcome with metrics]</td></tr>
</tbody></table>
<p><strong>Best for questions like:</strong> "Describe a difficult problem you solved..." / "When did you think outside the box?"</p>
<hr/>
<h3>Story 3: [Theme — e.g., Conflict Resolution]</h3>
<table><thead><tr><th>Component</th><th>Your Response</th></tr></thead><tbody>
<tr><td><strong>Situation</strong></td><td>[Context]</td></tr>
<tr><td><strong>Task</strong></td><td>[Your role]</td></tr>
<tr><td><strong>Action</strong></td><td>[Your steps]</td></tr>
<tr><td><strong>Result</strong></td><td>[Outcome]</td></tr>
</tbody></table>
<p><strong>Best for questions like:</strong> "Tell me about a disagreement with a colleague..." / "How do you handle conflict?"</p>
<hr/>
<h3>Story 4: [Theme — e.g., Failure & Learning]</h3>
<table><thead><tr><th>Component</th><th>Your Response</th></tr></thead><tbody>
<tr><td><strong>Situation</strong></td><td>[Context]</td></tr>
<tr><td><strong>Task</strong></td><td>[Your role]</td></tr>
<tr><td><strong>Action</strong></td><td>[Your steps]</td></tr>
<tr><td><strong>Result</strong></td><td>[What you learned]</td></tr>
</tbody></table>
<p><strong>Best for questions like:</strong> "Tell me about a time you failed..." / "What's your biggest mistake?"</p>`,
      },
      {
        title: 'Company Research Notes',
        type: 'regular',
        content: `<h2>🏢 Company Research</h2>
<p><strong>Company:</strong> [Company Name] | <strong>Position:</strong> [Job Title] | <strong>Interview Date:</strong> [Date]</p>
<hr/>
<h3>📊 Company Overview</h3>
<table><thead><tr><th>Detail</th><th>Info</th></tr></thead><tbody>
<tr><td>Founded</td><td>[Year]</td></tr>
<tr><td>Headquarters</td><td>[Location]</td></tr>
<tr><td>Industry</td><td>[Industry]</td></tr>
<tr><td>Size</td><td>[# employees]</td></tr>
<tr><td>Revenue</td><td>[If public]</td></tr>
<tr><td>CEO/Founder</td><td>[Name]</td></tr>
<tr><td>Mission</td><td>[Company mission statement]</td></tr>
</tbody></table>
<h3>🎯 What They Do</h3>
<p>[Describe their main products/services in your own words]</p>
<h3>📰 Recent News</h3>
<ul><li>[Recent announcement, launch, or milestone]</li><li>[Press coverage or industry mentions]</li><li>[Any challenges or pivots]</li></ul>
<h3>🏆 Why I Want to Work Here</h3>
<ol><li>[Genuine reason #1 — culture, mission, product]</li><li>[Genuine reason #2 — growth, technology, impact]</li><li>[Genuine reason #3 — personal connection to their work]</li></ol>
<h3>👥 Interviewers</h3>
<table><thead><tr><th>Name</th><th>Title</th><th>LinkedIn Notes</th></tr></thead><tbody>
<tr><td>[Interviewer 1]</td><td>[Title]</td><td>[Background, shared interests]</td></tr>
<tr><td>[Interviewer 2]</td><td>[Title]</td><td>[Background, shared interests]</td></tr>
</tbody></table>
<h3>❓ My Questions for Them</h3>
<ol><li>[Thoughtful question about the role]</li><li>[Question about team culture]</li><li>[Question about growth/direction]</li><li>[Question about day-to-day work]</li></ol>`,
      },
      {
        title: 'Interview Question Bank',
        type: 'regular',
        content: `<h2>❓ Interview Question Bank</h2>
<p><strong>Role:</strong> [Job Title] | <strong>Company:</strong> [Company Name]</p>
<hr/>
<h3>🔵 Common Behavioral Questions</h3>
<table><thead><tr><th>Question</th><th>My Key Points</th><th>STAR Story #</th></tr></thead><tbody>
<tr><td>Tell me about yourself</td><td>[2-min pitch: past → present → future]</td><td>-</td></tr>
<tr><td>Why do you want this role?</td><td>[Connect skills + passion + company]</td><td>-</td></tr>
<tr><td>What's your greatest strength?</td><td>[Strength + example]</td><td>Story #[X]</td></tr>
<tr><td>What's your biggest weakness?</td><td>[Real weakness + improvement steps]</td><td>-</td></tr>
<tr><td>Where do you see yourself in 5 years?</td><td>[Growth aligned with company]</td><td>-</td></tr>
<tr><td>Why are you leaving your current role?</td><td>[Positive framing — seeking growth]</td><td>-</td></tr>
</tbody></table>
<h3>🟡 Situational Questions</h3>
<table><thead><tr><th>Question</th><th>My Approach</th></tr></thead><tbody>
<tr><td>How do you handle tight deadlines?</td><td>[Prioritization strategy + example]</td></tr>
<tr><td>Describe a time you disagreed with your manager</td><td>[Respectful approach + outcome]</td></tr>
<tr><td>How do you handle multiple priorities?</td><td>[Framework you use]</td></tr>
<tr><td>Tell me about a time you failed</td><td>[Failure + lesson + improvement]</td></tr>
</tbody></table>
<h3>🟢 Role-Specific Questions</h3>
<table><thead><tr><th>Question</th><th>My Answer Notes</th></tr></thead><tbody>
<tr><td>[Technical/role-specific Q1]</td><td>[Key points]</td></tr>
<tr><td>[Technical/role-specific Q2]</td><td>[Key points]</td></tr>
<tr><td>[Technical/role-specific Q3]</td><td>[Key points]</td></tr>
</tbody></table>
<h3>🔴 Salary & Logistics</h3>
<table><thead><tr><th>Topic</th><th>My Position</th></tr></thead><tbody>
<tr><td>Salary expectation</td><td>$[Range] based on [research source]</td></tr>
<tr><td>Start date</td><td>[Earliest available date]</td></tr>
<tr><td>Remote/hybrid preference</td><td>[Your preference]</td></tr>
<tr><td>Notice period</td><td>[Current notice period]</td></tr>
</tbody></table>
<h3>✅ Pre-Interview Checklist</h3>
<ul><li>☐ Researched the company thoroughly</li><li>☐ Practiced STAR stories out loud</li><li>☐ Prepared questions to ask them</li><li>☐ Tested tech setup (if virtual)</li><li>☐ Outfit ready</li><li>☐ Copies of resume printed/accessible</li><li>☐ Know the interviewer names & roles</li></ul>`,
      },
    ],
  },
];

const CATEGORIES = [...new Set(DEFAULT_NOTE_TEMPLATES.map(t => t.category))];
const FOLDER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#6366f1'];

// ─── Props ───

interface NoteTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (data: {
    folder: Omit<Folder, 'id' | 'createdAt'>;
    notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'syncVersion' | 'syncStatus' | 'isDirty'>[];
  }) => void;
}

// ─── Component ───

export const NoteTemplateSheet = ({ isOpen, onClose, onApplyTemplate }: NoteTemplateSheetProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<NoteTemplate[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<NoteTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Star');
  const [formFolderColor, setFormFolderColor] = useState(FOLDER_COLORS[0]);
  const [formNotes, setFormNotes] = useState<{ title: string; content: string }[]>([
    { title: '', content: '' },
  ]);

  useHardwareBackButton({ onBack: onClose, enabled: isOpen, priority: 'sheet' });

  useEffect(() => {
    getSetting<NoteTemplate[]>('customNoteTemplates', []).then(setCustomTemplates);
  }, []);

  const allTemplates = [...DEFAULT_NOTE_TEMPLATES, ...customTemplates];

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
  }, {} as Record<string, NoteTemplate[]>);

  const handleApply = (template: NoteTemplate) => {
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});

    const noteDefs = template.notes.map(n => ({
      type: n.type,
      title: n.title,
      content: n.content,
      color: undefined as any,
      voiceRecordings: [] as any[],
      folderId: undefined, // Will be set by parent with created folder ID
    }));

    onApplyTemplate({
      folder: { name: template.name, color: template.folderColor, isDefault: false, isFavorite: true },
      notes: noteDefs,
    });

    toast.success(`"${template.name}" notes created!`, { icon: '📝' });
    onClose();
  };

  const getIcon = (iconName: string) => ICON_MAP[iconName] || Star;
  const totalNotes = (t: NoteTemplate) => t.notes.length;

  // Save custom template
  const handleSaveCustom = () => {
    if (!formName.trim()) return;
    const newTemplate: NoteTemplate = {
      id: `custom-note-${Date.now()}`,
      name: formName.trim(),
      icon: formIcon,
      description: formDescription.trim(),
      category: 'Custom',
      folderColor: formFolderColor,
      isCustom: true,
      notes: formNotes.filter(n => n.title.trim()).map(n => ({
        title: n.title.trim(),
        type: 'regular' as NoteType,
        content: `<h2>${n.title.trim()}</h2><p>${n.content.trim() || ''}</p>`,
      })),
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    setSetting('customNoteTemplates', updated);
    setShowCreateDialog(false);
    setFormName('');
    setFormDescription('');
    setFormNotes([{ title: '', content: '' }]);
    toast.success('Note template saved!');
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    setSetting('customNoteTemplates', updated);
    toast.success('Template deleted');
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-0">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5" />
              Note Templates
            </SheetTitle>
          </SheetHeader>

          <div className="px-5 pb-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search note templates..."
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
                        <div
                          key={template.id}
                          className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: template.folderColor + '20', color: template.folderColor }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{template.name}</p>
                              {template.isCustom && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Custom</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-[10px]">{totalNotes(template)} notes</Badge>
                            {template.isCustom && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); handleDeleteCustom(template.id); }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No templates found
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Create custom button */}
          <div className="px-5 py-3 border-t">
            <Button variant="outline" className="w-full gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              Create Custom Template
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview / Apply dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const Icon = getIcon(previewTemplate.icon); return <Icon className="h-5 w-5" />; })()}
                {previewTemplate.name}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 pb-4">
                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: previewTemplate.folderColor }} />
                  <span>Creates folder: <strong>{previewTemplate.name}</strong> (★ Favorite)</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {previewTemplate.notes.length} Notes Included
                  </p>
                  {previewTemplate.notes.map((note, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-muted/30">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {note.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {note.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').slice(0, 120)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setPreviewTemplate(null)}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={() => { handleApply(previewTemplate); setPreviewTemplate(null); }}>
                <Plus className="h-4 w-4" />
                Create Notes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Custom Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Note Template</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Template Name</label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Weekly Reviews" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Short description..." />
              </div>

              {/* Icon selector */}
              <div>
                <label className="text-sm font-medium mb-1 block">Icon</label>
                <div className="flex gap-1 flex-wrap">
                  {ICON_OPTIONS.map(icon => {
                    const I = ICON_MAP[icon];
                    return (
                      <button
                        key={icon}
                        onClick={() => setFormIcon(icon)}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors",
                          formIcon === icon ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-transparent"
                        )}
                      >
                        <I className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Folder color */}
              <div>
                <label className="text-sm font-medium mb-1 block">Folder Color</label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setFormFolderColor(c)}
                      className={cn("w-7 h-7 rounded-full border-2 transition-all", formFolderColor === c ? "border-foreground scale-110" : "border-transparent")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-1 block">Notes (one per entry)</label>
                <div className="space-y-3">
                  {formNotes.map((note, i) => (
                    <div key={i} className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={note.title}
                          onChange={e => {
                            const updated = [...formNotes];
                            updated[i].title = e.target.value;
                            setFormNotes(updated);
                          }}
                          placeholder={`Note ${i + 1} title`}
                          className="flex-1"
                        />
                        {formNotes.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => setFormNotes(formNotes.filter((_, j) => j !== i))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={note.content}
                        onChange={e => {
                          const updated = [...formNotes];
                          updated[i].content = e.target.value;
                          setFormNotes(updated);
                        }}
                        placeholder="Note content (plain text)..."
                        rows={2}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setFormNotes([...formNotes, { title: '', content: '' }])}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Note
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveCustom} disabled={!formName.trim()}>Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
