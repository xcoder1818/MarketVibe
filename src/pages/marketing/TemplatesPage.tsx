import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, FileText, Copy, Star, Building } from 'lucide-react';
import { useTemplateStore } from '../../store/templateStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import TemplateForm from '../../components/marketing/TemplateForm';
import TemplateDetails from '../../components/marketing/TemplateDetails';

const TemplatesPage: React.FC = () => {
  const { templates, fetchTemplates, loading } = useTemplateStore();
  const { currentCompanyId, hasPermission } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    fetchTemplates(currentCompanyId);
  }, [fetchTemplates, currentCompanyId]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' ||
      (filterType === 'public' && template.is_public) ||
      (filterType === 'private' && !template.is_public);
    return matchesSearch && matchesFilter;
  });

  const canCreateTemplate = currentCompanyId && hasPermission(currentCompanyId, 'create');

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Plan Templates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage reusable marketing plan templates
            </p>
          </div>
          {canCreateTemplate && (
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Template
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
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
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <option value="all">All Templates</option>
                  <option value="public">Public Templates</option>
                  <option value="private">Private Templates</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{template.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
                        </div>
                      </div>
                      {template.is_public && (
                        <Star size={16} className="text-yellow-500" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500">
                        <Building size={14} className="mr-1" />
                        {template.company_id ? 'Company Template' : 'Public Template'}
                      </div>
                      <span className="text-gray-500">
                        {template.activities.length} activities
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Copy size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle using template
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all'
                  ? 'No templates match your search criteria.'
                  : 'No templates found. Create your first template to get started!'}
              </p>
              {canCreateTemplate && !searchTerm && filterType === 'all' && (
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4"
                >
                  Create Your First Template
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Template"
        size="lg"
      >
        <TemplateForm onClose={() => setIsCreateModalOpen(false)} />
      </Modal>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          title={selectedTemplate.title}
          size="lg"
        >
          <TemplateDetails
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default TemplatesPage;