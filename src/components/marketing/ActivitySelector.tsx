import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ACTIVITY_TYPES } from '../../utils/activityTypes';
import { ActivityType } from '../../types';
import Button from '../ui/Button';

interface ActivitySelectorProps {
  onSelectActivity: (activityType: ActivityType) => void;
  onClose: () => void;
}

const ActivitySelector: React.FC<ActivitySelectorProps> = ({ onSelectActivity, onClose }) => {
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);
  
  const handleActivityClick = (activityType: ActivityType) => {
    setSelectedActivities([...selectedActivities, activityType]);
    onSelectActivity(activityType);
  };
  
  const getActivityCount = (activityType: ActivityType) => {
    return selectedActivities.filter(type => type === activityType).length;
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          Select the activities you want to add to your marketing plan.
          Click multiple times to add multiple instances of the same activity.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {ACTIVITY_TYPES.map((activity) => {
          const count = getActivityCount(activity.id);
          
          return (
            <div 
              key={activity.id}
              className="relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 flex flex-col items-center text-center"
              onClick={() => handleActivityClick(activity.id)}
            >
              {count > 0 && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {count}
                </div>
              )}
              
              <div className="w-16 h-16 mb-3 flex items-center justify-center">
                {activity.logo ? (
                  <img src={activity.logo} alt={activity.name} className="max-w-full max-h-full" />
                ) : (
                  <div className={`p-3 rounded-full bg-${activity.color}-100 text-${activity.color}-600`}>
                    <Plus size={24} />
                  </div>
                )}
              </div>
              
              <h3 className="text-sm font-medium text-gray-900">{activity.name}</h3>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{activity.description}</p>
              
              {activity.id === 'full_web_page' || activity.id === 'landing_page' ? (
                <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Includes form
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button 
          variant="secondary" 
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </div>
  );
};

export default ActivitySelector;