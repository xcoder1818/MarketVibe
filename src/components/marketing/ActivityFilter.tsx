import React, { useState, useRef, useEffect } from 'react';
import { Filter, Check, ChevronDown } from 'lucide-react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import Input from '../ui/Input';

interface ActivityFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPlans: string[];
  onPlanSelectionChange: (planIds: string[]) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const ActivityFilter: React.FC<ActivityFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedPlans,
  onPlanSelectionChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const { plans } = useMarketingPlanStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePlan = (planId: string) => {
    if (selectedPlans.includes(planId)) {
      onPlanSelectionChange(selectedPlans.filter(id => id !== planId));
    } else {
      onPlanSelectionChange([...selectedPlans, planId]);
    }
    
  };

  const selectAll = () => {
    onPlanSelectionChange(plans.map(p => p.id));
  };

  const clearAll = () => {
    onPlanSelectionChange([]);
  };

  return (
    <div className="mb-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex-1">
        <Input
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
        />
      </div>
      
      <div className="sm:w-48">
        <div className="flex items-center">
          <Filter size={18} className="text-gray-400 mr-2" />
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      <div className="sm:w-64" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="block truncate">
              {selectedPlans.length === 0 ? 'No plans selected' :
               selectedPlans.length === plans.length ? 'All plans' :
               `${selectedPlans.length} plan${selectedPlans.length === 1 ? '' : 's'} selected`}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown size={16} className="text-gray-400" />
            </span>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              <div className="border-b border-gray-200 px-3 py-2">
                <div className="flex justify-between">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={selectAll}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={clearAll}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 ${
                    selectedPlans.includes(plan.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => togglePlan(plan.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedPlans.includes(plan.id)}
                      onChange={() => {}} // Handled by parent div click
                    />
                    <span className="ml-3 block truncate font-medium text-gray-900">
                      {plan.title}
                    </span>
                  </div>

                  {selectedPlans.includes(plan.id) && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                      <Check size={16} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityFilter;