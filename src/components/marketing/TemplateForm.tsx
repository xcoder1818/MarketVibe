import React, { useState, useEffect } from 'react';
import { Plus, FileText, Building, Lock, Unlock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTemplateStore } from '../../store/templateStore';
import { ActivityType } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ActivitySelector from './ActivitySelector';
import ActivityForm from './ActivityForm';

interface TemplateFormProps {
  templateId?: string;
  onClose: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ templateId, onClose }) => {
  const { currentCompanyId, hasPermission } = useAuthStore();
  const { 
    templates, 
    createTemplate, 
    updateTemplate, 
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActivityFixed,
    setTemplateFixedActivities,
    loading, 
    error 
  } = useTemplateStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    strategy_overview: '',
    company_id: currentCompanyId || undefined,
    is_public: false,
    fixed_activities: false
  });

  const [isActivitySelectorOpen, setIsActivitySelectorOpen] = useState(false);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  useEffect(() => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData({
          title: template.title,
          description: template.description || '',
          strategy_overview: template.strategy_overview || '',
          company_id: template.company_id || undefined,
          is_public: template.is_public,
          fixed_activities: template.fixed_activities || false
        });
      }
    }
  }, [templateId, templates]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });

      // If this is the fixed_activities toggle, update the template
      if (name === 'fixed_activities' && templateId) {
        setTemplateFixedActivities(templateId, checkbox.checked);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (templateId) {
        await updateTemplate(templateId, formData);
      } else {
        await createTemplate({
          ...formData,
          created_by: 'user123', // Replace with actual user ID
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  const handleSelectActivityType = (type: ActivityType) => {
    setSelectedActivityType(type);
    setIsActivitySelectorOpen(false);
    setIsActivityFormOpen(true);
  };

  const handleActivitySubmit = async (activity: any) => {
    if (!templateId) return;

    try {
      if (selectedActivityId) {
        await updateActivity(templateId, selectedActivityId, activity);
      } else {
        await addActivity(templateId, {
          ...activity,
          fixed: formData.fixed_activities // New activities inherit template's fixed setting
        });
      }
      setIsActivityFormOpen(false);
      setSelectedActivityId(null);
      setSelectedActivityType(null);
    } catch (err) {
      console.error('Error saving activity:', err);
    }
  };

  const handleEditActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    setIsActivityFormOpen(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!templateId) return;
    
    if (window.confirm('Are you sure you want to delete this activity?')) {
      await deleteActivity(templateId, activityId);
    }
  };

  const handleToggleActivityFixed = async (activityId: string) => {
    if (!templateId) return;
    await toggleActivityFixed(templateId, activityId);
  };

  const template = templateId ? templates.find(t => t.id === templateId) : null;
  const canMakePublic = hasPermission(currentCompanyId || '', 'admin');

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Template Name"
          name="title"
          type="text"
          placeholder="Q3 Marketing Campaign Template"
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
            placeholder="Describe what this template is best used for..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        
        <div className="w-full">
          <label 
            htmlFor="strategy_overview" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Strategy Overview
          </label>
          <textarea
            id="strategy_overview"
            name="strategy_overview"
            rows={5}
            className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Outline the marketing strategy this template follows..."
            value={formData.strategy_overview}
            onChange={handleChange}
          />
        </div>

        {templateId && (
          <div className="w-full">
            <div className="flex items-center">
              <input
                id="fixed_activities"
                name="fixed_activities"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.fixed_activities}
                onChange={handleChange}
              />
              <label htmlFor="fixed_activities" className="ml-2 block text-sm text-gray-700">
                Enable fixed activities
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              When enabled, activities can be marked as fixed and cannot be modified in plans created from this template
            </p>
          </div>
        )}

        {canMakePublic && (
          <div className="w-full">
            <div className="flex items-center">
              <input
                id="is_public"
                name="is_public"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.is_public}
                onChange={handleChange}
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                Make this template public
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Public templates are available to all users of the platform
            </p>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-600 mt-1">
            {error}
          </div>
        )}

        {templateId && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Template Activities</h3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => setIsActivitySelectorOpen(true)}
              >
                Add Activity
              </Button>
            </div>

            <div className="space-y-4">
              {template?.activities.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActivityFixed(activity.id)}
                      leftIcon={activity.fixed ? <Lock size={16} /> : <Unlock size={16} />}
                    >
                      {activity.fixed ? 'Fixed' : 'Modifiable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditActivity(activity.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteActivity(activity.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {template?.activities.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText size={40} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No activities added yet</p>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={() => setIsActivitySelectorOpen(true)}
                    className="mt-4"
                  >
                    Add Your First Activity
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            variant="primary" 
            isLoading={loading}
          >
            {templateId ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </form>

      {/* Activity Selector Modal */}
      <Modal
        isOpen={isActivitySelectorOpen}
        onClose={() => setIsActivitySelectorOpen(false)}
        title="Select Activity Type"
        size="lg"
      >
        <ActivitySelector
          onSelectActivity={handleSelectActivityType}
          onClose={() => setIsActivitySelectorOpen(false)}
        />
      </Modal>

      {/* Activity Form Modal */}
      {(isActivityFormOpen && (selectedActivityType || selectedActivityId)) && (
        <Modal
          isOpen={isActivityFormOpen}
          onClose={() => {
            setIsActivityFormOpen(false);
            setSelectedActivityId(null);
            setSelectedActivityType(null);
          }}
          title={selectedActivityId ? "Edit Activity" : "Add Activity"}
          size="lg"
        >
          <ActivityForm
            planId={templateId || ''}
            activityId={selectedActivityId || undefined}
            activityType={selectedActivityType || undefined}
            onClose={() => {
              setIsActivityFormOpen(false);
              setSelectedActivityId(null);
              setSelectedActivityType(null);
            }}
            onSubmit={handleActivitySubmit}
          />
        </Modal>
      )}
    </div>
  );
};

export default TemplateForm;