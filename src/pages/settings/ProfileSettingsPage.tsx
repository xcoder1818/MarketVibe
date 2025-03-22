import React, { useState, useEffect } from 'react';
import { User, Clock, Globe, Calendar, Mail, Building, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

interface WorkingHours {
  start: string;
  end: string;
}

interface WorkingDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

const ProfileSettingsPage: React.FC = () => {
  const { user, updateProfile, loading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    working_hours: {
      start: '09:00',
      end: '17:00'
    } as WorkingHours,
    working_days: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    } as WorkingDays,
    calendar_preferences: {
      default_reminder: 30, // minutes
      additional_reminders: [1440], // 1 day in minutes
      auto_schedule: true,
      respect_working_hours: true
    }
  });

  const [timezones] = useState(() => {
    return Intl.supportedValuesOf('timeZone').sort();
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (name.startsWith('working_days.')) {
        const day = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          working_days: {
            ...prev.working_days,
            [day]: checkbox.checked
          }
        }));
      } else if (name.startsWith('calendar_preferences.')) {
        const pref = name.split('.')[1];
        setFormData(prev => ({
          ...prev,
          calendar_preferences: {
            ...prev.calendar_preferences,
            [pref]: checkbox.checked
          }
        }));
      }
    } else if (name.startsWith('working_hours.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        working_hours: {
          ...prev.working_hours,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await updateProfile({
      ...formData,
      id: user.id
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <User className="mr-2 text-blue-600" />
            Profile Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              fullWidth
              leftIcon={<User size={18} className="text-gray-400" />}
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              leftIcon={<Mail size={18} className="text-gray-400" />}
              disabled
            />
          </div>
        </Card>

        {/* Working Hours */}
        <Card>
          <div className="flex items-center mb-4">
            <Clock size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Working Hours</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="working_hours.start"
                  value={formData.working_hours.start}
                  onChange={handleChange}
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="working_hours.end"
                  value={formData.working_hours.end}
                  onChange={handleChange}
                  className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(formData.working_days).map(([day, checked]) => (
                  <label
                    key={day}
                    className="inline-flex items-center"
                  >
                    <input
                      type="checkbox"
                      name={`working_days.${day}`}
                      checked={checked}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {day}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Timezone */}
        <Card>
          <div className="flex items-center mb-4">
            <Globe size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Timezone</h2>
          </div>

          <div>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {timezones.map(timezone => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Your timezone is used for scheduling and displaying times
            </p>
          </div>
        </Card>

        {/* Calendar Preferences */}
        <Card>
          <div className="flex items-center mb-4">
            <Calendar size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Calendar Preferences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Reminder
              </label>
              <select
                name="calendar_preferences.default_reminder"
                value={formData.calendar_preferences.default_reminder}
                onChange={handleChange}
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="0">No reminder</option>
                <option value="5">5 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="calendar_preferences.auto_schedule"
                  checked={formData.calendar_preferences.auto_schedule}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Automatically schedule tasks in available time slots
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="calendar_preferences.respect_working_hours"
                  checked={formData.calendar_preferences.respect_working_hours}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Only schedule tasks during working hours
                </span>
              </label>
            </div>
          </div>
        </Card>

        {error && (
          <div className="text-sm text-red-600 mt-1">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettingsPage;