import React, { useState } from 'react';
import { Calendar, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';
import { SubTask } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface SubtaskCalendarSyncProps {
  subtask: SubTask;
  activityTitle: string;
}

const SubtaskCalendarSync: React.FC<SubtaskCalendarSyncProps> = ({ subtask, activityTitle }) => {
  const { 
    currentProvider,
    providers,
    connectProvider,
    addSubTaskToCalendar,
    updateSubTaskInCalendar,
    removeSubTaskFromCalendar,
    loading 
  } = useCalendarStore();

  const [showProviderModal, setShowProviderModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (type: 'google' | 'microsoft') => {
    const success = await connectProvider(type);
    if (success) {
      setShowProviderModal(false);
      setError(null);
    } else {
      setError(`Failed to connect to ${type === 'google' ? 'Google' : 'Microsoft'} Calendar`);
    }
  };

  const handleSync = async () => {
    if (!currentProvider) {
      setShowProviderModal(true);
      return;
    }
    
    if (!subtask.assigned_to) {
      setError('Please assign this task to someone before syncing with calendar');
      return;
    }

    if (!subtask.task_duration_minutes) {
      setError('Please set a task duration before syncing with calendar');
      return;
    }

    try {
      let success;
      if (subtask.calendar_synced) {
        success = await updateSubTaskInCalendar(subtask, activityTitle);
      } else {
        success = await addSubTaskToCalendar(subtask, activityTitle);
      }

      if (!success) {
        setError('Failed to sync with calendar');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('An error occurred while syncing with calendar');
    }
  };

  const handleUnsync = async () => {
    if (!currentProvider || !subtask.calendar_synced) return;
    
    try {
      const success = await removeSubTaskFromCalendar(subtask.id);
      if (!success) {
        setError('Failed to remove from calendar');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('An error occurred while removing from calendar');
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {error && (
          <div className="text-sm text-red-600 flex items-center">
            <AlertTriangle size={14} className="mr-1" />
            {error}
          </div>
        )}

        {subtask.calendar_synced ? (
          <>
            <span className="text-sm text-green-600 flex items-center">
              <Check size={14} className="mr-1" />
              Synced with {currentProvider?.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<X size={14} />}
              onClick={handleUnsync}
              disabled={loading}
            >
              Unsync
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Calendar size={14} />}
            onClick={handleSync}
            disabled={loading}
          >
            {currentProvider ? `Add to ${currentProvider.name}` : 'Connect Calendar'}
          </Button>
        )}
      </div>

      <Modal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title="Connect Calendar"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose a calendar provider to sync your tasks:
          </p>

          <div className="space-y-2">
            {providers.map(provider => (
              <button
                key={provider.type}
                className={`w-full p-4 rounded-lg border ${
                  provider.connected
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                } flex items-center justify-between transition-colors`}
                onClick={() => handleConnect(provider.type)}
                disabled={provider.connected}
              >
                <div className="flex items-center">
                  <img
                    src={provider.icon}
                    alt={provider.name}
                    className="w-6 h-6 mr-3"
                  />
                  <div className="text-left">
                    <div className="font-medium">{provider.name}</div>
                    {provider.email && (
                      <div className="text-sm text-gray-500">{provider.email}</div>
                    )}
                  </div>
                </div>
                {provider.connected && (
                  <Check size={20} className="text-green-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowProviderModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SubtaskCalendarSync;