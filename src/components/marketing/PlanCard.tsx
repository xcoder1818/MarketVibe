import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, CheckSquare, Clock, Users, Activity, Building } from 'lucide-react';
import { format } from 'date-fns';
import type { MarketingPlan } from '../../types';
import Card from '../ui/Card';
import { useAuthStore } from '../../store/authStore';

interface PlanCardProps {
  plan: MarketingPlan;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  const { companies } = useAuthStore();
  
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-yellow-100 text-yellow-800',
  };

  // Find company name
  const company = companies.find(c => c.id === plan.company_id);
  
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          <Link to={`/plans/${plan.id}`} className="hover:text-blue-600">
            {plan.title}
          </Link>
        </h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[plan.status]}`}>
          {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {plan.description}
      </p>
      
      <div className="flex flex-col space-y-2 text-sm text-gray-500">
        <div className="flex items-center">
          <Building size={16} className="mr-2" />
          <span>{company?.name || 'Unknown Company'}</span>
        </div>
        
        <div className="flex items-center">
          <Clock size={16} className="mr-2" />
          <span>Created: {format(new Date(plan.created_at), 'MMM d, yyyy')}</span>
        </div>
        
        <div className="flex items-center">
          <Users size={16} className="mr-2" />
          <span>{plan.team_members.length} team members</span>
        </div>

        {!plan.client_visible && (
          <div className="flex items-center">
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              Internal Only
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
        <Link 
          to={`/plans/${plan.id}/activities`} 
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600"
        >
          <Activity size={16} className="mr-1" />
          Activities
        </Link>
        
        <Link 
          to={`/plans/${plan.id}/calendar`} 
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600"
        >
          <Calendar size={16} className="mr-1" />
          Calendar
        </Link>
        
        <Link 
          to={`/plans/${plan.id}/documents`} 
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600"
        >
          <FileText size={16} className="mr-1" />
          Documents
        </Link>
      </div>
    </Card>
  );
};

export default PlanCard;