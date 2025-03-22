import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Clock, AlertTriangle, Calendar as CalendarIcon, List } from 'lucide-react';
import { format } from 'date-fns';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useAuthStore } from '../../store/authStore';
import { MarketingActivity, ActivityType } from '../../types';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { ACTIVITY_TYPES, getActivityIcon, getActivityStatusColor } from '../../utils/activityTypes';
import DashboardCalendar from '../../components/dashboard/DashboardCalendar';

const DashboardPage: React.FC = () => {
  const { user, currentCompanyId } = useAuthStore();
  const { plans, activities, fetchPlans, fetchActivities, loading } = useMarketingPlanStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<ActivityType[]>([]);
  const [showBlockers, setShowBlockers] = useState(false);
  
  useEffect(() => {
    if (!plans.length) {
      fetchPlans(currentCompanyId || undefined);
    }
    
    if (plans.length > 0) {
      plans.forEach(plan => {
        fetchActivities(plan.id);
      });
    }
  }, [fetchPlans, fetchActivities, plans.length, currentCompanyId]);

  const toggleActivityType = (type: ActivityType) => {
    setSelectedActivityTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const togglePlan = (planId: string) => {
    setSelectedPlans(prev =>
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  // Filter activities based on search, plans, types, and blockers
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = selectedPlans.length === 0 || selectedPlans.includes(activity.plan_id);
    const matchesType = selectedActivityTypes.length === 0 || selectedActivityTypes.includes(activity.activity_type);
    
    const isBlocker = showBlockers
      ? activities.some(a => a.dependencies.includes(activity.id) && a.status !== 'completed')
      : true;
    
    return matchesSearch && matchesPlan && matchesType && isBlocker;
  });

  // Group activities by due date status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdue = filteredActivities.filter(a => 
    new Date(a.publish_date) < today && a.status !== 'completed'
  ).sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime());
  
  const dueToday = filteredActivities.filter(a =>
    new Date(a.publish_date).toDateString() === today.toDateString() && a.status !== 'completed'
  );
  
  const upcoming = filteredActivities.filter(a => {
    const dueDate = new Date(a.publish_date);
    return dueDate > today && a.status !== 'completed';
  });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6">
           <h1 className="text-2xl font-bold" style={{ color: '#3259a7' }}>
             Welcome back, {user?.full_name || 'there'}!
            </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of your tasks and activities
          </p>
        </div>
      </div>

      {/* Priority Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overdue Card */}
        <Card className={`${overdue.length > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-red-600 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              Overdue
            </h2>
            <span className="text-red-600 font-bold text-lg">{overdue.length}</span>
          </div>
          <div className="space-y-2">
            {overdue.length > 0 ? (
              overdue.slice(0, 3).map(activity => (
                <ActivityRow key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No overdue tasks</p>
            )}
            {overdue.length > 3 && (
              <Link
                to="/activities"
                className="block text-sm text-red-600 hover:text-red-700 font-medium mt-2"
              >
                View all {overdue.length} overdue tasks
              </Link>
            )}
          </div>
        </Card>

        {/* Due Today Card */}
        <Card className={`${dueToday.length > 0 ? 'border-orange-200 bg-orange-50' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-orange-600 flex items-center">
              <Clock size={20} className="mr-2" />
              Due Today
            </h2>
            <span className="text-orange-600 font-bold text-lg">{dueToday.length}</span>
          </div>
          <div className="space-y-2">
            {dueToday.length > 0 ? (
              dueToday.slice(0, 3).map(activity => (
                <ActivityRow key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No tasks due today</p>
            )}
            {dueToday.length > 3 && (
              <Link
                to="/activities"
                className="block text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
              >
                View all {dueToday.length} tasks due today
              </Link>
            )}
          </div>
        </Card>

        {/* Upcoming Card */}
        <Card className={`${upcoming.length > 0 ? 'border-blue-200 bg-blue-50' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-blue-600 flex items-center">
              <CalendarIcon size={20} className="mr-2" />
              Upcoming
            </h2>
            <span className="text-blue-600 font-bold text-lg">{upcoming.length}</span>
          </div>
          <div className="space-y-2">
            {upcoming.length > 0 ? (
              upcoming.slice(0, 3).map(activity => (
                <ActivityRow key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No upcoming tasks</p>
            )}
            {upcoming.length > 3 && (
              <Link
                to="/activities"
                className="block text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
              >
                View all {upcoming.length} upcoming tasks
              </Link>
            )}
          </div>
        </Card>
      </div>

      {/* Calendar and Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CalendarIcon size={20} className="mr-2" />
            Calendar
          </h2>
          <DashboardCalendar activities={filteredActivities} />
        </Card>

        {/* Task List with Filters */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <List size={20} className="mr-2" />
                All Tasks
              </h2>
              <Button
                variant={showBlockers ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowBlockers(!showBlockers)}
                leftIcon={<AlertTriangle size={16} />}
              >
                Show Blockers
              </Button>
            </div>

            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} className="text-gray-400" />}
              fullWidth
            />

            <div className="flex flex-wrap gap-2">
              {plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => togglePlan(plan.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                    selectedPlans.includes(plan.id)
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {plan.title}
                </button>
              ))}
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredActivities.map(activity => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Helper component for activity rows
const ActivityRow: React.FC<{ activity: MarketingActivity }> = ({ activity }) => {
  const { plans } = useMarketingPlanStore();
  const plan = plans.find(p => p.id === activity.plan_id);
  const ActivityIcon = getActivityIcon(activity.activity_type);

  return (
    <Link
      to={`/plans/${activity.plan_id}/activities`}
      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white"
    >
      <div className="flex items-start">
        <div className="mr-3">
          <div className={`p-2 rounded-md ${getActivityStatusColor(activity.status)}`}>
            <ActivityIcon size={16} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </h4>
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityStatusColor(activity.status)}`}>
              {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          {plan && (
            <p className="mt-1 text-xs text-gray-500">
              {plan.title}
            </p>
          )}
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <Clock size={12} className="mr-1" />
            Due {format(new Date(activity.publish_date), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DashboardPage;