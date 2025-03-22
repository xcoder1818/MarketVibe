import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Lightbulb, Star, Tag, MessageSquare, Paperclip } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIdeaStore } from '../../store/ideaStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import type { Idea } from '../../types';

const IdeasPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompanyId, hasPermission } = useAuthStore();
  const { ideas, fetchIdeas, createIdea, updateIdea, loading } = useIdeaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  useEffect(() => {
    if (currentCompanyId) {
      fetchIdeas(currentCompanyId);
    }
  }, [fetchIdeas, currentCompanyId]);

  const handleCreateIdea = async (idea: Partial<Idea>) => {
    if (!currentCompanyId) return;
    
    await createIdea({
      ...idea,
      created_by: 'user123', // Replace with actual user ID
      company_id: currentCompanyId,
      status: 'draft',
      priority: 'medium',
      type: idea.type || 'blog'
    } as any);
  };

  const handleUpdateIdea = async (id: string, updates: Partial<Idea>) => {
    await updateIdea(id, updates);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = searchTerm === '' || 
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || idea.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || idea.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Lightbulb className="mr-2 text-blue-600" />
              Content Ideas
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Brainstorm and manage your content ideas
            </p>
          </div>
          <Button 
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setSelectedIdea(null);
              setIsEditModalOpen(true);
            }}
          >
            New Idea
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search ideas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search size={18} className="text-gray-400" />}
                fullWidth
              />
            </div>
            <div className="sm:w-48">
              <div className="flex items-center">
                <Filter size={18} className="text-gray-400 mr-2" />
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="blog">Blog</option>
                  <option value="social">Social</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                </select>
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="in_plan">In Plan</option>
              </select>
            </div>
            <div className="sm:w-48">
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading ideas...</p>
            </div>
          ) : filteredIdeas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIdeas.map(idea => (
                <Card 
                  key={idea.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedIdea(idea);
                    setIsEditModalOpen(true);
                  }}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{idea.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{idea.description}</p>
                      </div>
                      {idea.ai_generated && (
                        <Star size={16} className="text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        idea.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        idea.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                        idea.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {idea.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        idea.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                        idea.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        idea.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {idea.priority.charAt(0).toUpperCase() + idea.priority.slice(1)} Priority
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {idea.tags.map(tag => (
                        <span 
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag size={12} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center">
                        <MessageSquare size={12} className="mr-1" />
                        {idea.comments.length} comments
                      </div>
                      <div className="flex items-center">
                        <Paperclip size={12} className="mr-1" />
                        {idea.attachments.length} attachments
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Lightbulb size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No ideas found. Create your first idea to get started!</p>
            </div>
          )}
        </div>
      </Card>

      {/* Idea Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedIdea(null);
        }}
        title={selectedIdea ? 'Edit Idea' : 'New Idea'}
        size="lg"
      >
        <div className="space-y-6">
          <Input
            label="Title"
            value={selectedIdea?.title || ''}
            onChange={(e) => {
              if (selectedIdea) {
                handleUpdateIdea(selectedIdea.id, { title: e.target.value });
              }
            }}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              value={selectedIdea?.description || ''}
              onChange={(e) => {
                if (selectedIdea) {
                  handleUpdateIdea(selectedIdea.id, { description: e.target.value });
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedIdea?.type || 'blog'}
                onChange={(e) => {
                  if (selectedIdea) {
                    handleUpdateIdea(selectedIdea.id, { type: e.target.value as any });
                  }
                }}
              >
                <option value="blog">Blog Post</option>
                <option value="social">Social Media</option>
                <option value="email">Email</option>
                <option value="website">Website</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedIdea?.priority || 'medium'}
                onChange={(e) => {
                  if (selectedIdea) {
                    handleUpdateIdea(selectedIdea.id, { priority: e.target.value as any });
                  }
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedIdea?.tags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      if (selectedIdea) {
                        handleUpdateIdea(selectedIdea.id, {
                          tags: selectedIdea.tags.filter(t => t !== tag)
                        });
                      }
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <Input
                placeholder="Add tag..."
                className="!w-32"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && selectedIdea) {
                    const input = e.target as HTMLInputElement;
                    const newTag = input.value.trim();
                    if (newTag && !selectedIdea.tags.includes(newTag)) {
                      handleUpdateIdea(selectedIdea.id, {
                        tags: [...selectedIdea.tags, newTag]
                      });
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedIdea(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedIdea(null);
              }}
            >
              {selectedIdea ? 'Update' : 'Create'} Idea
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IdeasPage;