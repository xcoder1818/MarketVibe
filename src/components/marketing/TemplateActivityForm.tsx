import React, { useState } from 'react';
import { useTemplateStore } from '../../store/templateStore';
import { TemplateActivity, ActivityType } from '../../types';
import { ACTIVITY_TYPES } from '../../utils/activityTypes';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface TemplateActivityFormProps {
  templateId: string;
  activityId?: string;
  onClose: () => void;
}

const TemplateActivityForm: React.FC<TemplateActivityFormProps> = ({ 
  templateId, 
  activityId,
  onClose 
}) => {
  const { addActivity, updateActivity, templates, loading, error } = useTemplateStore();
  
  const [formData, setFormData] = useState<Partial<TemplateActivity>>({
    title: '',
    description: '',
    activity_type: 'blog_article',
    duration: 7,
    order_index: 0,
    dependencies: [],
    has_form: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else if (name === 'duration') {
      setFormData({
        ...formData,
        duration: parseInt(value) || 7
      });
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
      if (activityId) {
        await updateActivity(templateId, activityId, formData);
      } else {
        await addActivity(templateId, formData as any);
      }
      onClose();
    } catch (err) {
      console.error('Error saving activity:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Activity Title"
        name="title"
        type="text"
        placeholder="Write blog post"
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
          placeholder="Describe what this activity involves..."
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
        </div>
        
        <Input
          label="Duration (days)"
          name="duration"
          type="number"
          min="1"
          value={formData.duration?.toString()}
          onChange={handleChange}
          required
          fullWidth
        />
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
              onChange={handleChange}
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
      
      {error && (
        <div className="text-sm text-red-600 mt-1">
          {error}
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
          {activityId ? 'Update Activity' : 'Add Activity'}
        </Button>
      </div>
    </form>
  );
};

export default TemplateActivityForm;