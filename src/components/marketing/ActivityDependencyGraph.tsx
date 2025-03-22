import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { MarketingActivity } from '../../types';
import { getActivityTypeInfo } from '../../utils/activityTypes';
import ActivityModal from './ActivityModal';
import ActivityFilter from './ActivityFilter';

interface ActivityDependencyGraphProps {
  activities: MarketingActivity[];
  onEditActivity?: (id: string) => void;
  onUpdateStatus?: (id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => void;
  onUpdateSubtaskStatus?: (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  checkDependencies?: (id: string) => boolean;
  checkSubtaskDependencies?: (activityId: string, subtaskId: string) => boolean;
  onRemoveDependency?: (activityId: string, dependencyId: string) => void;
  canEdit?: boolean;
}

const ActivityDependencyGraph: React.FC<ActivityDependencyGraphProps> = ({ 
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
  const [dragStart, setDragStart] = useState<{ id: string, x: number, y: number } | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);
  const [activityPositions, setActivityPositions] = useState<Record<string, { 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    titleX: number, 
    titleY: number, 
    titleWidth: number, 
    titleHeight: number 
  }>>({});
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
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = Math.max(600, filteredActivities.length * 60);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw activities and connections
    const nodeRadius = 20;
    const nodeSpacing = 100;
    const levelWidth = canvas.width / 3;
    
    // Group activities by their dependency level
    const levels: Record<number, MarketingActivity[]> = {};
    
    // Helper function to find the level of an activity
    const findLevel = (activity: MarketingActivity, visited = new Set<string>()): number => {
      if (visited.has(activity.id)) return 0; // Prevent circular dependencies
      visited.add(activity.id);
      
      if (activity.dependencies.length === 0) return 0;
      
      let maxLevel = 0;
      for (const depId of activity.dependencies) {
        const dep = filteredActivities.find(a => a.id === depId);
        if (dep) {
          const depLevel = findLevel(dep, new Set(visited)) + 1;
          maxLevel = Math.max(maxLevel, depLevel);
        }
      }
      
      return maxLevel;
    };
    
    // Assign levels to activities
    filteredActivities.forEach(activity => {
      const level = findLevel(activity);
      if (!levels[level]) levels[level] = [];
      levels[level].push(activity);
    });
    
    // Draw activities by level
    const levelKeys = Object.keys(levels).map(Number).sort();
    const newPositions: Record<string, { 
      x: number; 
      y: number; 
      width: number; 
      height: number; 
      titleX: number; 
      titleY: number; 
      titleWidth: number; 
      titleHeight: number; 
    }> = {};
    
    levelKeys.forEach(level => {
      const activitiesInLevel = levels[level];
      const x = level * levelWidth + levelWidth / 2;
      
      activitiesInLevel.forEach((activity, index) => {
        const y = (index + 1) * nodeSpacing;
        
        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        
        // Color based on status
        let fillColor = '#9CA3AF'; // gray-400
        switch (activity.status) {
          case 'not_started':
            fillColor = '#9CA3AF'; // gray-400
            break;
          case 'in_progress':
            fillColor = '#60A5FA'; // blue-400
            break;
          case 'completed':
            fillColor = '#34D399'; // green-400
            break;
          case 'cancelled':
            fillColor = '#F87171'; // red-400
            break;
        }
        
        // Highlight if hovered
        if (hoveredActivity === activity.id) {
          ctx.fillStyle = '#93C5FD'; // blue-300
          ctx.fill();
          ctx.strokeStyle = '#2563EB'; // blue-600
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        
        // Draw label
        ctx.font = '12px Arial';
        ctx.fillStyle = '#1F2937'; // gray-800
        ctx.textAlign = 'center';
        const titleWidth = ctx.measureText(activity.title).width;
        const titleX = x - titleWidth / 2; // Center the text horizontally
        const titleY = y + nodeRadius + 15;
        ctx.fillText(activity.title, x, y + nodeRadius + 15);
        
        // Draw plan name
        const plan = plans.find(p => p.id === activity.plan_id);
        if (plan) {
          ctx.font = '10px Arial';
          ctx.fillStyle = '#1E40AF'; // text-blue-800
          ctx.fillText(plan.title, x, y + nodeRadius * 2 + 15);
        }
        
        // Store position for drawing connections and interaction
        newPositions[activity.id] = { 
          x, 
          y, 
          width: nodeRadius * 2, 
          height: nodeRadius * 2,
          titleX,
          titleY,
          titleWidth,
          titleHeight: 12, 
        };
      });
    });
    
    // Update positions state
    setActivityPositions(newPositions);
    
    // Draw connections
    ctx.strokeStyle = '#D1D5DB'; // gray-300
    ctx.lineWidth = 2;
    
    filteredActivities.forEach(activity => {
      const source = newPositions[activity.id];
      
      activity.dependencies.forEach(depId => {
        const target = newPositions[depId];
        
        if (source && target) {
          // Draw arrow from dependency to dependent
          const startX = target.x + nodeRadius;
          const startY = target.y;
          const endX = source.x - nodeRadius;
          const endY = source.y;
          
          // Draw curved line
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          
          const controlX = (startX + endX) / 2;
          const controlY = (startY + endY) / 2;
          
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          
          // Highlight if either activity is hovered
          if (hoveredActivity === activity.id || hoveredActivity === depId) {
            ctx.strokeStyle = '#2563EB'; // blue-600
            ctx.lineWidth = 3;
          } else {
            ctx.strokeStyle = '#D1D5DB'; // gray-300
            ctx.lineWidth = 2;
          }
          
          ctx.stroke();
          
          // Draw arrow
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowSize = 10;
          
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          
          if (hoveredActivity === activity.id || hoveredActivity === depId) {
            ctx.fillStyle = '#2563EB'; // blue-600
          } else {
            ctx.fillStyle = '#D1D5DB'; // gray-300
          }
          
          ctx.fill();
        }
      });
    });
    
  }, [filteredActivities, hoveredActivity]);
  
  // Handle mouse events for interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if mouse is over any activity
    let hoveredId: string | null = null;
    
    for (const [id, position] of Object.entries(activityPositions)) {
      const distance = Math.sqrt(
        Math.pow(x - position.x, 2) + 
        Math.pow(y - position.y, 2)
      );
      
      if (distance <= 20) { // nodeRadius
        hoveredId = id;
        canvas.style.cursor = 'pointer';
        break;
      }
    }
    
    if (!hoveredId) {
      canvas.style.cursor = 'default';
    }
    
    if (hoveredId !== hoveredActivity) {
      setHoveredActivity(hoveredId);
    }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is within any activity
    for (const [id, position] of Object.entries(activityPositions)) {
      const distance = Math.sqrt(
        Math.pow(x - position.x, 2) + 
        Math.pow(y - position.y, 2)
      );
      
      if (distance <= 20) { // nodeRadius
        const activity = filteredActivities.find(a => a.id === id);
        if (activity) {
          setSelectedActivity(activity);
        }
        break;
      }

      // Check for click inside the activity title label
      if (
        x >= position.titleX &&
        x <= position.titleX + position.titleWidth &&
        y >= position.titleY - position.titleHeight &&
        y <= position.titleY
      ) {
        const activity = filteredActivities.find(a => a.id === id);
        if (activity) {
          setSelectedActivity(activity); // Set the selected activity when title is clicked
        }
        break;
      }

    }
  };
  
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
        <p className="text-gray-500">No activities found to display in the dependency graph.</p>
      </div>
    );
  }
  
  return (
    <>
      <ActivityFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPlans={selectedPlans}
        onPlanSelectionChange={setSelectedPlans}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Click on an activity circle to view details.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <canvas 
              ref={canvasRef} 
              className="w-full" 
              style={{ minHeight: '600px' }}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-center space-x-6 text-xs">
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-gray-400 mr-1"></span>
            <span>Not Started</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-blue-400 mr-1"></span>
            <span>In Progress</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-green-400 mr-1"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-red-400 mr-1"></span>
            <span>Cancelled</span>
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
    </>
  );
};

export default ActivityDependencyGraph;