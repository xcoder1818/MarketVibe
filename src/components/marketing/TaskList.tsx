import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import type { MarketingTask } from '../../types';
import Button from '../ui/Button';

interface TaskListProps {
  tasks: MarketingTask[];
  onUpdateTask: (id: string, updates: Partial<MarketingTask>) => Promise<void>;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateTask }) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={18} className="text-blue-500" />;
      case 'todo':
        return <Circle size={18} className="text-gray-400" />;
      default:
        return <AlertCircle size={18} className="text-yellow-500" />;
    }
  };
  
  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    await onUpdateTask(taskId, { status: newStatus });
  };
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tasks found. Create a new task to get started.</p>
      </div>
    );
  }
  
  return (
    <ul className="divide-y divide-gray-200">
      {tasks.map((task) => (
        <li key={task.id} className="py-4">
          <div className="flex items-start">
            <div className="mr-3 mt-1">
              {getStatusIcon(task.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleTaskExpand(task.id)}
              >
                <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">
                    Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              {expandedTaskId === task.id && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  {task.assigned_to && (
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <User size={14} className="mr-1" />
                      <span>Assigned to: {task.assigned_to}</span>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant={task.status === 'todo' ? 'primary' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, 'todo');
                      }}
                    >
                      To Do
                    </Button>
                    <Button
                      size="sm"
                      variant={task.status === 'in_progress' ? 'primary' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, 'in_progress');
                      }}
                    >
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant={task.status === 'completed' ? 'primary' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id, 'completed');
                      }}
                    >
                      Completed
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TaskList;