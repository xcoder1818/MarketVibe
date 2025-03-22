import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Star, Building } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useTemplateStore } from '../../store/templateStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

interface PlanFormProps {
  onClose?: () => void;
  planId?: string;
}

type FormStep = 'type' | 'template' | 'details';

const PlanForm: React.FC<PlanFormProps> = ({ onClose, planId }) => {
  const navigate = useNavigate();
  const { user, companies, currentCompanyId, hasPermission, fetchCompanies } = useAuthStore();
  const { createPlan, updatePlan, plans, loading: planLoading, error: planError } = useMarketingPlanStore();
  const { templates, fetchTemplates, loading: templateLoading } = useTemplateStore();
  
  const [step, setStep] = useState<FormStep>('type');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_id: currentCompanyId || '',
    client_visible: true
  });

  // Get companies where user has manager access
  const [managedCompanies, setManagedCompanies] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchCompanies();
    if (currentCompanyId) {
      fetchTemplates(currentCompanyId);
    }
  }, [fetchCompanies, fetchTemplates, currentCompanyId]);

  useEffect(() => {
    // Filter companies where user has manager or admin access
    const filtered = companies.filter(company => 
      hasPermission(company.id, 'create') || company.owner_id === user?.id
    );
    setManagedCompanies(filtered);

    // Set default company to current company if user has access
    if (currentCompanyId && filtered.some(c => c.id === currentCompanyId)) {
      setFormData(prev => ({ ...prev, company_id: currentCompanyId }));
    } else if (filtered.length > 0) {
      setFormData(prev => ({ ...prev, company_id: filtered[0].id }));
    }
  }, [companies, currentCompanyId, hasPermission, user]);

  useEffect(() => {
    // If editing an existing plan, load its data
    if (planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setFormData({
          title: plan.title,
          description: plan.description,
          company_id: plan.company_id || currentCompanyId || '',
          client_visible: plan.client_visible
        });
      }
    }
  }, [planId, plans, currentCompanyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (planId) {
      // Update existing plan
      await updatePlan(planId, {
        title: formData.title,
        description: formData.description,
        company_id: formData.company_id,
        client_visible: formData.client_visible
      });
    } else {
      // Create new plan
      const newPlan = {
        title: formData.title,
        description: formData.description,
        owner_id: user.id,
        company_id: formData.company_id,
        status: 'draft' as const,
        team_members: [user.id],
        client_visible: formData.client_visible
      };
      
      const plan = await createPlan(newPlan, selectedTemplate?.id);
      if (plan?.id) {
        navigate(`/plans/${plan.id}`);
        return;
      }
    }
    
    if (onClose) {
      onClose();
    } else {
      navigate('/plans');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const renderStep = () => {
    switch (step) {
      case 'type':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Choose how to start</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer hover:border-blue-500 transition-colors ${!selectedTemplate ? 'border-blue-500' : ''}`}
                onClick={() => {
                  setSelectedTemplate(null);
                  setStep('details');
                }}
              >
                <div className="p-4 text-center">
                  <Plus size={40} className="mx-auto mb-4 text-blue-600" />
                  <h4 className="text-lg font-medium">Start from scratch</h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Create a new marketing plan from scratch
                  </p>
                </div>
              </Card>

              <Card 
                className={`cursor-pointer hover:border-blue-500 transition-colors ${selectedTemplate ? 'border-blue-500' : ''}`}
                onClick={() => setStep('template')}
              >
                <div className="p-4 text-center">
                  <FileText size={40} className="mx-auto mb-4 text-blue-600" />
                  <h4 className="text-lg font-medium">Use a template</h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Start with a pre-built marketing plan template
                  </p>
                </div>
              </Card>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {onClose && (
                <Button 
                  variant="secondary" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Select a template</h3>
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
              {templateLoading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading templates...</p>
                </div>
              ) : filteredTemplates.length > 0 ? (
                filteredTemplates.map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer hover:border-blue-500 transition-colors ${
                      selectedTemplate?.id === template.id ? 'border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-medium">{template.title}</h4>
                          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                        </div>
                        {template.is_public && (
                          <Star size={16} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Building size={14} className="mr-1" />
                          {template.company_id ? 'Company Template' : 'Public Template'}
                        </div>
                        <span className="text-gray-500">
                          {template.activities?.length || 0} activities
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No templates found</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setStep('type')}
              >
                Back
              </Button>
              <Button 
                variant="primary"
                onClick={() => setStep('details')}
                disabled={!selectedTemplate}
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 'details':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Plan Title"
              name="title"
              type="text"
              placeholder="Q3 Product Launch"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />
            
            <div className="w-full">
              <label 
                htmlFor="description" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Describe the marketing plan and its objectives..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="w-full">
              <label 
                htmlFor="company_id" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company
              </label>
              <select
                id="company_id"
                name="company_id"
                className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.company_id}
                onChange={handleChange}
                required
              >
                {managedCompanies.length === 0 ? (
                  <option value="" disabled>No companies available</option>
                ) : (
                  managedCompanies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                You can only select companies where you have manager access
              </p>
            </div>

            <div className="w-full">
              <div className="flex items-center">
                <input
                  id="client_visible"
                  name="client_visible"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.client_visible}
                  onChange={handleChange}
                />
                <label htmlFor="client_visible" className="ml-2 block text-sm text-gray-700">
                  Visible to clients
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                When checked, clients with access to this company can view this plan
              </p>
            </div>
            
            {planError && (
              <div className="text-sm text-red-600 mt-1">
                {planError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setStep('type')}
              >
                Back
              </Button>
              
              <Button 
                type="submit" 
                variant="primary" 
                isLoading={planLoading}
              >
                {planId ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
    </div>
  );
};

export default PlanForm;