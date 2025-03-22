import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Search, X, Paperclip } from 'lucide-react';
import { useMarketingPlanStore } from '../../store/marketingPlanStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ActivityLink from './ActivityLink';
import FileUpload from '../ui/FileUpload';

interface MessageInputProps {
  onSendMessage: (content: string, activityIds: string[], files?: File[]) => void;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  placeholder = "Type a message..." 
}) => {
  const { activities } = useMarketingPlanStore();
  const [message, setMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && selectedActivities.length === 0 && selectedFiles.length === 0)) return;
    
    onSendMessage(message, selectedActivities, selectedFiles);
    setMessage('');
    setSelectedActivities([]);
    setSelectedFiles([]);
    setIsSearching(false);
    setIsAttaching(false);
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      {selectedActivities.length > 0 && (
        <div className="mb-2 space-y-2">
          {selectedActivities.map(activityId => (
            <div key={activityId} className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
              <ActivityLink activityId={activityId} inline />
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActivity(activityId)}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mb-2">
          <FileUpload
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
          />
        </div>
      )}

      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            fullWidth
            className="pl-20"
          />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex space-x-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSearching(true)}
            >
              <Plus size={16} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAttaching(!isAttaching)}
            >
              <Paperclip size={16} />
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          leftIcon={<Send size={16} />}
        >
          Send
        </Button>
      </div>

      {isSearching && (
        <div 
          ref={searchRef}
          className="absolute bottom-full left-0 w-full bg-white rounded-lg shadow-lg border border-gray-200 mb-2"
        >
          <div className="p-3 border-b border-gray-200">
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              fullWidth
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-2">
            {filteredActivities.length > 0 ? (
              filteredActivities.map(activity => (
                <ActivityLink
                  key={activity.id}
                  activityId={activity.id}
                  selectable
                  selected={selectedActivities.includes(activity.id)}
                  onSelect={toggleActivity}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No activities found
              </p>
            )}
          </div>
        </div>
      )}

      {isAttaching && (
        <div className="absolute bottom-full left-0 w-full bg-white rounded-lg shadow-lg border border-gray-200 mb-2 p-4">
          <FileUpload
            onFileSelect={handleFileSelect}
            onRemoveFile={handleRemoveFile}
            selectedFiles={selectedFiles}
            maxFiles={5}
            maxSize={5 * 1024 * 1024} // 5MB
          />
        </div>
      )}
    </form>
  );
};

export default MessageInput;