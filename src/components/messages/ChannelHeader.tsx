import React, { useState } from 'react';
import { Edit, Trash2, Users, Info } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ChannelUserManager from './ChannelUserManager';

interface ChannelHeaderProps {
  channel: {
    id: string;
    name: string;
    description?: string;
    members: string[];
    is_private: boolean;
  };
  onEditChannel: () => void;
  onDeleteChannel: () => void;
  onUpdateMembers: (members: string[]) => void;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  channel,
  onEditChannel,
  onDeleteChannel,
  onUpdateMembers
}) => {
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);

  const handleAddMember = (userId: string) => {
    onUpdateMembers([...channel.members, userId]);
  };

  const handleRemoveMember = (userId: string) => {
    onUpdateMembers(channel.members.filter(id => id !== userId));
  };

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {channel.is_private ? '🔒 ' : '#'} {channel.name}
          </h2>
          {channel.description && (
            <p className="text-sm text-gray-500">
              {channel.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Users size={16} />}
            onClick={() => setIsUserManagerOpen(true)}
          >
            {channel.members.length} members
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit size={16} />}
            onClick={onEditChannel}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 size={16} />}
            onClick={onDeleteChannel}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* User Manager Modal */}
      <Modal
        isOpen={isUserManagerOpen}
        onClose={() => setIsUserManagerOpen(false)}
        title="Manage Channel Members"
        size="lg"
      >
        <ChannelUserManager
          channelId={channel.id}
          members={channel.members}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      </Modal>
    </div>
  );
};

export default ChannelHeader;