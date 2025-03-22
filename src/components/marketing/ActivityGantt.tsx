import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { MarketingActivity } from '../../types';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getActivityColor, getActivityStatusColor } from '../../utils/activityTypes';
import ActivityModal from './ActivityModal';
import ActivityFilter from './ActivityFilter';

interface ActivityGanttProps {
  activities: MarketingActivity[];
  onEditActivity?: (id: string) => void;
  onUpdateStatus?: (id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => void;
  onUpdateSubtaskStatus?: (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  checkDependencies?: (id: string) => boolean;
  checkSubtaskDependencies?: (activityId: string, subtaskId: string) => boolean;
  onRemoveDependency?: (activityId: string, dependencyId: string) => void;
  canEdit?: boolean;
}

const ActivityGantt: React.FC<ActivityGanttProps> = ({ 
  activities,
  onEditActivity,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  checkDependencies,
  checkSubtaskDependencies,
  onRemoveDependency,
  canEdit = true
}) => {
  const { plans } = useMarketingPlanStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<MarketingActivity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlans, setSelectedPlans] = useState(plans.map(p => p.id));
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Add filtering logic before rendering activities
  const filteredActivities = activities.filter(activity => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;

    // Plan filter
    const matchesPlan = selectedPlans.includes(activity.plan_id);

    return matchesSearch && matchesStatus && matchesPlan;
  });

