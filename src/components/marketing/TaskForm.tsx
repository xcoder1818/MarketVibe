import React, { useState } from 'react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface TaskFormProps {
  planId: string;
  onClose: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ planId, onClose }) => {
  const { createTask, loading, error } = useMarketingPlanStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'todo' as const,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask = {
      plan_id: planId,
      title: formData.title,
      description: formData.description,
      due_date: formData.due_date,
      status: formData.status,
    };
    
    await createTask(newTask);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Task Title"
        name="title"
        type="text"
        placeholder="Create social media graphics"
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
          placeholder="Describe the task details..."
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      
      <Input
        label="Due Date"
        name="due_date"
        type="date"
        value={formData.due_date}
        onChange={handleChange}
        required
        fullWidth
      />
      
      <div className="w-full">
        <label 
          htmlFor="status" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Status
        </label>
        <select
          id="status"
          name="status"
          className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={formData.status}
          onChange={handleChange}
          required
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
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
        
        <Button 
          type="submit" 
          variant="primary" 
          isLoading={loading}
        >
          Create Task
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;