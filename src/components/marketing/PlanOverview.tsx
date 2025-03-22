import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Calendar, Target, BarChart2, Users, Building, Edit, Save, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { MarketingPlan, MarketingActivity } from '../../types';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useAuthStore } from '../../store/authStore';
import { getActivityIcon, getActivityColor, getActivityStatusColor, getActivityTypeInfo } from '../../utils/activityTypes';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import ActivityForm from './ActivityForm';
import ActivitySelector from './ActivitySelector';
import PlanForm from './PlanForm';
import EditableTitle from '../ui/EditableTitle';

interface PlanOverviewProps {
  plan: MarketingPlan;
  activities: MarketingActivity[];
}

const PlanOverview: React.FC<PlanOverviewProps> = ({ plan, activities }) => {
  const { companies, hasPermission } = useAuthStore();
  const { updatePlan } = useMarketingPlanStore();
  const company = companies.find(c => c.id === plan.company_id);
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(plan.description);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [strategyText, setStrategyText] = useState(
    plan.strategy_overview || "This marketing plan encompasses various activities designed to achieve our marketing objectives across different channels. Below is a breakdown of our planned activities and their intended outcomes."
  );
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [editingTypeDescription, setEditingTypeDescription] = useState<string | null>(null);
  const [typeDescriptions, setTypeDescriptions] = useState<Record<string, string>>({});

  // Check if user has edit permissions
  const canEdit = hasPermission(plan.company_id, 'edit');

  // Group activities by type
  const groupedActivities = activities.reduce((acc, activity) => {
    const type = activity.activity_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(activity);
    return acc;
  }, {} as Record<string, MarketingActivity[]>);

  // Sort activities by publish date
  Object.values(groupedActivities).forEach(group => {
    group.sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime());
  });

  // Calculate timeline range
  const startDate = activities.length > 0 
    ? new Date(Math.min(...activities.map(a => new Date(a.start_date).getTime())))
    : new Date();
  
  const endDate = activities.length > 0
    ? new Date(Math.max(...activities.map(a => new Date(a.publish_date).getTime())))
    : new Date();

  const handleDescriptionSave = async () => {
    if (description !== plan.description) {
      await updatePlan(plan.id, { description });
    }
    setIsEditingDescription(false);
  };

  const handleStrategySave = async () => {
    await updatePlan(plan.id, { strategy_overview: strategyText });
    setIsEditingStrategy(false);
  };

  const handleAddActivity = (type: string) => {
    setSelectedActivityType(type);
    setIsAddingActivity(true);
  };

  const handleTypeDescriptionEdit = (type: string) => {
    setEditingTypeDescription(type);
    if (!typeDescriptions[type]) {
      const typeInfo = getActivityTypeInfo(type);
      setTypeDescriptions({
        ...typeDescriptions,
        [type]: typeInfo.description
      });
    }
  };

  const handleTypeDescriptionSave = (type: string) => {
    setEditingTypeDescription(null);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <EditableTitle
              value={plan.title}
              onChange={(newTitle) => updatePlan(plan.id, { title: newTitle })}
              className="text-2xl font-bold text-gray-900"
            />
            
            <div className="mt-2 relative">
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDescription(plan.description);
                        setIsEditingDescription(false);
                      }}
                    >
                      <X size={14} className="mr-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDescriptionSave}
                    >
                      <Save size={14} className="mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-600 group cursor-pointer"
                  onClick={() => canEdit && setIsEditingDescription(true)}
                >
                  <p className="inline">{plan.description}</p>
                  {canEdit && (
                    <Edit size={14} className="ml-2 inline-block opacity-0 group-hover:opacity-100 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2 text-blue-500" />
                <span>
                  {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </span>
              </div>
              
              {company && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building size={16} className="mr-2 text-blue-500" />
                  <span>{company.name}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600">
                <Users size={16} className="mr-2 text-blue-500" />
                <span>{plan.team_members.length} team members</span>
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            plan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            plan.status === 'active' ? 'bg-green-100 text-green-800' :
            plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Marketing Strategy Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Target size={20} className="text-blue-500" />
            <h2 className="text-lg font-medium text-gray-900">Marketing Strategy Overview</h2>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none">
          {isEditingStrategy ? (
            <div className="space-y-2">
              <textarea
                value={strategyText}
                onChange={(e) => setStrategyText(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                placeholder="Describe your marketing strategy..."
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStrategyText(plan.strategy_overview || strategyText);
                    setIsEditingStrategy(false);
                  }}
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStrategySave}
                >
                  <Save size={14} className="mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="group cursor-pointer relative"
              onClick={() => canEdit && setIsEditingStrategy(true)}
            >
              <p>{plan.strategy_overview || strategyText}</p>
              {canEdit && (
                <Edit 
                  size={14} 
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity" 
                />
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Activity Sections */}
      {Object.entries(groupedActivities).map(([type, typeActivities]) => {
        const typeInfo = getActivityTypeInfo(type);
        const Icon = getActivityIcon(type);
        const isEditing = editingTypeDescription === type;
        const description = typeDescriptions[type] || typeInfo.description;
        
        return (
          <Card key={type}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon size={20} className="text-blue-500" />
                  <h2 className="text-lg font-medium text-gray-900">{typeInfo.name}</h2>
                </div>
                
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={() => handleAddActivity(type)}
                  >
                    Add Activity
                  </Button>
                )}
              </div>
              
              <div className="prose prose-sm max-w-none">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={description}
                      onChange={(e) => setTypeDescriptions({
                        ...typeDescriptions,
                        [type]: e.target.value
                      })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTypeDescriptions({
                            ...typeDescriptions,
                            [type]: typeInfo.description
                          });
                          setEditingTypeDescription(null);
                        }}
                      >
                        <X size={14} className="mr-1" />
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTypeDescriptionSave(type)}
                      >
                        <Save size={14} className="mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group cursor-pointer relative"
                    onClick={() => canEdit && handleTypeDescriptionEdit(type)}
                  >
                    <p>{description}</p>
                    {canEdit && (
                      <Edit 
                        size={14} 
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity" 
                      />
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {typeActivities.map(activity => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <EditableTitle
                          value={activity.title}
                          onChange={(newTitle) => updatePlan(plan.id, { title: newTitle })}
                          className="text-base font-medium text-gray-900"
                        />
                        
                        <div className="mt-1 relative group cursor-pointer">
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          {canEdit && (
                            <Edit size={14} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          Publish date: {format(new Date(activity.publish_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'not_started' ? 'bg-gray-100 text-gray-800' :
                        activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                    
                    {activity.budget && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Budget:</strong> ${activity.budget.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Analytics and Metrics */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <BarChart2 size={20} className="text-blue-500" />
          <h2 className="text-lg font-medium text-gray-900">Expected Outcomes</h2>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <p>This marketing plan includes:</p>
          <ul>
            {Object.entries(groupedActivities).map(([type, activities]) => {
              const typeInfo = getActivityTypeInfo(type);
              return (
                <li key={type}>
                  {activities.length} {typeInfo.name} {activities.length === 1 ? 'activity' : 'activities'}
                </li>
              );
            })}
          </ul>
          
          <p className="mt-4">
            Total planned activities: {activities.length}<br />
            Timeline duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      </Card>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isAddingActivity}
        onClose={() => setIsAddingActivity(false)}
        title="Add New Activity"
        size="lg"
      >
        <ActivityForm
          planId={plan.id}
          activityType={selectedActivityType || undefined}
          onClose={() => setIsAddingActivity(false)}
        />
      </Modal>
    </div>
  );
};

export default PlanOverview;