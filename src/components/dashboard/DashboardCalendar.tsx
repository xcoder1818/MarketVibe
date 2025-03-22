import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { MarketingActivity } from '../../types';
import { getActivityIcon, getActivityStatusColor } from '../../utils/activityTypes';
import Button from '../ui/Button';

interface DashboardCalendarProps {
  activities: MarketingActivity[];
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ activities }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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
        
        <h2 className="text-lg font-medium text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
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
        
        // Find activities for this day
        const dayActivities = activities.filter(activity => 
          isSameDay(new Date(activity.publish_date), cloneDay)
        );
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] p-2 border border-gray-200 ${
              !isSameMonth(day, monthStart)
                ? 'bg-gray-50 text-gray-400'
                : isSameDay(day, new Date())
                ? 'bg-blue-50 border-blue-200'
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
            
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px]">
              {dayActivities.map(activity => {
                const ActivityIcon = getActivityIcon(activity.activity_type);
                return (
                  <Link 
                    key={activity.id}
                    to={`/plans/${activity.plan_id}/activities`}
                    className={`text-xs p-1 rounded flex items-center ${getActivityStatusColor(activity.status)} hover:opacity-80`}
                  >
                    <ActivityIcon size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{activity.title}</span>
                  </Link>
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
  
  return (
    <div>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};

export default DashboardCalendar;