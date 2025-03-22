import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Edit, Eye, EyeOff, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { MarketingActivity, MarketingPlan } from '../../types';
import { getActivityIcon, getActivityColor, getActivityStatusColor } from '../../utils/activityTypes';
import ActivityForm from '../../components/marketing/ActivityForm';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const { 
    plans, 
    activities,
    fetchPlans, 
    fetchActivities,
    visibleCalendars,
    toggleCalendarVisibility,
    isCalendarVisible,
    loading 
  } = useMarketingPlanStore();
  
  const { currentCompanyId, hasPermission } = useAuthStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'start' | 'end'>('start');
  const [selectedActivity, setSelectedActivity] = useState<MarketingActivity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalendarSelectorOpen, setIsCalendarSelectorOpen] = useState(false);
  const [allActivities, setAllActivities] = useState<MarketingActivity[]>([]);
  
  useEffect(() => {
    if (!plans.length) {
      fetchPlans(currentCompanyId || undefined);
    }
    
    // If we're viewing a specific plan's calendar
    if (planId) {
      fetchActivities(planId);
    } else {
      // If we're viewing the main calendar, fetch activities for all visible plans
      const fetchAllActivities = async () => {
        const activitiesArray: MarketingActivity[] = [];
        
        for (const plan of plans) {
          if (isCalendarVisible(plan.id)) {
            await fetchActivities(plan.id);
            // Get activities for this plan
            const planActivities = activities.filter(a => a.plan_id === plan.id);
            activitiesArray.push(...planActivities);
          }
        }
        
        setAllActivities(activitiesArray);
      };
      
      if (plans.length > 0) {
        fetchAllActivities();
      }
    }
  }, [fetchPlans, fetchActivities, planId, plans.length, currentCompanyId, visibleCalendars, isCalendarVisible]);
  
  // Get the current plan if we're viewing a specific plan's calendar
  const plan = planId ? plans.find(p => p.id === planId) : null;
  
  // Determine which activities to display
  const displayActivities = planId 
    ? activities 
    : allActivities.length > 0 
      ? allActivities 
      : activities.filter(activity => {
          const activityPlan = plans.find(p => p.id === activity.plan_id);
          return isCalendarVisible(activity.plan_id) && activityPlan?.company_id === currentCompanyId;
        });
  
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            leftIcon={<ChevronLeft size={16} />}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            rightIcon={<ChevronRight size={16} />}
          >
            Next
          </Button>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'start' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('start')}
          >
            Start Dates
          </Button>
          <Button
            variant={viewMode === 'end' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('end')}
          >
            End Dates
          </Button>
          {!planId && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter size={16} />}
              onClick={() => setIsCalendarSelectorOpen(true)}
            >
              Calendars
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  const renderDays = () => {
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-medium text-gray-500 text-sm py-2">
          {weekDays[i]}
        </div>
      );
    }
    
    return <div className="grid grid-cols-7">{days}</div>;
  };
  
  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(cloneDay, 'd');
        
        // Find activities for this day based on view mode
        const dayActivities = displayActivities.filter(activity => {
          const dateToCheck = viewMode === 'start' ? 
            new Date(activity.start_date) : 
            new Date(activity.publish_date);
          return isSameDay(dateToCheck, cloneDay);
        });
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border border-gray-200 ${
              !isSameMonth(day, monthStart)
                ? 'bg-gray-50 text-gray-400'
                : isSameDay(day, new Date())
                ? ' bg-blue-50 border-blue-200'
                : 'bg-white'
            }`}
          >
            <div className="text-right">
              <span className={`text-sm ${
                isSameDay(day, new Date()) ? 'font-bold text-blue-600' : ''
              }`}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
              {dayActivities.map(activity => {
                const ActivityIcon = getActivityIcon(activity.activity_type);
                const activityPlan = plans.find(p => p.id === activity.plan_id);
                
                return (
                  <div 
                    key={activity.id}
                    className={`text-xs p-1 rounded ${getActivityStatusColor(activity.status)} flex items-center cursor-pointer hover:bg-opacity-80`}
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <ActivityIcon size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {!planId && activityPlan && (
                        <span className="font-bold mr-1">[{activityPlan.title.substring(0, 3)}]</span>
                      )}
                      {activity.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      
      days = [];
    }
    
    return <div className="space-y-1">{rows}</div>;
  };

  const handleEditActivity = () => {
    if (selectedActivity) {
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const canEditActivity = (activity: MarketingActivity) => {
    const activityPlan = plans.find(p => p.id === activity.plan_id);
    if (!activityPlan) return false;
    
    return hasPermission(activityPlan.company_id, 'edit');
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {plan ? `${plan.title} - Calendar` : 'Marketing Calendar'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your marketing schedule
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              Viewing by: <span className="font-medium">{viewMode === 'start' ? 'Start Dates' : 'End Dates'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading calendar...</p>
          </div>
        ) : (
          <div>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
          </div>
        )}
      </Card>
      
      {/* Activity Details Modal */}
      {selectedActivity && (
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={selectedActivity.title}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Description</h3>
              <p className="mt-1 text-sm text-gray-600">
                {selectedActivity.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Status</h3>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityStatusColor(selectedActivity.status)}`}>
                    {selectedActivity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Type</h3>
                <p className="mt-1 text-sm text-gray-600 capitalize">
                  {selectedActivity.activity_type.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Start Date</h3>
                <p className="mt-1 text-sm text-gray-600 flex items-center">
                  <CalendarIcon size={14} className="mr-1" />
                  {format(new Date(selectedActivity.start_date), 'MMM d, yyyy')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">End Date</h3>
                <p className="mt-1 text-sm text-gray-600 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {format(new Date(selectedActivity.publish_date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700">Subtasks</h3>
              <div className="mt-1 space-y-1">
                {selectedActivity.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      subtask.status === 'completed' ? 'bg-green-500' :
                      subtask.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}></div>
                    <span className="truncate">{subtask.title}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedActivity(null)}
              >
                Close
              </Button>
              
              {canEditActivity(selectedActivity) && (
                <Button
                  variant="primary"
                  leftIcon={<Edit size={16} />}
                  onClick={handleEditActivity}
                >
                  Edit Activity
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Activity Modal */}
      {selectedActivity && isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          title="Edit Activity"
          size="lg"
        >
          <ActivityForm 
            planId={selectedActivity.plan_id} 
            activityId={selectedActivity.id}
            onClose={() => {
              handleCloseEditModal();
              setSelectedActivity(null);
            }} 
          />
        </Modal>
      )}

      {/* Calendar Selector Modal */}
      <Modal
        isOpen={isCalendarSelectorOpen}
        onClose={() => setIsCalendarSelectorOpen(false)}
        title="Select Visible Calendars"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select which marketing plan calendars you want to display.
          </p>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {plans.filter(p => p.company_id === currentCompanyId).map(plan => {
              const isVisible = isCalendarVisible(plan.id);
              
              return (
                <div 
                  key={plan.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{plan.title}</h3>
                    <p className="text-sm text-gray-500">{plan.description.substring(0, 60)}...</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    onClick={() => toggleCalendarVisibility(plan.id)}
                  >
                    {isVisible ? 'Hide' : 'Show'}
                  </Button>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              onClick={() => setIsCalendarSelectorOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;