import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { MarketingActivity } from '../../types';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { getActivityIcon, getActivityColor, getActivityStatusColor } from '../../utils/activityTypes';
import ActivityFilter from './ActivityFilter';
import ActivityModal from './ActivityModal'; 

interface ActivityTimelineProps {
  activities: MarketingActivity[];
  onUpdateStatus: (id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => void;
  onUpdateSubtaskStatus: (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  checkDependencies: (id: string) => boolean;
  checkSubtaskDependencies: (activityId: string, subtaskId: string) => boolean;
  onRemoveDependency: (activityId: string, dependencyId: string) => void;
  onEditActivity?: (id: string) => void;
  canEdit?: boolean;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  activities,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  checkDependencies,
  checkSubtaskDependencies,
  onRemoveDependency,
  onEditActivity,
  canEdit = true,

}) => {
  const { plans } = useMarketingPlanStore();
  const [selectedActivity, setSelectedActivity] = useState<MarketingActivity | null>(null);
  
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

  // Sort activities by date
  const sortedActivities = [...filteredActivities].sort((a, b) => 
    new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()
  );
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No activities found to display in the timeline.</p>
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

      <div className="flow-root">
        {sortedActivities.length > 0 ? (
          <ul className="-mb-8">
            {sortedActivities.map((activity, activityIdx) => {
              const ActivityIcon = getActivityIcon(activity.activity_type);
              const activityColor = getActivityColor(activity.activity_type);
              const statusColor = getActivityStatusColor(activity.status);
              const plan = plans.find(p => p.id === activity.plan_id);
              
              return (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== sortedActivities.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div onClick={() => setSelectedActivity(activity)}>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ${activityColor}`}>
                          <ActivityIcon size={16} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <div className="flex items-center space-x-2" onClick={() => setSelectedActivity(activity)}>
                            <p className="text-sm text-gray-900 font-medium">
                              {activity.title}
                            </p>
                            {plan && (
                              <Link
                                to={`/plans/${plan.id}`}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                              >
                                <FileText size={12} className="mr-1" />
                                {plan.title}
                              </Link>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                              {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {activity.description && activity.description.length > 100
                              ? `${activity.description.substring(0, 100)}...`
                              : activity.description}
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-gray-500">
                          <time dateTime={activity.publish_date}>
                            {format(new Date(activity.publish_date), 'MMM d, yyyy')}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No activities found.</p>
        )}
      </div>


      {/* Render the ActivityModal when an activity is selected */}
      {selectedActivity && (
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
      )}

    </div>
  );
};

export default ActivityTimeline;