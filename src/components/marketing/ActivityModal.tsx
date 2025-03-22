import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Edit, User, Link as LinkIcon, AlertCircle, Calendar, FileText } from 'lucide-react';
import { MarketingActivity } from '../../types';
import { getActivityStatusColor, getActivityIcon } from '../../utils/activityTypes';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import SubtaskList from './SubtaskList';

interface ActivityModalProps {
  activity: MarketingActivity | null;
  onClose: () => void;
  onEdit?: (activityId: string) => void;
  onUpdateStatus?: (activityId: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => void;
  onUpdateSubtaskStatus?: (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  onRemoveDependency?: (activityId: string, dependencyId: string) => void;
  checkDependencies?: (activityId: string) => boolean;
  checkSubtaskDependencies?: (activityId: string, subtaskId: string) => boolean;
  activities?: MarketingActivity[];
  canEdit?: boolean;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  activity,
  onClose,
  onEdit,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  onRemoveDependency,
  checkDependencies,
  checkSubtaskDependencies,
  activities = [],
  canEdit = true,
}) => {
  const { plans } = useMarketingPlanStore();
  
  if (!activity) return null;

  const canStartActivity = checkDependencies ? checkDependencies(activity.id) : true;
  const plan = plans.find(p => p.id === activity.plan_id);

  return (
    <Modal
      isOpen={!!activity}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <span>{activity.title}</span>
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
      }
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Description</h3>
          <p className="mt-1 text-sm text-gray-600">
            {activity.description || 'No description provided.'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Status</h3>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityStatusColor(activity.status)}`}>
                {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">Type</h3>
            <p className="mt-1 text-sm text-gray-600 capitalize">
              {activity.activity_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Start Date</h3>
            <p className="mt-1 text-sm text-gray-600 flex items-center">
              <Calendar size={14} className="mr-1" />
              {format(new Date(activity.start_date), 'MMM d, yyyy')}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">End Date</h3>
            <p className="mt-1 text-sm text-gray-600 flex items-center">
              <Clock size={14} className="mr-1" />
              {format(new Date(activity.publish_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700">Client Visibility</h3>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activity.client_visible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {activity.client_visible ? 'Visible to clients' : 'Hidden from clients'}
            </span>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Dependencies</h3>
          {activity.dependencies.length > 0 ? (
            <div className="space-y-2">
              {activity.dependencies.map(depId => {
                const dependency = activities.find(a => a.id === depId);
                return dependency ? (
                  <div key={depId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <LinkIcon size={14} className="mr-2 text-gray-400" />
                      <span className="text-sm">{dependency.title}</span>
                    </div>
                    {onRemoveDependency && canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveDependency(activity.id, depId);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <AlertCircle size={16} />
                      </button>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No dependencies</p>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Subtasks</h3>
          <SubtaskList 
            subtasks={activity.subtasks} 
            onUpdateStatus={onUpdateSubtaskStatus ? 
              (subtaskId, status) => onUpdateSubtaskStatus(activity.id, subtaskId, status) : 
              undefined
            }
            checkDependencies={checkSubtaskDependencies ? 
              (subtaskId) => checkSubtaskDependencies(activity.id, subtaskId) : 
              undefined
            }
            readOnly={!canEdit}
            activities={activities}
            activityTitle={activity.title} 
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          
          {canEdit && (
            <>

              {onEdit && (
                <Button
                  variant="primary"
                  leftIcon={<Edit size={16} />}
                  onClick={() => {
                    onEdit(activity.id);
                    onClose();
                  }}
                >
                  Edit Activity
                </Button>
              )}
              
              {/* <Button
                variant="primary"
                leftIcon={<Edit size={16} />}
                onClick={() => {
                  if (onEdit) {
                    onEdit(activity.id);
                    console.log("on-edit");
                  }

                  else {
                    console.log("not-edit");
                  }
                  if (onClose) {
                    onClose();
                  }
                }}
              >
                Edit Activity
              </Button> */}

              {onUpdateStatus && activity.status === 'not_started' && (
                <Button
                  variant="success"
                  onClick={() => {
                    onUpdateStatus(activity.id, 'in_progress');
                    onClose();
                  }}
                  disabled={!canStartActivity}
                >
                  {!canStartActivity && (
                    <AlertCircle size={16} className="mr-1" />
                  )}
                  Start Activity
                </Button>
              )}
              
              {onUpdateStatus && activity.status === 'in_progress' && (
                <Button
                  variant="success"
                  onClick={() => {
                    onUpdateStatus(activity.id, 'completed');
                    onClose();
                  }}
                >
                  Complete Activity
                </Button>
              )}

            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ActivityModal;