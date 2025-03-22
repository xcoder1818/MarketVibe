import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { ACTIVITY_TYPES, getActivityTypeInfo } from '../../utils/activityTypes';
import { ActivityType, MarketingActivity, SubTask } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SubtaskList from './SubtaskList';
import SubtaskForm from './SubtaskForm';

interface ActivityFormProps {
  planId: string;
  activityId?: string;
  onClose: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ planId, activityId, onClose }) => {
  const { user, currentCompanyId } = useAuthStore();
  const { 
    plans,
    activities, 
    createActivity, 
    updateActivity, 
    loading, 
    error,
    createActivityTemplate
  } = useMarketingPlanStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'blog_article' as ActivityType,
    publish_date: format(new Date(), 'yyyy-MM-dd'),
    assigned_to: '',
    dependencies: [] as string[],
    has_form: false,
    budget: '',
    is_template: false,
    client_visible: true
  });

  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [availableDependencies, setAvailableDependencies] = useState<MarketingActivity[]>([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<SubTask | null>(null);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    // Find the current plan
    const currentPlan = plans.find(p => p.id === planId);
    if (currentPlan) {
      setPlan(currentPlan);
    }
    
    if (activityId) {
      const activity = activities.find(a => a.id === activityId);
      if (activity) {
        setFormData({
          title: activity.title,
          description: activity.description,
          activity_type: activity.activity_type,
          publish_date: format(new Date(activity.publish_date), 'yyyy-MM-dd'),
          assigned_to: activity.assigned_to || '',
          dependencies: activity.dependencies || [],
          has_form: activity.has_form,
          budget: activity.budget ? activity.budget.toString() : '',
          is_template: activity.is_template,
          client_visible: activity.client_visible !== undefined ? activity.client_visible : true
        });
        setSubtasks(activity.subtasks || []);
      }
    } else {
      // For new activities, set default subtasks based on activity type
      const typeInfo = getActivityTypeInfo(formData.activity_type);
      
      // Add start_date and due_date to default subtasks
      const today = new Date();
      let currentStartDate = today;
      
      const enhancedSubtasks = typeInfo.defaultSubtasks.map((subtask, index) => {
        // Calculate dates based on dependencies
        const dependencies = subtask.dependencies || [];
        let startDate = currentStartDate;
        
        // If this subtask depends on others, find the latest end date of dependencies
        if (dependencies.length > 0) {
          const dependencyEndDates = dependencies.map(depId => {
            const dep = typeInfo.defaultSubtasks.find(s => s.id === depId);
            return dep && dep.due_date ? new Date(dep.due_date) : today;
          });
          
          const latestEndDate = new Date(Math.max(...dependencyEndDates.map(date => date.getTime())));
          startDate = addDays(latestEndDate, 1);
        }
        
        // Default duration is 2 days
        const duration = 2;
        const dueDate = addDays(startDate, duration);
        
        // Update current start date for next subtask
        currentStartDate = addDays(dueDate, 1);
        
        return {
          ...subtask,
          start_date: format(startDate, 'yyyy-MM-dd'),
          due_date: format(dueDate, 'yyyy-MM-dd'),
          duration
        };
      });
      
      setSubtasks(enhancedSubtasks);
      setFormData(prev => ({
        ...prev,
        has_form: typeInfo.includesForm
      }));
    }
    
    // Filter out activities that can be dependencies
    // (can't depend on itself or create circular dependencies)
    const filtered = activities.filter(a => {
      if (activityId && a.id === activityId) return false;
      if (activityId && a.dependencies.includes(activityId)) return false;
      return true;
    });
    
    setAvailableDependencies(filtered);
  }, [activityId, activities, formData.activity_type, planId, plans]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked,
      });
    } else if (name === 'activity_type') {
      const activityType = value as ActivityType;
      const typeInfo = getActivityTypeInfo(activityType);
      
      // Update subtasks based on activity type
      if (!activityId) {
        // Add start_date and due_date to default subtasks
        const today = new Date();
        let currentStartDate = today;
        
        const enhancedSubtasks = typeInfo.defaultSubtasks.map((subtask, index) => {
          // Calculate dates based on dependencies
          const dependencies = subtask.dependencies || [];
          let startDate = currentStartDate;
          
          // If this subtask depends on others, find the latest end date of dependencies
          if (dependencies.length > 0) {
            const dependencyEndDates = dependencies.map(depId => {
              const dep = typeInfo.defaultSubtasks.find(s => s.id === depId);
              return dep && dep.due_date ? new Date(dep.due_date) : today;
            });
            
            const latestEndDate = new Date(Math.max(...dependencyEndDates.map(date => date.getTime())));
            startDate = addDays(latestEndDate, 1);
          }
          
          // Default duration is 2 days
          const duration = 2;
          const dueDate = addDays(startDate, duration);
          
          // Update current start date for next subtask
          currentStartDate = addDays(dueDate, 1);
          
          return {
            ...subtask,
            start_date: format(startDate, 'yyyy-MM-dd'),
            due_date: format(dueDate, 'yyyy-MM-dd'),
            duration
          };
        });
        
        setSubtasks(enhancedSubtasks);
      }
      
      setFormData({
        ...formData,
        activity_type: activityType,
        has_form: typeInfo.includesForm,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleDependencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setFormData({
      ...formData,
      dependencies: selectedValues,
    });
  };

  const handleSubtaskAdd = (subtask: SubTask) => {
    setSubtasks([...subtasks, subtask]);
    setShowSubtaskForm(false);
    setEditingSubtask(null);
  };

  const handleSubtaskEdit = (subtask: SubTask) => {
    setEditingSubtask(subtask);
    setShowSubtaskForm(true);
  };

  const handleSubtaskUpdate = (updatedSubtask: SubTask) => {
    setSubtasks(subtasks.map(s => s.id === updatedSubtask.id ? updatedSubtask : s));
    setShowSubtaskForm(false);
    setEditingSubtask(null);
  };

  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks(subtasks.filter(s => s.id !== subtaskId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Calculate start and end dates based on subtasks
    let earliestStartDate = new Date();
    let latestEndDate = new Date();
    
    if (subtasks.length > 0) {
      const startDates = subtasks
        .filter(s => s.start_date)
        .map(s => new Date(s.start_date as string));
      
      const endDates = subtasks
        .filter(s => s.due_date)
        .map(s => new Date(s.due_date as string));
      
      if (startDates.length > 0) {
        earliestStartDate = new Date(Math.min(...startDates.map(date => date.getTime())));
      }
      
      if (endDates.length > 0) {
        latestEndDate = new Date(Math.max(...endDates.map(date => date.getTime())));
      }
    }
    
    const activityData = {
      plan_id: planId,
      title: formData.title,
      description: formData.description,
      activity_type: formData.activity_type,
      status: 'not_started' as const,
      publish_date: new Date(formData.publish_date).toISOString(),
      start_date: earliestStartDate.toISOString(),
      end_date: latestEndDate.toISOString(),
      assigned_to: formData.assigned_to || undefined,
      dependencies: formData.dependencies,
      has_form: formData.has_form,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      subtasks: subtasks,
      is_template: formData.is_template,
      client_visible: formData.client_visible
    };
    
    if (activityId) {
      await updateActivity(activityId, activityData);
    } else {
      await createActivity(activityData);
    }
    
    onClose();
  };

  const handleSaveAsTemplate = async () => {
    if (!user) return;
    
    // Calculate start and end dates based on subtasks
    let earliestStartDate = new Date();
    let latestEndDate = new Date();
    
    if (subtasks.length > 0) {
      const startDates = subtasks
        .filter(s => s.start_date)
        .map(s => new Date(s.start_date as string));
      
      const endDates = subtasks
        .filter(s => s.due_date)
        .map(s => new Date(s.due_date as string));
      
      if (startDates.length > 0) {
        earliestStartDate = new Date(Math.min(...startDates.map(date => date.getTime())));
      }
      
      if (endDates.length > 0) {
        latestEndDate = new Date(Math.max(...endDates.map(date => date.getTime())));
      }
    }
    
    const templateData = {
      plan_id: planId,
      title: formData.title,
      description: formData.description,
      activity_type: formData.activity_type,
      status: 'not_started' as const,
      publish_date: new Date(formData.publish_date).toISOString(),
      start_date: earliestStartDate.toISOString(),
      end_date: latestEndDate.toISOString(),
      assigned_to: formData.assigned_to || undefined,
      dependencies: [],
      has_form: formData.has_form,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      subtasks: subtasks,
      is_template: true,
      client_visible: formData.client_visible
    };
    
    await createActivityTemplate(templateData);
    
    // If we're editing an existing activity, update it to mark as template
    if (activityId) {
      await updateActivity(activityId, { is_template: true });
    }
    
    onClose();
  };

  return (
    <div>
      {showSubtaskForm ? (
        <SubtaskForm 
          existingSubtask={editingSubtask}
          existingSubtasks={subtasks}
          onSave={editingSubtask ? handleSubtaskUpdate : handleSubtaskAdd}
          onCancel={() => {
            setShowSubtaskForm(false);
            setEditingSubtask(null);
          }}
          activityDependencies={availableDependencies.map(a => ({ id: a.id, title: a.title }))}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Activity Title"
            name="title"
            type="text"
            placeholder="Q3 Blog Post"
            value={formData.title}
            onChange={handleChange}
            required
            fullWidth
          />
          
          <div className="w-full">
            <label 
              htmlFor="description" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Describe the activity details..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label 
                htmlFor="activity_type" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Activity Type
              </label>
              <select
                id="activity_type"
                name="activity_type"
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.activity_type}
                onChange={handleChange}
                required
              >
                {ACTIVITY_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {getActivityTypeInfo(formData.activity_type).description}
              </p>
            </div>
            
            <div className="w-full">
              <label 
                htmlFor="assigned_to" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assigned To
              </label>
              <input
                id="assigned_to"
                name="assigned_to"
                type="text"
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="User ID or email"
                value={formData.assigned_to}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Publish Date"
              name="publish_date"
              type="date"
              value={formData.publish_date}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <Input
              label="Budget"
              name="budget"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.budget}
              onChange={handleChange}
              helperText="Optional budget for this activity"
              fullWidth
            />
          </div>
          
          <div className="w-full">
            <label 
              htmlFor="dependencies" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dependencies (Hold Ctrl/Cmd to select multiple)
            </label>
            <select
              id="dependencies"
              name="dependencies"
              multiple
              size={Math.min(4, availableDependencies.length || 1)}
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.dependencies}
              onChange={handleDependencyChange}
            >
              {availableDependencies.length > 0 ? (
                availableDependencies.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title} ({getActivityTypeInfo(activity.activity_type).name})
                  </option>
                ))
              ) : (
                <option disabled value="">No available dependencies</option>
              )}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              This activity can't start until all dependencies are completed
            </p>
          </div>
          
          {(formData.activity_type === 'full_web_page' || formData.activity_type === 'landing_page') && (
            <div className="w-full">
              <div className="flex items-center">
                <input
                  id="has_form"
                  name="has_form"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.has_form}
                  onChange={(e) => setFormData({...formData, has_form: e.target.checked})}
                />
                <label htmlFor="has_form" className="ml-2 block text-sm text-gray-700">
                  Includes a form
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Check if this activity includes a form for data collection
              </p>
            </div>
          )}

          <div className="w-full">
            <div className="flex items-center">
              <input
                id="client_visible"
                name="client_visible"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.client_visible}
                onChange={handleChange}
              />
              <label htmlFor="client_visible" className="ml-2 block text-sm text-gray-700">
                Visible to clients
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              When checked, clients with access to this company can view this activity
            </p>
          </div>
          
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Subtasks
              </label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowSubtaskForm(true)}
              >
                Add Subtask
              </Button>
            </div>
            
            <SubtaskList 
              subtasks={subtasks} 
              onEdit={handleSubtaskEdit}
              onDelete={handleSubtaskDelete}
              activities={availableDependencies}
            />
          </div>
          
          <div className="w-full">
            <div className="flex items-center">
              <input
                id="is_template"
                name="is_template"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.is_template}
                onChange={(e) => setFormData({...formData, is_template: e.target.checked})}
              />
              <label htmlFor="is_template" className="ml-2 block text-sm text-gray-700">
                Set as template for this activity type
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Templates can be reused for future activities of this type
            </p>
          </div>
          
          {error && (
            <div className="text-sm text-red-600 mt-1">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
            >
              Cancel
            </Button>
            
            {!formData.is_template && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveAsTemplate}
              >
                Save as Template
              </Button>
            )}
            
            <Button 
              type="submit" 
              variant="primary" 
              isLoading={loading}
            >
              {activityId ? 'Update Activity' : 'Create Activity'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ActivityForm;