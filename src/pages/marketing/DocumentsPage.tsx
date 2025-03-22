import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, FileText, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import DocumentEditor from '../../components/marketing/DocumentEditor';

const DocumentsPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const { 
    plans, 
    documents, 
    fetchPlans, 
    fetchDocuments, 
    loading 
  } = useMarketingPlanStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!plans.length) {
      fetchPlans();
    }
    
    if (planId) {
      fetchDocuments(planId);
    }
  }, [fetchPlans, fetchDocuments, planId, plans.length]);
  
  const plan = planId ? plans.find(p => p.id === planId) : null;
  
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleEditDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsCreateModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSelectedDocumentId(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {plan ? `${plan.title} - Documents` : 'Documents'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage marketing documents
            </p>
          </div>
          <Button 
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Document
          </Button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            leftIcon={<Search size={18} className="text-gray-400" />}
          />
        </div>
        
        <div className="px-6 py-5">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map(document => (
                <Card 
                  key={document.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEditDocument(document.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-blue-100 rounded-md">
                        <FileText size={24} className="text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{document.title}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        <span>
                          Updated {format(new Date(document.updated_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {document.content.substring(0, 150)}
                        {document.content.length > 150 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? 'No documents match your search criteria.'
                  : 'No documents have been created yet.'}
              </p>
              {!searchTerm && (
                <Button 
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create Your First Document
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Create/Edit Document Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title={selectedDocumentId ? "Edit Document" : "Create New Document"}
        size="lg"
      >
        <DocumentEditor 
          planId={planId || ''} 
          documentId={selectedDocumentId || undefined}
          onClose={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};

export default DocumentsPage;