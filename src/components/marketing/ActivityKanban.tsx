import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { FileText } from 'lucide-react';
import { MarketingActivity } from '../../types';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { getActivityIcon, getActivityColor} from '../../utils/activityTypes';
import ActivityFilter from './ActivityFilter';
import ActivityModal from './ActivityModal';

// Suppress the defaultProps warning from react-beautiful-dnd
const originalConsoleWarn = console.warn;
console.warn = function filterWarnings(msg, ...args) {
  if (typeof msg === 'string' && msg.includes('defaultProps will be removed from memo components')) {
    return;
  }
  originalConsoleWarn(msg, ...args);
};

interface ActivityKanbanProps {
  activities: MarketingActivity[];
  onUpdateStatus: (id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => void;
  onUpdateSubtaskStatus: (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  checkDependencies: (id: string) => boolean;
  checkSubtaskDependencies: (activityId: string, subtaskId: string) => boolean;
  onRemoveDependency: (activityId: string, dependencyId: string) => void;
  onEditActivity?: (id: string) => void;
  canEdit?: boolean;
}

const ActivityKanban: React.FC<ActivityKanbanProps> = ({
  activities,
  onEditActivity,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  checkDependencies,
  checkSubtaskDependencies,
  onRemoveDependency,
  canEdit = true
}) => {
  const [selectedActivity, setSelectedActivity] = useState<MarketingActivity | null>(null);
  const { plans } = useMarketingPlanStore();

  
  // Add filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlans, setSelectedPlans] = useState(plans.map(p => p.id));
  const [statusFilter, setStatusFilter] = useState('all');

  // Add filtering logic
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesPlan = selectedPlans.includes(activity.plan_id);

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Group activities by status
  const columns = [
    {
      id: 'not_started',
      title: 'Not Started',
      activities: filteredActivities.filter(a => a.status === 'not_started')
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      activities: filteredActivities.filter(a => a.status === 'in_progress')
    },
    {
      id: 'completed',
      title: 'Completed',
      activities: filteredActivities.filter(a => a.status === 'completed')
    },
    {
      id: 'cancelled',
      title: 'Cancelled',
      activities: filteredActivities.filter(a => a.status === 'cancelled')
    }
  ];

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    if (!sourceColumn) return;
    
    const activity = sourceColumn.activities[source.index];
    
    if (destination.droppableId === 'in_progress' && activity.status === 'not_started') {
      const canStart = checkDependencies(activity.id);
      if (!canStart) return;
    }
    
    onUpdateStatus(activity.id, destination.droppableId as any);
  };

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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex overflow-x-auto pb-4 space-x-4">
          {columns.map(column => (
            <div key={column.id} className="flex-shrink-0 w-72">
              <div className="bg-gray-100 rounded-md p-2">
                <h3 className="font-medium text-gray-900 p-2 flex justify-between">
                  {column.title}
                  <span className="bg-white text-gray-600 rounded-full px-2 text-sm">
                    {column.activities.length}
                  </span>
                </h3>
                
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[200px]"
                    >
                      {column.activities.map((activity, index) => {
                        const ActivityIcon = getActivityIcon(activity.activity_type);
                        const activityColor = getActivityColor(activity.activity_type);
                        const plan = plans.find(p => p.id === activity.plan_id);
                        
                        return (
                          <Draggable
                            key={activity.id}
                            draggableId={activity.id}
                            index={index}
                            isDragDisabled={
                              (column.id === 'not_started' && !checkDependencies(activity.id)) ||
                              column.id === 'cancelled' ||
                              !canEdit
                            }
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-2 ${snapshot.isDragging ? 'opacity-70' : ''}`}
                                onClick={() => setSelectedActivity(activity)}
                              >
                                <div className={`bg-white p-3 rounded-lg border ${activityColor} shadow-sm hover:shadow-md transition-shadow`}>
                                  <div className="flex items-start">
                                    <div className="mr-3">
                                      <div className={`p-1.5 rounded-md ${activityColor}`}>
                                        <ActivityIcon size={16} className="text-gray-700" />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <div className="flex flex-col space-y-1">
                                          <h4 className="text-sm font-medium text-gray-900 truncate">
                                            {activity.title}
                                          </h4>
                                          {plan && (
                                            <Link
                                              to={`/plans/${plan.id}`}
                                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <FileText size={12} className="mr-1" />
                                              {plan.title}
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                        {activity.description || 'No description'}
                                      </p>
                                      <div className="mt-2 flex -space-x-1">
                                        {activity.subtasks.map((subtask, i) => (
                                          <div 
                                            key={subtask.id}
                                            className={`w-5 h-5 rounded-full border-2 border-white ${
                                              subtask.status === 'completed' ? 'bg-green-500' :
                                              subtask.status === 'in_progress' ? 'bg-blue-500' :
                                              'bg-gray-300'
                                            }`}
                                            title={subtask.title}
                                          />
                                        )).slice(0, 3)}
                                        {activity.subtasks.length > 3 && (
                                          <span className="text-xs text-gray-500 ml-2">
                                            +{activity.subtasks.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

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

export default ActivityKanban;