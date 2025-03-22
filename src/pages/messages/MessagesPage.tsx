import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Message from '../../components/messages/Message';
import MessageInput from '../../components/messages/MessageInput';
import ChannelHeader from '../../components/messages/ChannelHeader';
import Modal from '../../components/ui/Modal';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  channel_id: string;
  created_at: string;
  attachments?: string[];
  reactions?: { emoji: string; users: string[] }[];
  activityIds?: string[];
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  members: string[];
  company_id: string;
}

const MessagesPage: React.FC = () => {
  const { user, currentCompanyId } = useAuthStore();
  const { 
    channels, 
    messages, 
    createChannel, 
    updateChannel,
    deleteChannel,
    joinChannel,
    leaveChannel,
    sendMessage,
    fetchChannels,
    fetchMessages,
    loading 
  } = useMessageStore();
  
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    is_private: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentCompanyId) {
      fetchChannels(currentCompanyId);
    }
  }, [currentCompanyId, fetchChannels]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string, activityIds: string[]) => {
    if ((!content.trim() && activityIds.length === 0) || !selectedChannel || !user) return;

    const message: Message = {
      id: Date.now().toString(),
      content,
      sender_id: user.id,
      channel_id: selectedChannel.id,
      created_at: new Date().toISOString(),
      activityIds
    };

    sendMessage(message);
  };

  const handleCreateChannel = async () => {
    if (!newChannelData.name.trim() || !user || !currentCompanyId) return;

    const channel: Omit<Channel, 'id' | 'created_at'> = {
      name: newChannelData.name,
      description: newChannelData.description,
      is_private: newChannelData.is_private,
      created_by: user.id,
      members: [user.id],
      company_id: currentCompanyId
    };

    await createChannel(channel);
    setNewChannelData({ name: '', description: '', is_private: false });
    setIsCreatingChannel(false);
  };

  const handleUpdateChannel = async (updates: Partial<Channel>) => {
    if (!selectedChannel) return;
    await updateChannel(selectedChannel.id, updates);
    setIsEditingChannel(false);
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannel) return;
    if (window.confirm('Are you sure you want to delete this channel?')) {
      await deleteChannel(selectedChannel.id);
      setSelectedChannel(null);
    }
  };

  const handleUpdateMembers = async (members: string[]) => {
    if (!selectedChannel) return;
    await updateChannel(selectedChannel.id, { members });
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Channels Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Input
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
            fullWidth
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Channels</h2>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsCreatingChannel(true)}
            >
              New
            </Button>
          </div>

          <div className="space-y-1">
            {filteredChannels.map(channel => (
              <button
                key={channel.id}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                  selectedChannel?.id === channel.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedChannel(channel)}
              >
                {channel.is_private ? '🔒 ' : '#'} {channel.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <ChannelHeader
              channel={selectedChannel}
              onEditChannel={() => setIsEditingChannel(true)}
              onDeleteChannel={handleDeleteChannel}
              onUpdateMembers={handleUpdateMembers}
            />

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {messages.map(message => (
                  <Message
                    key={message.id}
                    {...message}
                    currentUserId={user?.id || ''}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a channel to start messaging</p>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <Modal
        isOpen={isCreatingChannel}
        onClose={() => setIsCreatingChannel(false)}
        title="Create New Channel"
      >
        <div className="space-y-4">
          <Input
            label="Channel Name"
            value={newChannelData.name}
            onChange={(e) => setNewChannelData({ ...newChannelData, name: e.target.value })}
            placeholder="e.g., marketing-team"
            required
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={newChannelData.description}
              onChange={(e) => setNewChannelData({ ...newChannelData, description: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              rows={3}
              placeholder="What's this channel about?"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_private"
              checked={newChannelData.is_private}
              onChange={(e) => setNewChannelData({ ...newChannelData, is_private: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_private" className="ml-2 block text-sm text-gray-900">
              Make this channel private
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsCreatingChannel(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateChannel}
              disabled={!newChannelData.name.trim()}
            >
              Create Channel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Channel Modal */}
      {selectedChannel && (
        <Modal
          isOpen={isEditingChannel}
          onClose={() => setIsEditingChannel(false)}
          title="Edit Channel"
        >
          <div className="space-y-4">
            <Input
              label="Channel Name"
              value={selectedChannel.name}
              onChange={(e) => handleUpdateChannel({ name: e.target.value })}
              placeholder="e.g., marketing-team"
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={selectedChannel.description}
                onChange={(e) => handleUpdateChannel({ description: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={3}
                placeholder="What's this channel about?"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit_is_private"
                checked={selectedChannel.is_private}
                onChange={(e) => handleUpdateChannel({ is_private: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="edit_is_private" className="ml-2 block text-sm text-gray-900">
                Make this channel private
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsEditingChannel(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsEditingChannel(false)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MessagesPage;