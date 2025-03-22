import React from 'react';
import { format } from 'date-fns';
import { User } from 'lucide-react';
import ActivityLink from './ActivityLink';

interface MessageProps {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  currentUserId: string;
  activityIds?: string[];
}

const Message: React.FC<MessageProps> = ({
  id,
  content,
  sender_id,
  created_at,
  currentUserId,
  activityIds = []
}) => {
  const isCurrentUser = sender_id === currentUserId;

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-lg ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
        </div>
        <div className={`mx-2 space-y-2`}>
          <div className={`${
            isCurrentUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          } rounded-lg px-4 py-2`}>
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
          
          {activityIds.length > 0 && (
            <div className="space-y-2">
              {activityIds.map(activityId => (
                <ActivityLink key={activityId} activityId={activityId} />
              ))}
            </div>
          )}
          
          <div className={`text-xs text-gray-500 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
            {format(new Date(created_at), 'MMM d, h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;