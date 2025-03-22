import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, Radio } from 'lucide-react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { getActivityIcon, getActivityStatusColor } from '../../utils/activityTypes';
import { format } from 'date-fns';

interface ActivityLinkProps {
  activityId: string;
  inline?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (activityId: string) => void;
}

const ActivityLink: React.FC<ActivityLinkProps> = ({ 
  activityId, 
  inline = false,
  selectable = false,
  selected = false,
  onSelect
}) => {
  const { activities, plans } = useMarketingPlanStore();
  const activity = activities.find(a => a.id === activityId);
  
  if (!activity) return null;
  
  const plan = plans.find(p => p.id === activity.plan_id);
  const ActivityIcon = getActivityIcon(activity.activity_type);

  const handleClick = (e: React.MouseEvent) => {
    if (selectable && onSelect) {
      e.preventDefault();
      onSelect(activityId);
    }
  };
  
  if (inline) {
    return (
      <Link
        to={`/plans/${activity.plan_id}/activities?activity=${activity.id}`}
        className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
      >
        <ActivityIcon size={14} className="mr-1" />
        {activity.title}
      </Link>
    );
  }
  
  const Component = selectable ? 'div' : Link;
  const props = selectable ? {
    onClick: handleClick,
    className: `block p-4 rounded-lg border ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:border-blue-300 bg-white transition-colors cursor-pointer`
  } : {
    to: `/plans/${activity.plan_id}/activities?activity=${activity.id}`,
    className: "block p-4 rounded-lg border border-gray-200 hover:border-blue-300 bg-white transition-colors"
  };
  
  return (
    <Component {...props}>
      <div className="flex items-start space-x-3">
        {selectable && (
          <div className="flex-shrink-0 mt-2">
            <div className={`w-4 h-4 rounded-full border-2 ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
        )}
        <div className={`p-2 rounded-lg ${getActivityStatusColor(activity.status)}`}>
          <ActivityIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 truncate">{activity.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityStatusColor(activity.status)}`}>
              {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          {plan && (
            <div className="mt-1 flex items-center text-xs text-gray-500">
              <FileText size={12} className="mr-1" />
              {plan.title}
            </div>
          )}
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <Calendar size={12} className="mr-1" />
            Due {format(new Date(activity.publish_date), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </Component>
  );
};

export default ActivityLink;