import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  channel_id: string;
  created_at: string;
  attachments?: string[];
  reactions?: { emoji: string; users: string[] }[];
  thread_id?: string;
  edited?: boolean;
  pinned?: boolean;
  mentions?: string[];
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  created_by: string;
  created_at: string;
  is_private: boolean;
  members: string[];
  last_message?: Message;
  unread_count?: number;
}

interface Thread {
  id: string;
  parent_message_id: string;
  messages: Message[];
}

interface MessageState {
  channels: Channel[];
  messages: Message[];
  threads: Thread[];
  selectedChannel: Channel | null;
  selectedThread: Thread | null;
  socket: Socket | null;
  loading: boolean;
  error: string | null;
  searchResults: Message[];
  pinnedMessages: Message[];
  unreadChannels: Set<string>;
  userPresence: Record<string, { online: boolean; last_seen: string }>;
  typing: Record<string, string[]>;

  // Channel actions
  fetchChannels: (companyId: string) => Promise<void>;
  createChannel: (channel: Omit<Channel, 'id' | 'created_at'>) => Promise<void>;
  updateChannel: (channelId: string, updates: Partial<Channel>) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  joinChannel: (channelId: string, userId: string) => Promise<void>;
  leaveChannel: (channelId: string, userId: string) => Promise<void>;
  setSelectedChannel: (channel: Channel | null) => void;

  // Message actions
  fetchMessages: (channelId: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'created_at'>) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  unpinMessage: (messageId: string) => Promise<void>;

  // Thread actions
  fetchThread: (messageId: string) => Promise<void>;
  sendThreadReply: (threadId: string, message: Omit<Message, 'id' | 'created_at'>) => Promise<void>;
  setSelectedThread: (thread: Thread | null) => void;

  // Search
  searchMessages: (query: string) => Promise<void>;

  // Real-time features
  initializeSocket: () => void;
  disconnectSocket: () => void;
  setTyping: (channelId: string, userId: string) => void;
  clearTyping: (channelId: string, userId: string) => void;
  markChannelAsRead: (channelId: string) => void;
  updateUserPresence: (userId: string, status: { online: boolean; last_seen: string }) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  channels: [],
  messages: [],
  threads: [],
  selectedChannel: null,
  selectedThread: null,
  socket: null,
  loading: false,
  error: null,
  searchResults: [],
  pinnedMessages: [],
  unreadChannels: new Set(),
  userPresence: {},
  typing: {},

  fetchChannels: async (companyId) => {
    try {
      set({ loading: true, error: null });
      
      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) {
        throw new Error('Invalid company ID format');
      }

      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      set({ channels: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching channels:', error);
      set({ error: error.message, loading: false });
    }
  },

  createChannel: async (channel) => {
    try {
      set({ loading: true, error: null });
      
      // Validate UUID format for company_id
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channel.company_id)) {
        throw new Error('Invalid company ID format');
      }

      const { data, error } = await supabase
        .from('channels')
        .insert([channel])
        .select()
        .single();

      if (error) throw error;
      set(state => ({ 
        channels: [...state.channels, data],
        loading: false 
      }));
    } catch (error: any) {
      console.error('Error creating channel:', error);
      set({ error: error.message, loading: false });
    }
  },

  updateChannel: async (channelId, updates) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelId);

      if (error) throw error;
      set(state => ({
        channels: state.channels.map(channel =>
          channel.id === channelId ? { ...channel, ...updates } : channel
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error('Error updating channel:', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteChannel: async (channelId) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      set(state => ({
        channels: state.channels.filter(channel => channel.id !== channelId),
        loading: false
      }));
    } catch (error: any) {
      console.error('Error deleting channel:', error);
      set({ error: error.message, loading: false });
    }
  },

  joinChannel: async (channelId, userId) => {
    try {
      const channel = get().channels.find(c => c.id === channelId);
      if (!channel) return;

      const updatedMembers = [...channel.members, userId];
      await get().updateChannel(channelId, { members: updatedMembers });
    } catch (error: any) {
      console.error('Error joining channel:', error);
      set({ error: error.message });
    }
  },

  leaveChannel: async (channelId, userId) => {
    try {
      const channel = get().channels.find(c => c.id === channelId);
      if (!channel) return;

      const updatedMembers = channel.members.filter(id => id !== userId);
      await get().updateChannel(channelId, { members: updatedMembers });
    } catch (error: any) {
      console.error('Error leaving channel:', error);
      set({ error: error.message });
    }
  },

  setSelectedChannel: (channel) => {
    set({ selectedChannel: channel });
    if (channel) {
      get().markChannelAsRead(channel.id);
      get().fetchMessages(channel.id);
    }
  },

  fetchMessages: async (channelId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ messages: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ error: error.message, loading: false });
    }
  },

  sendMessage: async (message) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        messages: [...state.messages, data],
        loading: false
      }));

      // Emit message via socket
      if (get().socket) {
        get().socket.emit('new_message', data);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      set({ error: error.message, loading: false });
    }
  },

  editMessage: async (messageId, content) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('messages')
        .update({ content, edited: true })
        .eq('id', messageId);

      if (error) throw error;

      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, content, edited: true } : msg
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error('Error editing message:', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteMessage: async (messageId) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      set(state => ({
        messages: state.messages.filter(msg => msg.id !== messageId),
        loading: false
      }));
    } catch (error: any) {
      console.error('Error deleting message:', error);
      set({ error: error.message, loading: false });
    }
  },

  addReaction: async (messageId, emoji, userId) => {
    try {
      const message = get().messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);

      let updatedReactions;
      if (existingReaction) {
        if (!existingReaction.users.includes(userId)) {
          updatedReactions = reactions.map(r =>
            r.emoji === emoji ? { ...r, users: [...r.users, userId] } : r
          );
        } else {
          return; // User already reacted with this emoji
        }
      } else {
        updatedReactions = [...reactions, { emoji, users: [userId] }];
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) throw error;

      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
        )
      }));
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      set({ error: error.message });
    }
  },

  removeReaction: async (messageId, emoji, userId) => {
    try {
      const message = get().messages.find(m => m.id === messageId);
      if (!message || !message.reactions) return;

      const updatedReactions = message.reactions
        .map(r => {
          if (r.emoji === emoji) {
            const users = r.users.filter(id => id !== userId);
            return users.length > 0 ? { ...r, users } : null;
          }
          return r;
        })
        .filter(Boolean) as { emoji: string; users: string[] }[];

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) throw error;

      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
        )
      }));
    } catch (error: any) {
      console.error('Error removing reaction:', error);
      set({ error: error.message });
    }
  },

  pinMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ pinned: true })
        .eq('id', messageId);

      if (error) throw error;

      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, pinned: true } : msg
        ),
        pinnedMessages: [...state.pinnedMessages, state.messages.find(m => m.id === messageId)!]
      }));
    } catch (error: any) {
      console.error('Error pinning message:', error);
      set({ error: error.message });
    }
  },

  unpinMessage: async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ pinned: false })
        .eq('id', messageId);

      if (error) throw error;

      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === messageId ? { ...msg, pinned: false } : msg
        ),
        pinnedMessages: state.pinnedMessages.filter(m => m.id !== messageId)
      }));
    } catch (error: any) {
      console.error('Error unpinning message:', error);
      set({ error: error.message });
    }
  },

  fetchThread: async (messageId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const thread: Thread = {
        id: messageId,
        parent_message_id: messageId,
        messages: data || []
      };

      set(state => ({
        threads: [...state.threads, thread],
        selectedThread: thread,
        loading: false
      }));
    } catch (error: any) {
      console.error('Error fetching thread:', error);
      set({ error: error.message, loading: false });
    }
  },

  sendThreadReply: async (threadId, message) => {
    try {
      const newMessage = {
        ...message,
        thread_id: threadId
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        threads: state.threads.map(thread =>
          thread.id === threadId
            ? { ...thread, messages: [...thread.messages, data] }
            : thread
        )
      }));
    } catch (error: any) {
      console.error('Error sending thread reply:', error);
      set({ error: error.message });
    }
  },

  setSelectedThread: (thread) => {
    set({ selectedThread: thread });
  },

  searchMessages: async (query) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .textSearch('content', query);

      if (error) throw error;
      set({ searchResults: data || [], loading: false });
    } catch (error: any) {
      console.error('Error searching messages:', error);
      set({ error: error.message, loading: false });
    }
  },

  initializeSocket: () => {
    const socket = io('wss://your-websocket-server.com');

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('new_message', (message: Message) => {
      set(state => ({
        messages: [...state.messages, message],
        unreadChannels: state.selectedChannel?.id !== message.channel_id
          ? new Set([...state.unreadChannels, message.channel_id])
          : state.unreadChannels
      }));
    });

    socket.on('user_typing', ({ channelId, userId }) => {
      set(state => ({
        typing: {
          ...state.typing,
          [channelId]: [...(state.typing[channelId] || []), userId]
        }
      }));
    });

    socket.on('user_stopped_typing', ({ channelId, userId }) => {
      set(state => ({
        typing: {
          ...state.typing,
          [channelId]: (state.typing[channelId] || []).filter(id => id !== userId)
        }
      }));
    });

    socket.on('presence_update', ({ userId, status }) => {
      get().updateUserPresence(userId, status);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  setTyping: (channelId, userId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('typing', { channelId, userId });
    }
  },

  clearTyping: (channelId, userId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('stop_typing', { channelId, userId });
    }
  },

  markChannelAsRead: (channelId) => {
    set(state => ({
      unreadChannels: new Set(
        Array.from(state.unreadChannels).filter(id => id !== channelId)
      )
    }));
  },

  updateUserPresence: (userId, status) => {
    set(state => ({
      userPresence: {
        ...state.userPresence,
        [userId]: status
      }
    }));
  }
}));

