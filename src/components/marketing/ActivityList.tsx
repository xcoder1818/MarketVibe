// Update the imports to include useState and useMarketingPlanStore
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Activity, FileText } from 'lucide-react';
import { MarketingActivity } from '../../types';
import { getActivityIcon, getActivityColor, getActivityStatusColor } from '../../utils/activityTypes';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import Card from '../ui/Card';
import ActivityModal from './ActivityModal';
import ActivityFilter from './ActivityFilter';


interface ActivityListProps {
  activities: MarketingActivity[];
  onUpdateStatus: (id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => void;
  onUpdateSubtaskStatus: (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  checkDependencies: (id: string) => boolean;
  checkSubtaskDependencies: (activityId: string, subtaskId: string) => boolean;
  onRemoveDependency: (activityId: string, dependencyId: string) => void;
  onEditActivity?: (id: string) => void;
  canEdit?: boolean;
}

const ActivityList: React.FC<ActivityListProps> = ({ 
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
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No activities found. Create a new activity to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 min-h-[400px]"> {/* Set a minimum height */}
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
      
      {/* <div className="space-y-3">
        {filteredActivities.map(activity => {
          const ActivityIcon = getActivityIcon(activity.activity_type);
          const activityColor = getActivityColor(activity.activity_type);
          const plan = plans.find(p => p.id === activity.plan_id);
          
          return (
            <div 
              key={activity.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden border-l-4 bg-blue-100 text-blue-800 border-blue-200 border-t-2 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedActivity(activity)}
            >
              <div className="px-6 py-4">
                <div className="flex items-start">
                  <div className="mr-3">
                    <div className={`p-1.5 rounded-md ${activityColor}`}>
                      <ActivityIcon size={16} className="text-gray-700" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityStatusColor(activity.status)}`}>
                        {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                      {activity.description || 'No description'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {format(new Date(activity.publish_date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex -space-x-1">
                        {activity.subtasks.map((subtask, i) => (
                          <div 
                            key={subtask.id}
                            className={`w-4 h-4 rounded-full border border-white ${
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
            </div>
          );
        })}
      </div> */}

      <div className="space-y-3">
        {filteredActivities.length > 0 ? (
          filteredActivities.map(activity => {
            const ActivityIcon = getActivityIcon(activity.activity_type);
            const activityColor = getActivityColor(activity.activity_type);
            const plan = plans.find(p => p.id === activity.plan_id);
            
            return (
              <div 
                key={activity.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden border-l-4 bg-blue-100 text-blue-800 border-blue-200 border-t-2 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="mr-3">
                      <div className={`p-1.5 rounded-md ${activityColor}`}>
                        <ActivityIcon size={16} className="text-gray-700" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityStatusColor(activity.status)}`}>
                          {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                        {activity.description || 'No description'}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock size={12} className="mr-1" />
                          {format(new Date(activity.publish_date), 'MMM d, yyyy')}
                        </div>
                        <div className="flex -space-x-1">
                          {/* {activity.subtasks.map((subtask, i) => (
                            <div 
                              key={subtask.id}
                              className={`w-4 h-4 rounded-full border border-white ${
                                subtask.status === 'completed' ? 'bg-green-500' :
                                subtask.status === 'in_progress' ? 'bg-blue-500' :
                                'bg-gray-300'
                              }`}
                              title={subtask.title}
                            />
                          )).slice(0, 3)} */}
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
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm">No activities found.</p>
        )}
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

export default ActivityList;