  useEffect(() => {
    if (!canvasRef.current || filteredActivities.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Find date range for all activities
    let minDate = new Date();
    let maxDate = new Date();
    
    filteredActivities.forEach(activity => {
      const publishDate = new Date(activity.publish_date);
      
      if (publishDate < minDate) {
        minDate = publishDate;
      }
      
      // Estimate end date based on subtasks
      const estimatedDays = activity.subtasks.length * 2; // Simple estimation
      const estimatedEndDate = addDays(publishDate, estimatedDays);
      
      if (estimatedEndDate > maxDate) {
        maxDate = estimatedEndDate;
      }
    });
    
    // Ensure we have at least a month of range
    minDate = startOfMonth(minDate);
    maxDate = endOfMonth(maxDate);
    
    // Add padding
    minDate = addDays(minDate, -7);
    maxDate = addDays(maxDate, 7);
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = Math.max(400, filteredActivities.length * 40 + 50);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw timeline
    const totalDays = differenceInDays(maxDate, minDate) + 1;
    const dayWidth = (canvas.width - 200) / totalDays;
    const headerHeight = 50;
    const rowHeight = 30;
    
    // Draw header
    ctx.fillStyle = '#f3f4f6'; // gray-100
    ctx.fillRect(0, 0, canvas.width, headerHeight);
    
    // Draw vertical grid lines for days
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.lineWidth = 1;
    
    const days = eachDayOfInterval({ start: minDate, end: maxDate });
    days.forEach((day, i) => {
      const x = 200 + i * dayWidth;
      
      // Draw day line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      // Draw day label
      if (i % 7 === 0 || i === 0 || i === days.length - 1) {
        ctx.fillStyle = '#4b5563'; // gray-600
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(format(day, 'MMM d'), x, 15);
      }
      
      // Draw month label if first day of month
      if (day.getDate() === 1) {
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(format(day, 'MMMM yyyy'), x + (dayWidth * 15), 35);
      }
    });
    
    // Draw horizontal grid lines for activities
    filteredActivities.forEach((_, i) => {
      const y = headerHeight + i * rowHeight;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
    
    // Store activity positions for interaction
    const activityPositions: Record<string, { 
      x: number; 
      y: number; 
      width: number; 
      height: number; 
      titleX: number; 
      titleY: number; 
      titleWidth: number; 
      titleHeight: number; 
    }> = {};
    
    // Draw activities
    filteredActivities.forEach((activity, i) => {
      const y = headerHeight + i * rowHeight + 5;
      const startDate = new Date(activity.start_date);
      const endDate = new Date(activity.publish_date);
      
      // Calculate start position
      const startDays = differenceInDays(startDate, minDate);
      const startX = 200 + startDays * dayWidth;
      
      // Calculate width based on duration
      const duration = differenceInDays(endDate, startDate);
      const width = duration * dayWidth;
      
      // Store position for click handling
      activityPositions[activity.id] = {
        x: startX,
        y,
        width,
        height: rowHeight - 10,
        titleX: 10,  // Title starts at x = 10
        titleY: y + 15,  // Title y position adjusted to center within the row
        titleWidth: ctx.measureText(activity.title).width,  // Width of the title text
        titleHeight: 20,  // Height of the title (based on font size)
      };
      
      // Draw activity bar
      ctx.fillStyle = getActivityStatusColor(activity.status).replace('text-', '').replace('bg-', '#');
      ctx.fillRect(startX, y, width, rowHeight - 10);
      
      // Draw activity label
      ctx.fillStyle = '#1f2937'; // gray-800
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(activity.title, 10, y + 15);
      
      // Draw plan name
      const plan = plans.find(p => p.id === activity.plan_id);
      if (plan) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#1E40AF'; // text-blue-800
        ctx.fillText(plan.title, startX, y + rowHeight + 20);
      }
      
      // Draw subtask markers
      activity.subtasks.forEach((subtask, j) => {
        const subtaskX = startX + (j * (width / Math.max(activity.subtasks.length, 1)));
        
        let markerColor;
        switch (subtask.status) {
          case 'completed':
            markerColor = '#10b981'; // green-500
            break;
          case 'in_progress':
            markerColor = '#3b82f6'; // blue-500
            break;
          case 'todo':
          default:
            markerColor = '#9ca3af'; // gray-400
        }
        
        // Draw subtask marker
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.arc(subtaskX + 5, y + rowHeight / 2, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
    
    // Add click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is within any activity
      for (const [id, pos] of Object.entries(activityPositions)) {
        if (
          x >= pos.x && 
          x <= pos.x + pos.width && 
          y >= pos.y && 
          y <= pos.y + pos.height
        ) {
          const activity = filteredActivities.find(a => a.id === id);
          if (activity) {
            setSelectedActivity(activity);
          }
          break;
        }

        // Check if clicked within title
        if (
          x >= pos.titleX && 
          x <= pos.titleX + pos.titleWidth &&
          y >= pos.titleY - pos.titleHeight / 2 &&
          y <= pos.titleY + pos.titleHeight / 2
        ) {
          const activity = filteredActivities.find(a => a.id === id);
          if (activity) {
            setSelectedActivity(activity);
          }
          break;
        }

      }
    };
    
    canvas.addEventListener('click', handleClick);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [filteredActivities]);
  
  if (filteredActivities.length === 0) {

    return (

      <div className="text-center py-8 min-h-[400px]">

        <ActivityFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedPlans={selectedPlans}
          onPlanSelectionChange={setSelectedPlans}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <br></br>
        <br></br>
        <br></br>

        <p className="text-gray-500">No activities found to display in the Gantt chart.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <ActivityFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPlans={selectedPlans}
        onPlanSelectionChange={setSelectedPlans}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      
      <div className="mb-4 flex items-center space-x-4">
        <div className="text-sm flex items-center">
          <span className="h-3 w-3 rounded-full bg-red-500 mr-1"></span>
          <span className="mr-3">Overdue</span>
          
          <span className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></span>
          <span className="mr-3">Due Soon (7 days)</span>
          
          <span className="h-3 w-3 rounded-full bg-green-500 mr-1"></span>
          <span className="mr-3">On Track</span>
          
          <span className="h-3 w-3 rounded-full bg-blue-500 mr-1"></span>
          <span>Completed</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <canvas 
            ref={canvasRef} 
            className="w-full" 
            style={{ minHeight: `${filteredActivities.length * 40 + 50}px` }}
          />
        </div>
      </div>
      
      <ActivityModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onEdit={onEditActivity}
        onUpdateStatus={onUpdateStatus}
        onUpdateSubtaskStatus={onUpdateSubtaskStatus}
        onRemoveDependency={onRemoveDependency}
        checkDependencies={checkDependencies}
        checkSubtaskDependencies={checkSubtaskDependencies}
        activities={activities}
        canEdit={canEdit}
      />
    </div>
  );
};

export default ActivityGantt;