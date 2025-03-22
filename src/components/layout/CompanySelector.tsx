import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { Building, ChevronDown } from 'lucide-react';
import { Company } from '../../types';

const CompanySelector: React.FC = () => {
  const { companies, currentCompanyId, setCurrentCompany, fetchCompanies } = useAuthStore();
  const { fetchPlans } = useMarketingPlanStore();
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  
  const currentCompany = companies.find(c => c.id === currentCompanyId);
  
  const handleCompanyChange = (companyId: string) => {
    if (companyId !== currentCompanyId) {
      setCurrentCompany(companyId);
      // Fetch plans for the newly selected company
      fetchPlans(companyId);
      setIsOpen(false);
    }
  };
  
  if (companies.length <= 1) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <div className="flex items-center">
          <Building size={18} className="text-gray-500 mr-2" />
          <span className="truncate max-w-[150px]">
            {currentCompany?.name || 'Select Company'}
          </span>
        </div>
        <ChevronDown size={16} className="text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu">
            {companies.map(company => (
              <button
                key={company.id}
                onClick={() => handleCompanyChange(company.id)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  company.id === currentCompanyId
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
              >
                {company.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;