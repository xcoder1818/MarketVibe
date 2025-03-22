import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, CheckSquare, Calendar, FileText, 
  Users, Clock, AlertTriangle, Activity, Plus, Filter, Search, Building 
} from 'lucide-react';
import { format } from 'date-fns';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useAuthStore } from '../../store/authStore';
import { MarketingActivity } from '../../types';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import TaskForm from '../../components/marketing/TaskForm';
import TaskList from '../../components/marketing/TaskList';
import Input from '../../components/ui/Input';
import { getActivityStatusColor, getActivityIcon } from '../../utils/activityTypes';
import ActivityForm from '../../components/marketing/ActivityForm';
import ActivitySelector from '../../components/marketing/ActivitySelector';
import PlanForm from '../../components/marketing/PlanForm';
import EditableTitle from '../../components/ui/EditableTitle';
import PlanOverview from '../../components/marketing/PlanOverview';

const PlanDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const { 
    plans, 
    currentPlan,
    tasks,
    activities,
    fetchPlans, 
    fetchTasks,
    fetchActivities,
    fetchActivityTemplates,
    updatePlan,
    updateTask,
    updateActivity,
    updateSubtask,
    deletePlan,
    checkActivityDependencies,
    checkSubtaskDependencies,
    createActivityFromType,
    loading, 
    error 
  } = useMarketingPlanStore();
  
  const { companies, hasPermission } = useAuthStore();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isActivitySelectorOpen, setIsActivitySelectorOpen] = useState(false);
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<MarketingActivity | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'activities'>('overview');
  
  const plan = plans.find(p => p.id === planId);
  const planCompany = plan ? companies.find(c => c.id === plan.company_id) : null;
  
  const handleStatusChange = async (newStatus: 'draft' | 'active' | 'completed' | 'archived') => {
    if (planId) {
      await updatePlan(planId, { status: newStatus });
    }
  };
  
  const handleDeletePlan = async () => {
    if (planId) {
      await deletePlan(planId);
      navigate('/plans');
    }
  };

  const handleEditActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    setIsCreateActivityModalOpen(true);
  };

  const handleCloseActivityModal = () => {
    setIsCreateActivityModalOpen(false);
    setSelectedActivityId(null);
  };

  const handleUpdateActivityStatus = async (id: string, status: 'not_started' | 'in_progress' | 'completed' | 'cancelled') => {
    await updateActivity(id, { status });
  };
  
  const handleUpdateSubtaskStatus = async (activityId: string, subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => {
    await updateSubtask(activityId, subtaskId, { status });
  };

  const handleSelectActivity = async (activityType: string) => {
    if (!planId) return;
    
    await createActivityFromType(activityType as any, planId);
    setIsActivitySelectorOpen(false);
  };

  const handleRemoveDependency = async (activityId: string, dependencyId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    const updatedDependencies = activity.dependencies.filter(id => id !== dependencyId);
    await updateActivity(activityId, { dependencies: updatedDependencies });
  };

  const handleEditPlan = () => {
    setIsEditPlanModalOpen(true);
  };

  // Check if user has edit permissions for this plan
  const canEditPlan = plan && hasPermission(plan.company_id, 'edit');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/plans" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        {plan && (
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <EditableTitle
                value={plan.title}
                onChange={(newTitle) => {
                  if (planId) {
                    updatePlan(planId, { title: newTitle });
                  }
                }}
                className="text-2xl font-bold text-gray-900"
              />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                plan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                plan.status === 'active' ? 'bg-green-100 text-green-800' :
                plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
              </span>
              {planCompany && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Building size={12} className="mr-1" />
                  {planCompany.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'overview' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('overview')}
              >
                Overview
              </Button>
              <Button
                variant={viewMode === 'activities' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('activities')}
              >
                Activities
              </Button>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'overview' ? (
        plan && <PlanOverview plan={plan} activities={activities} />
      ) : (
        <div className="space-y-6">
          {/* Activity List */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Marketing Activities</h3>
              {canEditPlan && (
                <Button 
                  variant="primary" 
                  size="sm"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsActivitySelectorOpen(true)}
                >
                  Add Activity
                </Button>
              )}
            </div>
            
            <div className="mb-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  leftIcon={<Search size={18} className="text-gray-400" />}
                />
              </div>
              <div className="sm:w-48">
                <div className="flex items-center">
                  <Filter size={18} className="text-gray-400 mr-2" />
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {activities.map(activity => {
                const ActivityIcon = getActivityIcon(activity.activity_type);
                
                return (
                  <div 
                    key={activity.id}
                    className="p-3 border rounded-md hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="flex items-start">
                      <div className="mr-3">
                        <div className={`p-1.5 rounded-md ${getActivityStatusColor(activity.status)}`}>
                          <ActivityIcon size={16} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityStatusColor(activity.status)}`}>
                            {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                          {activity.description || 'No description'}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Clock size={12} className="mr-1" />
                          Due {format(new Date(activity.publish_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Activity Details Modal */}
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
                  <Clock size={14} className="mr-1" />
                  {format(new Date(selectedActivity.publish_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Client Visibility</h3>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedActivity.client_visible 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedActivity.client_visible ? 'Visible to clients' : 'Hidden from clients'}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Dependencies</h3>
              {selectedActivity.dependencies.length > 0 ? (
                <div className="space-y-2">
                  {selectedActivity.dependencies.map(depId => {
                    const dependency = activities.find(a => a.id === depId);
                    return dependency ? (
                      <div key={depId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center">
                          <span className="text-sm">{dependency.title}</span>
                        </div>
                        {canEditPlan && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDependency(selectedActivity.id, depId);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
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
              <div className="space-y-2">
                {selectedActivity.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        subtask.status === 'completed' ? 'bg-green-500' :
                        subtask.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`}></div>
                      <span className="text-sm">{subtask.title}</span>
                    </div>
                    {canEditPlan && (
                      <div>
                        <Button
                          size="sm"
                          variant={subtask.status === 'todo' ? 'outline' : 
                                  subtask.status === 'in_progress' ? 'primary' : 'success'}
                          onClick={() => {
                            const newStatus = 
                              subtask.status === 'todo' ? 'in_progress' : 
                              subtask.status === 'in_progress' ? 'completed' : 'todo';
                            handleUpdateSubtaskStatus(selectedActivity.id, subtask.id, newStatus as any);
                          }}
                        >
                          {subtask.status === 'todo' ? 'Start' : 
                          subtask.status === 'in_progress' ? 'Complete' : 'Reopen'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedActivity(null)}
              >
                Close
              </Button>
              
              {canEditPlan && (
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
              )}
              
              {canEditPlan && selectedActivity.status === 'not_started' && (
                <Button
                  variant="success"
                  onClick={() => {
                    handleUpdateActivityStatus(selectedActivity.id, 'in_progress');
                    setSelectedActivity(null);
                  }}
                  disabled={!checkActivityDependencies(selectedActivity.id)}
                >
                  Start Activity
                </Button>
              )}
              
              {canEditPlan && selectedActivity.status === 'in_progress' && (
                <Button
                  variant="success"
                  onClick={() => {
                    handleUpdateActivityStatus(selectedActivity.id, 'completed');
                    setSelectedActivity(null);
                  }}
                >
                  Complete Activity
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

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
        isOpen={isCreateActivityModalOpen}
        onClose={handleCloseActivityModal}
        title={selectedActivityId ? "Edit Activity" : "Create New Activity"}
        size="lg"
      >
        <ActivityForm 
          planId={planId || ''} 
          activityId={selectedActivityId || undefined}
          onClose={handleCloseActivityModal} 
        />
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={isEditPlanModalOpen}
        onClose={() => setIsEditPlanModalOpen(false)}
        title="Edit Marketing Plan"
      >
        <PlanForm 
          planId={planId} 
          onClose={() => setIsEditPlanModalOpen(false)} 
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Marketing Plan"
        size="sm"
      >
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete this marketing plan?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone. All tasks, activities, events, and documents associated with this plan will be permanently deleted.
          </p>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeletePlan}
              isLoading={loading}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlanDetailsPage;