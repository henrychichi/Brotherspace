
export type Category = 'Stress' | 'Money' | 'Relationships' | 'Work' | 'Life';
export type UserRole = 'Young adult' | 'Father' | 'Married' | 'Business owner' | 'Brother';

export interface NotificationPreferences {
  newReplies: boolean;
  newMessages: boolean;
  systemUpdates: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  anon_name: string;
  role: UserRole;
  color?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  is_supporter?: boolean;
  trial_started_at?: string;
  is_paid_member?: boolean;
  created_at: string;
  bookmarks: string[];
  age?: number;
  joined_groups?: string[];
  notificationPreferences?: NotificationPreferences;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
  min_age?: number;
}

export interface Goal {
  id: string;
  user_id: string;
  text: string;
  progress: number; // 0 to 100
  week_number: number;
  year: number;
  completed: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  anon_name: string;
  role: UserRole;
  category: Category;
  group_id?: string;
  content: string;
  color?: string;
  is_supporter?: boolean;
  audio_data?: string;
  video_url?: string;
  image_url?: string;
  type?: 'question' | 'topic';
  created_at: string;
  last_active_at?: string;
  reply_count: number;
  upvotes?: string[];
  downvotes?: string[];
}

export interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  anon_name: string;
  role: UserRole;
  content: string;
  color?: string;
  is_supporter?: boolean;
  audio_data?: string;
  helpful_count: number;
  created_at: string;
}

export interface PrivateChat {
  id: string;
  post_id: string;
  reply_id: string;
  initiator_id: string;
  receiver_id: string;
  initiator_name: string;
  receiver_name: string;
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  blocked_by?: string;
  created_at: string;
  last_message?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'REPLY' | 'CHAT_REQUEST' | 'SYSTEM' | 'GOAL_ACHIEVED';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export interface Report {
  id: string;
  type: 'post' | 'reply' | 'chat';
  item_id: string;
  reason: string;
  created_at: string;
}

export interface SystemStatus {
  isLocked: boolean;
  lockedAt?: string;
}
