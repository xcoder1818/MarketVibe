import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PlanCard from '../../components/marketing/PlanCard';

const MarketingPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { plans, fetchPlans, createPlan, loading } = useMarketingPlanStore();
  const { user, companies, currentCompanyId, hasPermission } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  
  useEffect(() => {
    // Fetch plans for the current company
    fetchPlans(currentCompanyId || undefined);
  }, [fetchPlans, currentCompanyId]);
  
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesCompany = companyFilter === 'all' || plan.company_id === companyFilter;
    
    return matchesSearch && matchesStatus && matchesCompany;
  });
  
  // Get companies where user has at least view access
  const accessibleCompanies = companies.filter(company => 
    hasPermission(company.id, 'view')
  );

  const handleStartFromScratch = async () => {
    if (!user || !currentCompanyId) return;

    // Create a new blank marketing plan
    const newPlan = {
      title: 'New Marketing Plan',
      description: 'A new marketing plan',
      owner_id: user.id,
      company_id: currentCompanyId,
      status: 'draft' as const,
      team_members: [user.id],
      client_visible: true
    };
    
    const plan = await createPlan(newPlan);
    if (plan?.id) {
      navigate(`/plans/${plan.id}`);
    }
  };

  const handleUseTemplate = () => {
    navigate('/plans/templates');
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Marketing Plans
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your marketing plans
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              leftIcon={<Plus size={16} />}
              onClick={handleStartFromScratch}
            >
              Start from Scratch
            </Button>
            <Button 
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={handleUseTemplate}
            >
              Use Template
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                leftIcon={<Search size={18} className="text-gray-400" />}
              />
            </div>
            <div className="sm:w-48">
              <div className="flex items-center">
                <Filter size={18} className="text-gray-400 mr-2" />
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            {accessibleCompanies.length > 1 && (
              <div className="sm:w-48">
                <div className="flex items-center">
                  <Filter size={18} className="text-gray-400 mr-2" />
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                  >
                    <option value="all">All Companies</option>
                    {accessibleCompanies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="px-6 py-5">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading your marketing plans...</p>
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlans.map(plan => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || companyFilter !== 'all'
                  ? 'No marketing plans match your search criteria.'
                  : 'You don\'t have any marketing plans yet.'}
              </p>
              {!searchTerm && statusFilter === 'all' && companyFilter === 'all' && (
                <div className="flex justify-center space-x-3">
                  <Button 
                    variant="outline"
                    leftIcon={<Plus size={16} />}
                    onClick={handleStartFromScratch}
                  >
                    Start from Scratch
                  </Button>
                  <Button 
                    variant="primary"
                    leftIcon={<Plus size={16} />}
                    onClick={handleUseTemplate}
                  >
                    Use Template
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketingPlansPage;