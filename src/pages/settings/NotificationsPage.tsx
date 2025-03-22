import React, { useEffect } from 'react';
import { Bell, Mail, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import Card from '../../components/ui/Card';

const NotificationsPage: React.FC = () => {
  const { preferences, fetchPreferences, updatePreference } = useNotificationStore();

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const notificationTypes = [
    {
      id: 'activity_assigned',
      title: 'Activity Assignments',
      description: 'When an activity is assigned to you',
      icon: Bell
    },
    {
      id: 'subtask_assigned',
      title: 'Subtask Assignments',
      description: 'When a subtask is assigned to you',
      icon: Bell
    },
    {
      id: 'comment_mention',
      title: 'Comment Mentions',
      description: 'When someone mentions you in a comment',
      icon: MessageSquare
    },
    {
      id: 'channel_message',
      title: 'Channel Messages',
      description: 'When someone posts in a channel you follow',
      icon: MessageSquare
    },
    {
      id: 'direct_message',
      title: 'Direct Messages',
      description: 'When you receive a direct message',
      icon: MessageSquare
    },
    {
      id: 'task_due',
      title: 'Task Due Dates',
      description: 'When tasks are due or overdue',
      icon: Calendar
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="mr-2 text-blue-600" />
            Notification Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage how and when you want to be notified
          </p>
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Email Digest</h2>
            <p className="mt-1 text-sm text-gray-500">
              Receive a summary of your tasks and activities
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="digest-frequency"
                  value="daily"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  onChange={() => updatePreference('task_due', { email_digest_frequency: 'daily' })}
                />
                <label className="ml-3 text-sm text-gray-700">Daily digest</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="digest-frequency"
                  value="weekly"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  onChange={() => updatePreference('task_due', { email_digest_frequency: 'weekly' })}
                />
                <label className="ml-3 text-sm text-gray-700">Weekly digest</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  name="digest-frequency"
                  value="none"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  onChange={() => updatePreference('task_due', { email_digest_enabled: false })}
                />
                <label className="ml-3 text-sm text-gray-700">No digest</label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900">Notification Types</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose how you want to be notified for different types of activities
            </p>
            <div className="mt-4 space-y-4">
              {notificationTypes.map(type => {
                const Icon = type.icon;
                const pref = preferences.find(p => p.type === type.id);

                return (
                  <div key={type.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{type.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{type.description}</p>
                        <div className="mt-4 space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={pref?.email_enabled}
                              onChange={(e) => updatePreference(type.id as any, { email_enabled: e.target.checked })}
                            />
                            <span className="ml-2 text-sm text-gray-700">Email</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={pref?.push_enabled}
                              onChange={(e) => updatePreference(type.id as any, { push_enabled: e.target.checked })}
                            />
                            <span className="ml-2 text-sm text-gray-700">Push</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={pref?.in_app_enabled}
                              onChange={(e) => updatePreference(type.id as any, { in_app_enabled: e.target.checked })}
                            />
                            <span className="ml-2 text-sm text-gray-700">In-app</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;