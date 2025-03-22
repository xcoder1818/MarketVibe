import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, Circle, Clock, Edit, Trash2, User, Link as LinkIcon, AlertCircle, Calendar } from 'lucide-react';
import { SubTask, MarketingActivity } from '../../types';
import { getSubtaskStatusColor } from '../../utils/activityTypes';
import SubtaskCalendarSync from './SubtaskCalendarSync';

interface SubtaskListProps {
  subtasks: SubTask[];
  activityTitle: string;
  onEdit?: (subtask: SubTask) => void;
  onDelete?: (subtaskId: string) => void;
  onUpdateStatus?: (subtaskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  checkDependencies?: (subtaskId: string) => boolean;
  readOnly?: boolean;
  activities?: MarketingActivity[];
}

const SubtaskList: React.FC<SubtaskListProps> = ({ 
  subtasks,
  activityTitle,
  onEdit, 
  onDelete, 
  onUpdateStatus,
  checkDependencies,
  readOnly = false,
  activities = []
}) => {
  const [hoveredDependency, setHoveredDependency] = useState<string | null>(null);

  if (subtasks.length === 0) {
    return (
      <div className="text-center py-4 border rounded-md border-gray-200">
        <p className="text-gray-500 text-sm">No subtasks added yet.</p>
      </div>
    );
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-blue-500" />;
      case 'todo':
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };
  
  const getDependencyNames = (subtask: SubTask) => {
    if (!subtask.dependencies || subtask.dependencies.length === 0) return 'None';
    
    return subtask.dependencies.map(depId => {
      const dep = subtasks.find(s => s.id === depId);
      return dep ? dep.title : 'Unknown';
    }).join(', ');
  };
  
  const canStartSubtask = (subtask: SubTask) => {
    if (!checkDependencies) return true;
    if (subtask.status !== 'todo') return true;
    return checkDependencies(subtask.id);
  };

  const getDependencyDetails = (dependencyId: string) => {
    // First check if it's a subtask dependency
    const subtaskDep = subtasks.find(s => s.id === dependencyId);
    if (subtaskDep) {
      return {
        title: subtaskDep.title,
        type: 'subtask',
        details: subtaskDep
      };
    }
    
    // Then check if it's an activity dependency
    const activityDep = activities.find(a => a.id === dependencyId);
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
    <div className="border rounded-md border-gray-200 overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {subtasks.map((subtask) => {
          const statusColor = getSubtaskStatusColor(subtask.status);
          const dependenciesMet = canStartSubtask(subtask);
          
          return (
            <li key={subtask.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  {getStatusIcon(subtask.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{subtask.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
                        {subtask.status === 'todo' ? 'To Do' : 
                         subtask.status === 'in_progress' ? 'In Progress' : 'Completed'}
                      </span>
                      {!dependenciesMet && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                          <AlertCircle size={12} className="mr-1" />
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {subtask.description && (
                    <p className="mt-1 text-xs text-gray-600">{subtask.description}</p>
                  )}
                  
                  <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 gap-x-4 gap-y-1">
                    {subtask.start_date && (
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        Start: {format(new Date(subtask.start_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    
                    {subtask.due_date && (
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        Due: {format(new Date(subtask.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                    
                    {subtask.duration && (
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        Duration: {subtask.duration} day{subtask.duration !== 1 ? 's' : ''}
                      </span>
                    )}
                    
                    {subtask.assigned_to && (
                      <span className="flex items-center">
                        <User size={12} className="mr-1" />
                        {subtask.assigned_to}
                      </span>
                    )}
                    
                    {subtask.dependencies && subtask.dependencies.length > 0 && (
                      <div className="flex items-center relative">
                        <LinkIcon size={12} className="mr-1" />
                        <span 
                          className="cursor-help border-b border-dotted border-gray-400"
                          onMouseEnter={() => setHoveredDependency(subtask.id)}
                          onMouseLeave={() => setHoveredDependency(null)}
                        >
                          {subtask.dependencies.length} {subtask.dependencies.length === 1 ? 'dependency' : 'dependencies'}
                        </span>
                        
                        {hoveredDependency === subtask.id && (
                          <div className="absolute left-0 top-5 z-10 w-64 bg-white shadow-lg rounded-md border border-gray-200 p-2 text-xs">
                            <h5 className="font-medium text-gray-900 mb-1">Dependencies:</h5>
                            <ul className="space-y-1">
                              {subtask.dependencies.map(depId => {
                                const depDetails = getDependencyDetails(depId);
                                return (
                                  <li key={depId} className="pl-2 border-l-2 border-blue-300">
                                    <span className="font-medium">{depDetails?.title || 'Unknown'}</span>
                                    {depDetails?.type === 'subtask' && (
                                      <div className="text-gray-500 text-xs">
                                        <div>Due: {depDetails.details.due_date ? 
                                          format(new Date(depDetails.details.due_date), 'MMM d, yyyy') : 'Not set'}</div>
                                        <div>Status: {depDetails.details.status}</div>
                                      </div>
                                    )}
                                    {depDetails?.type === 'activity' && (
                                      <div className="text-gray-500 text-xs">
                                        <div>Type: Activity</div>
                                        <div>Status: {depDetails.details.status}</div>
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Calendar Sync */}
                  <div className="mt-2">
                    <SubtaskCalendarSync subtask={subtask} activityTitle={activityTitle} />
                  </div>
                  
                  {!readOnly && (
                    <div className="mt-2 flex space-x-2">
                      {onEdit && (
                        <button
                          type="button"
                          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700"
                          onClick={() => onEdit(subtask)}
                        >
                          <Edit size={12} className="mr-1" />
                          Edit
                        </button>
                      )}
                      
                      {onDelete && (
                        <button
                          type="button"
                          className="inline-flex items-center text-xs text-red-500 hover:text-red-700"
                          onClick={() => onDelete(subtask.id)}
                        >
                          <Trash2 size={12} className="mr-1" />
                          Delete
                        </button>
                      )}
                      
                      {onUpdateStatus && subtask.status !== 'completed' && (
                        <button
                          type="button"
                          className="inline-flex items-center text-xs text-blue-500 hover:text-blue-700"
                          onClick={() => onUpdateStatus(subtask.id, subtask.status === 'todo' ? 'in_progress' : 'completed')}
                          disabled={subtask.status === 'todo' && !dependenciesMet}
                        >
                          {subtask.status === 'todo' ? 'Start' : 'Complete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SubtaskList;