import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Plus, List, Baseline as Timeline, GitBranch, Calendar, Kanban, Edit } from 'lucide-react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { ActivityType, MarketingActivity } from '../../types';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ActivityForm from '../../components/marketing/ActivityForm';
import ActivityList from '../../components/marketing/ActivityList';
import ActivityTimeline from '../../components/marketing/ActivityTimeline';
import ActivityDependencyGraph from '../../components/marketing/ActivityDependencyGraph';
import ActivityGantt from '../../components/marketing/ActivityGantt';
import ActivityKanban from '../../components/marketing/ActivityKanban';
import ActivitySelector from '../../components/marketing/ActivitySelector';
import SubtaskList from '../../components/marketing/SubtaskList';
import { format } from 'date-fns';
import { getActivityStatusColor } from '../../utils/activityTypes';

const ActivitiesPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const location = useLocation();
  const { 
    plans, 
    activities, 
    activityTemplates,
    fetchPlans, 
    fetchActivities,
    fetchActivityTemplates,
    updateActivity,
    updateSubtask,
    checkActivityDependencies,
    checkSubtaskDependencies,
    createActivityFromType,
    loading 
  } = useMarketingPlanStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isActivitySelectorOpen, setIsActivitySelectorOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'dependencies' | 'gantt' | 'kanban'>('list');
  const [selectedActivity, setSelectedActivity] = useState<MarketingActivity | null>(null);
  
  useEffect(() => {
    if (!plans.length) {
      fetchPlans();
    }
    
    if (planId) {
      fetchActivities(planId);
      fetchActivityTemplates();
    }
  }, [fetchPlans, fetchActivities, fetchActivityTemplates, planId, plans.length]);

  // Check for activity to edit from sessionStorage
  useEffect(() => {
    const editActivityId = sessionStorage.getItem('editActivityId');
    if (editActivityId && activities.length > 0) {
      const activityToEdit = activities.find(a => a.id === editActivityId);
      if (activityToEdit) {
        setSelectedActivityId(editActivityId);
        setIsCreateModalOpen(true);
        // Clear sessionStorage to prevent reopening
        sessionStorage.removeItem('editActivityId');
      }
    }
  }, [activities]);
  
  const plan = planId ? plans.find(p => p.id === planId) : null;
  
  const handleEditActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    setIsCreateModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedActivityId(null);
  };
  
  const handleUpdateStatus = async (id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => {
    await updateActivity(id, { status });
  };
  
  const handleUpdateSubtaskStatus = async (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => {
    await updateSubtask(activityId, subtaskId, { status });
  };

  const handleSelectActivity = async (activityType: string) => {
    if (!planId) return;
    
    // Create a new activity of the selected type
    await createActivityFromType(activityType as any, planId);
    setIsActivitySelectorOpen(false);
  };

  const handleRemoveDependency = async (activityId: string, dependencyId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const updatedDependencies = activity.dependencies.filter(id => id !== dependencyId);
    await updateActivity(activityId, { dependencies: updatedDependencies });
  };

  const handleActivitySelect = (activity: MarketingActivity) => {
    setSelectedActivity(activity);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {plan ? `${plan.title} - Activities` : 'Marketing Activities'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage marketing activities
            </p>
          </div>
          <div className="flex space-x-3">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-blue-50 text-blue-600 z-10' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} className="mr-2" />
                List
              </button>
              <button
                type="button"
                className={`relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 text-sm font-medium ${
                  viewMode === 'kanban' 
                    ? 'bg-blue-50 text-blue-600 z-10' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban size={16} className="mr-2" />
                Kanban
              </button>
              <button
                type="button"
                className={`relative inline-flex items-center px-3 py-2 border-t border-b border-l border-gray-300 text-sm font-medium ${
                  viewMode === 'timeline' 
                    ? 'bg-blue-50 text-blue-600 z-10' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('timeline')}
              >
                <Timeline size={16} className="mr-2" />
                Timeline
              </button>
              <button
                type="button"
                className={`relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 text-sm font-medium ${
                  viewMode === 'gantt' 
                    ? 'bg-blue-50 text-blue-600 z-10' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('gantt')}
              >
                <Calendar size={16} className="mr-2" />
                Gantt
              </button>
              <button
                type="button"
                className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  viewMode === 'dependencies' 
                    ? 'bg-blue-50 text-blue-600 z-10' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode('dependencies')}
              >
                <GitBranch size={16} className="mr-2" />
                Dependencies
              </button>
            </div>
            
            <Button 
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsActivitySelectorOpen(true)}
            >
              New Activity
            </Button>
          </div>
        </div>
      </div>
      
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading activities...</p>
          </div>
        ) : (
          <div>
            {viewMode === 'list' && (
              <ActivityList 
                activities={activities} 
                onEditActivity={handleEditActivity}
                onUpdateStatus={handleUpdateStatus}
                onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                checkDependencies={checkActivityDependencies}
                checkSubtaskDependencies={checkSubtaskDependencies}
                onRemoveDependency={handleRemoveDependency}
              />
            )}
            
            {viewMode === 'kanban' && (
              <ActivityKanban 
                activities={activities}
                onEditActivity={handleEditActivity}
                onUpdateStatus={handleUpdateStatus}
                onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                checkDependencies={checkActivityDependencies}
                checkSubtaskDependencies={checkSubtaskDependencies}
                onRemoveDependency={handleRemoveDependency}
              />
            )}
            
            {viewMode === 'timeline' && (
              // <ActivityTimeline activities={activities} />
              <ActivityTimeline 
                activities={activities}
                onEditActivity={handleEditActivity}
                onUpdateStatus={handleUpdateStatus}
                onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                checkDependencies={checkActivityDependencies}
                checkSubtaskDependencies={checkSubtaskDependencies}
                onRemoveDependency={handleRemoveDependency}
              />
            )}
            
            {viewMode === 'gantt' && (
              // <ActivityGantt activities={activities} />
              <ActivityGantt 
                activities={activities}
                onEditActivity={handleEditActivity}
                onUpdateStatus={handleUpdateStatus}
                onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                checkDependencies={checkActivityDependencies}
                checkSubtaskDependencies={checkSubtaskDependencies}
                onRemoveDependency={handleRemoveDependency}
              />
            )}
            
            {viewMode === 'dependencies' && (
              // <ActivityDependencyGraph activities={activities} />
              <ActivityDependencyGraph 
                activities={activities}
                onEditActivity={handleEditActivity}
                onUpdateStatus={handleUpdateStatus}
                onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                checkDependencies={checkActivityDependencies}
                checkSubtaskDependencies={checkSubtaskDependencies}
                onRemoveDependency={handleRemoveDependency}
              />
            )}
          </div>
        )}
      </Card>
      
      {/* Activity Selector Modal */}
      <Modal
        isOpen={isActivitySelectorOpen}
        onClose={() => setIsActivitySelectorOpen(false)}
        title="Select Activity Type"
        size="lg"
      >
        <ActivitySelector 
          onSelectActivity={handleSelectActivity}
          onClose={() => setIsActivitySelectorOpen(false)}
        />
      </Modal>
      
      {/* Create/Edit Activity Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title={selectedActivityId ? "Edit Activity" : "Create New Activity"}
        size="lg"
      >
        <ActivityForm 
          planId={planId || ''} 
          activityId={selectedActivityId || undefined}
          onClose={handleCloseModal} 
        />
      </Modal>

      {/* Activity Details Modal (from Cloud View) */}
      {selectedActivity && (
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={selectedActivity.title}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Description</h3>
              <p className="mt-1 text-sm text-gray-600">
                {selectedActivity.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Status</h3>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityStatusColor(selectedActivity.status)}`}>
                    {selectedActivity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Publish Date</h3>
                <p className="mt-1 text-sm text-gray-600 flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {format(new Date(selectedActivity.publish_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Subtasks</h3>
              <SubtaskList 
                subtasks={selectedActivity.subtasks} 
                onUpdateStatus={(subtaskId, status) => handleUpdateSubtaskStatus(selectedActivity.id, subtaskId, status)}
                checkDependencies={(subtaskId) => checkSubtaskDependencies(selectedActivity.id, subtaskId)}
                readOnly={true}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedActivity(null)}
              >
                Close
              </Button>
              
              <Button
                variant="primary"
                leftIcon={<Edit size={16} />}
                onClick={() => {
                  handleEditActivity(selectedActivity.id);
                  setSelectedActivity(null);
                }}
              >
                Edit Activity
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ActivitiesPage;