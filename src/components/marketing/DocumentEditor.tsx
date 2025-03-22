import React, { useState, useEffect } from 'react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface DocumentEditorProps {
  planId: string;
  documentId?: string;
  onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ planId, documentId, onClose }) => {
  const { user } = useAuthStore();
  const { 
    documents, 
    createDocument, 
    updateDocument, 
    loading, 
    error 
  } = useMarketingPlanStore();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (documentId) {
      const document = documents.find(doc => doc.id === documentId);
      if (document) {
        setFormData({
          title: document.title,
          content: document.content,
        });
      }
    }
  }, [documentId, documents]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (documentId) {
      await updateDocument(documentId, {
        title: formData.title,
        content: formData.content,
      });
    } else {
      await createDocument({
        plan_id: planId,
        title: formData.title,
        content: formData.content,
        created_by: user.id,
      });
    }
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Document Title"
        name="title"
        type="text"
        placeholder="Marketing Strategy Overview"
        value={formData.title}
        onChange={handleChange}
        required
        fullWidth
      />
      
      <div className="w-full">
        <label 
          htmlFor="content" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={12}
          className="block w-full rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
          placeholder="Write your document content here..."
          value={formData.content}
          onChange={handleChange}
          required
        />
      </div>
      
      {error && (
        <div className="text-sm text-red-600 mt-1">
          {error}
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onClose}
        >
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          variant="primary" 
          isLoading={loading}
        >
          {documentId ? 'Update Document' : 'Create Document'}
        </Button>
      </div>
    </form>
  );
};

export default DocumentEditor;