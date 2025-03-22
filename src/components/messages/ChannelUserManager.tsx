import React, { useState } from 'react';
import { User, Search, Plus, X, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface ChannelUserManagerProps {
  channelId: string;
  members: string[];
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
}

const ChannelUserManager: React.FC<ChannelUserManagerProps> = ({
  channelId,
  members,
  onAddMember,
  onRemoveMember
}) => {
  const { user: currentUser, companies, currentCompanyId } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Get all users from the current company
  const companyUsers = companies
    .find(c => c.id === currentCompanyId)
    ?.users || [];

  const filteredUsers = companyUsers.filter(user =>
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    user.id !== currentUser?.id // Don't show current user
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Members</h3>
        <div className="flex flex-wrap gap-2">
          {members.map(memberId => {
            const member = companyUsers.find(u => u.id === memberId);
            if (!member) return null;

            return (
              <div
                key={memberId}
                className="flex items-center bg-gray-100 rounded-full pl-2 pr-1 py-1"
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={14} className="text-blue-600" />
                  </div>
                )}
                <span className="mx-2 text-sm">{member.full_name || member.email}</span>
                <button
                  onClick={() => onRemoveMember(memberId)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Add Members</h3>
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search size={18} className="text-gray-400" />}
          fullWidth
        />

        <div className="mt-2 max-h-60 overflow-y-auto">
          {filteredUsers.map(user => {
            const isMember = members.includes(user.id);

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={16} className="text-blue-600" />
                    </div>
                  )}
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name || 'Unnamed User'}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>

                <Button
                  variant={isMember ? 'success' : 'outline'}
                  size="sm"
                  onClick={() => isMember ? onRemoveMember(user.id) : onAddMember(user.id)}
                  leftIcon={isMember ? <Check size={14} /> : <Plus size={14} />}
                >
                  {isMember ? 'Added' : 'Add'}
                </Button>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No users found matching your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelUserManager;