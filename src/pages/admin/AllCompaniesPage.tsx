import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, FileText, Bell, Activity, BarChart2, Calendar, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useMessageStore } from '../../store/messageStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

const AllCompaniesPage: React.FC = () => {
  const { companies, currentCompanyId, setCurrentCompany } = useAuthStore();
  const { plans, activities, fetchPlans, fetchActivities } = useMarketingPlanStore();
  const { notifications } = useNotificationStore();
  const { messages } = useMessageStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch data for all companies
    companies.forEach(company => {
      fetchPlans(company.id);
    });
  }, [companies, fetchPlans]);

  useEffect(() => {
    // Fetch activities for all plans
    plans.forEach(plan => {
      fetchActivities(plan.id);
    });
  }, [plans, fetchActivities]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyStats = (companyId: string) => {
    const companyPlans = plans.filter(p => p.company_id === companyId);
    const companyActivities = activities.filter(a => 
      companyPlans.some(p => p.id === a.plan_id)
    );
    const companyNotifications = notifications.filter(n => 
      companyPlans.some(p => n.content.includes(p.id))
    );
    const companyMessages = messages.filter(m => 
      companyPlans.some(p => m.content.includes(p.id))
    );

    return {
      totalPlans: companyPlans.length,
      activePlans: companyPlans.filter(p => p.status === 'active').length,
      totalActivities: companyActivities.length,
      completedActivities: companyActivities.filter(a => a.status === 'completed').length,
      overdueActivities: companyActivities.filter(a => 
        a.status !== 'completed' && new Date(a.publish_date) < new Date()
      ).length,
      notifications: companyNotifications.length,
      messages: companyMessages.length
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building className="mr-2 text-blue-600" />
            All Companies Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive view of all companies and their marketing activities
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Building size={18} className="text-gray-400" />}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCompanies.map(company => {
          const stats = getCompanyStats(company.id);
          
          return (
            <Card key={company.id} className="overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={company.name} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <h2 className="ml-3 text-lg font-medium text-gray-900">{company.name}</h2>
                  </div>
                  <Button
                    variant={currentCompanyId === company.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentCompany(company.id)}
                  >
                    {currentCompanyId === company.id ? 'Current' : 'Switch'}
                  </Button>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <Link 
                    to="/plans" 
                    className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Marketing Plans</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{stats.totalPlans}</span>
                    </div>
                    <p className="mt-1 text-xs text-blue-700">{stats.activePlans} active plans</p>
                  </Link>

                  <Link 
                    to="/activities" 
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Activity className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-900">Activities</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{stats.totalActivities}</span>
                    </div>
                    <p className="mt-1 text-xs text-green-700">
                      {stats.completedActivities} completed, {stats.overdueActivities} overdue
                    </p>
                  </Link>

                  <Link 
                    to="/messages" 
                    className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="text-sm font-medium text-purple-900">Messages</span>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{stats.messages}</span>
                    </div>
                  </Link>

                  <Link 
                    to="/notifications" 
                    className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-900">Notifications</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-600">{stats.notifications}</span>
                    </div>
                  </Link>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/plans?company=${company.id}`}>
                      <Button variant="outline" size="sm" fullWidth leftIcon={<FileText size={16} />}>
                        View Plans
                      </Button>
                    </Link>
                    <Link to={`/calendar?company=${company.id}`}>
                      <Button variant="outline" size="sm" fullWidth leftIcon={<Calendar size={16} />}>
                        Calendar
                      </Button>
                    </Link>
                    <Link to={`/analytics?company=${company.id}`}>
                      <Button variant="outline" size="sm" fullWidth leftIcon={<BarChart2 size={16} />}>
                        Analytics
                      </Button>
                    </Link>
                    <Link to={`/team?company=${company.id}`}>
                      <Button variant="outline" size="sm" fullWidth leftIcon={<Users size={16} />}>
                        Team
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AllCompaniesPage;