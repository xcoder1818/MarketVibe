import React, { useState, useRef, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { SubTask } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { v4 as uuidv4 } from 'uuid';
import { AlertCircle, Info, Clock } from 'lucide-react';

interface SubtaskFormProps {
  existingSubtask?: SubTask | null;
  existingSubtasks: SubTask[];
  onSave: (subtask: SubTask) => void;
  onCancel: () => void;
  activityDependencies?: { id: string; title: string }[];
}

const SubtaskForm: React.FC<SubtaskFormProps> = ({ 
  existingSubtask, 
  existingSubtasks, 
  onSave, 
  onCancel,
  activityDependencies = []
}) => {
  const [formData, setFormData] = useState<Omit<SubTask, 'id'>>({
    title: '',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(), 'yyyy-MM-dd'),
    duration: 1,
    assigned_to: '',
    status: 'todo',
    dependencies: [],
    task_duration_hours: 1,
    task_duration_minutes: 0
  });

  const [showDependencyInfo, setShowDependencyInfo] = useState<string | null>(null);

  useEffect(() => {
    if (existingSubtask) {
      setFormData({
        title: existingSubtask.title,
        description: existingSubtask.description || '',
        start_date: existingSubtask.start_date ? format(new Date(existingSubtask.start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        due_date: existingSubtask.due_date ? format(new Date(existingSubtask.due_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        duration: existingSubtask.duration || calculateDuration(
          existingSubtask.start_date ? new Date(existingSubtask.start_date) : new Date(),
          existingSubtask.due_date ? new Date(existingSubtask.due_date) : new Date()
        ),
        assigned_to: existingSubtask.assigned_to || '',
        status: existingSubtask.status,
        dependencies: existingSubtask.dependencies || [],
        task_duration_hours: Math.floor((existingSubtask.task_duration_minutes || 60) / 60),
        task_duration_minutes: (existingSubtask.task_duration_minutes || 60) % 60
      });
    }
  }, [existingSubtask]);

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'duration') {
      const duration = parseInt(value, 10);
      if (!isNaN(duration) && duration > 0) {
        const startDate = formData.start_date ? new Date(formData.start_date) : new Date();
        const dueDate = addDays(startDate, duration);
        
        setFormData({
          ...formData,
          duration,
          due_date: format(dueDate, 'yyyy-MM-dd')
        });
      }
    } else if (name === 'start_date') {
      const startDate = new Date(value);
      let dueDate = formData.due_date ? new Date(formData.due_date) : addDays(startDate, formData.duration || 1);
      
      // If the new start date is after the current due date, adjust the due date
      if (startDate > dueDate) {
        dueDate = addDays(startDate, formData.duration || 1);
      }
      
      const duration = calculateDuration(startDate, dueDate);
      
      setFormData({
        ...formData,
        start_date: value,
        due_date: format(dueDate, 'yyyy-MM-dd'),
        duration
      });
    } else if (name === 'due_date') {
      const dueDate = new Date(value);
      const startDate = formData.start_date ? new Date(formData.start_date) : new Date();
      
      // If the new due date is before the current start date, don't update
      if (dueDate < startDate) {
        return;
      }
      
      const duration = calculateDuration(startDate, dueDate);
      
      setFormData({
        ...formData,
        due_date: value,
        duration
      });
    } else if (name === 'task_duration_hours' || name === 'task_duration_minutes') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        if (name === 'task_duration_hours' && numValue >= 0) {
          setFormData({ ...formData, task_duration_hours: numValue });
        } else if (name === 'task_duration_minutes' && numValue >= 0 && numValue < 60) {
          // Round minutes to nearest 15
          const roundedMinutes = Math.round(numValue / 15) * 15;
          setFormData({ ...formData, task_duration_minutes: roundedMinutes });
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
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
    
    // Update start date based on dependencies
    let latestEndDate = formData.start_date ? new Date(formData.start_date) : new Date();
    
    selectedValues.forEach(depId => {
      const dependency = existingSubtasks.find(s => s.id === depId);
      if (dependency && dependency.due_date) {
        const depEndDate = new Date(dependency.due_date);
        if (depEndDate > latestEndDate) {
          latestEndDate = depEndDate;
        }
      }
    });
    
    // Add one day to the latest end date to get the new start date
    const newStartDate = addDays(latestEndDate, 1);
    const newDueDate = addDays(newStartDate, formData.duration || 1);
    
    setFormData({
      ...formData,
      dependencies: selectedValues,
      start_date: format(newStartDate, 'yyyy-MM-dd'),
      due_date: format(newDueDate, 'yyyy-MM-dd')
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtask: SubTask = {
      id: existingSubtask ? existingSubtask.id : uuidv4(),
      ...formData,
      start_date: formData.start_date,
      due_date: formData.due_date,
      duration: formData.duration,
      dependencies: formData.dependencies || [],
      task_duration_minutes: (formData.task_duration_hours * 60) + formData.task_duration_minutes
    };
    
    onSave(subtask);
  };

  // Filter out the current subtask from potential dependencies to prevent circular dependencies
  const availableDependencies = existingSubtasks.filter(s => 
    !existingSubtask || s.id !== existingSubtask.id
  );

  const showDependencyDetails = (dependencyId: string) => {
    setShowDependencyInfo(dependencyId);
  };

  const hideDependencyDetails = () => {
    setShowDependencyInfo(null);
  };

  const getDependencyDetails = (dependencyId: string) => {
    const subtaskDep = existingSubtasks.find(s => s.id === dependencyId);
    if (subtaskDep) {
      return {
        title: subtaskDep.title,
        type: 'subtask',
        details: subtaskDep
      };
    }
    
    const activityDep = activityDependencies?.find(a => a.id === dependencyId);
    if (activityDep) {
      return {
        title: activityDep.title,
        type: 'activity',
        details: activityDep
      };
    }
    
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {existingSubtask ? 'Edit Subtask' : 'Add Subtask'}
      </h3>
      
      <Input
        label="Title"
        name="title"
        type="text"
        placeholder="Research topic"
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
          rows={2}
          className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Describe the subtask..."
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      {/* Window Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center mb-2">
          <Clock size={16} className="text-gray-500 mr-2" />
          <h4 className="text-sm font-medium text-gray-900">Task Window</h4>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          This is the period during which the task needs to be completed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Start Date"
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <Input
            label="Duration (days)"
            name="duration"
            type="number"
            min="1"
            value={formData.duration?.toString() || "1"}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <Input
            label="Due Date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleChange}
            fullWidth
            required
          />
        </div>
      </div>

      {/* Task Duration Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center mb-2">
          <Clock size={16} className="text-gray-500 mr-2" />
          <h4 className="text-sm font-medium text-gray-900">Task Duration</h4>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          This is how long the task will take to complete. This duration will be used when scheduling the task in your calendar.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours
            </label>
            <input
              type="number"
              name="task_duration_hours"
              min="0"
              value={formData.task_duration_hours}
              onChange={handleChange}
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minutes
            </label>
            <select
              name="task_duration_minutes"
              value={formData.task_duration_minutes}
              onChange={handleChange}
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="0">0</option>
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </select>
          </div>
        </div>
      </div>
      
      <Input
        label="Assigned To"
        name="assigned_to"
        type="text"
        placeholder="User ID or email"
        value={formData.assigned_to}
        onChange={handleChange}
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
          onMouseOver={(e) => {
            const target = e.target as HTMLSelectElement;
            if (target.selectedOptions && target.selectedOptions.length > 0) {
              showDependencyDetails(target.selectedOptions[0].value);
            }
          }}
          onMouseOut={hideDependencyDetails}
        >
          {availableDependencies.length > 0 ? (
            availableDependencies.map(subtask => (
              <option 
                key={subtask.id} 
                value={subtask.id}
              >
                {subtask.title}
              </option>
            ))
          ) : (
            <option disabled value="">No available dependencies</option>
          )}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          This subtask can't start until all dependencies are completed
        </p>
        
        {showDependencyInfo && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-start">
              <Info size={16} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {getDependencyDetails(showDependencyInfo)?.title || 'Dependency'}
                </p>
                {getDependencyDetails(showDependencyInfo)?.type === 'subtask' && (
                  <div className="text-xs text-blue-600 mt-1">
                    <p>
                      <span className="font-medium">Start:</span> {getDependencyDetails(showDependencyInfo)?.details.start_date ? 
                        format(new Date(getDependencyDetails(showDependencyInfo)?.details.start_date as string), 'MMM d, yyyy') : 'Not set'}
                    </p>
                    <p>
                      <span className="font-medium">Due:</span> {getDependencyDetails(showDependencyInfo)?.details.due_date ? 
                        format(new Date(getDependencyDetails(showDependencyInfo)?.details.due_date as string), 'MMM d, yyyy') : 'Not set'}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span> {getDependencyDetails(showDependencyInfo)?.details.status}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          variant="primary"
        >
          {existingSubtask ? 'Update Subtask' : 'Add Subtask'}
        </Button>
      </div>
    </form>
  );
};

export default SubtaskForm;