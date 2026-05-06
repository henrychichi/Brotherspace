import { supabase } from './supabase.ts';
import {
  Category,
  ChatMessage,
  Goal,
  Group,
  Notification,
  NotificationPreferences,
  Post,
  PrivateChat,
  Report,
  Reply,
  SystemStatus,
  User,
  UserRole,
} from '../types.ts';

type ProfileRow = {
  id: string;
  username: string | null;
  anon_name: string;
  role: string;
  color: string | null;
  age: number | null;
  is_admin: boolean;
  is_banned: boolean;
  is_supporter: boolean;
  is_paid_member: boolean;
  trial_started_at: string | null;
  notification_preferences: NotificationPreferences | null;
  created_at: string;
  updated_at: string | null;
};

type BookmarkRow = { post_id: string };
type UserGroupRow = { group_id: string };
type SystemStatusRow = { id: number; is_locked: boolean; locked_at: string | null };

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  newReplies: true,
  newMessages: true,
  systemUpdates: true,
};

const DEFAULT_COLOR = '#3A7AFE';
const DEFAULT_ROLE: UserRole = 'Brother';

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const generateAnonName = () => `Brother_${Math.floor(Math.random() * 8999) + 1000}`;

const mapProfileToUser = (
  profile: ProfileRow,
  extras: { bookmarks?: string[]; joined_groups?: string[] } = {}
): User => ({
  id: profile.id,
  username: profile.username || profile.anon_name,
  anon_name: profile.anon_name,
  role: (profile.role as UserRole) || DEFAULT_ROLE,
  color: profile.color || DEFAULT_COLOR,
  isAdmin: profile.is_admin,
  isBanned: profile.is_banned,
  is_supporter: profile.is_supporter,
  is_paid_member: profile.is_paid_member,
  trial_started_at: profile.trial_started_at || undefined,
  created_at: profile.created_at,
  bookmarks: extras.bookmarks || [],
  age: profile.age || undefined,
  joined_groups: extras.joined_groups || [],
  notificationPreferences: profile.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
});

const mapPostRow = (row: any): Post => ({
  id: row.id,
  user_id: row.user_id,
  anon_name: row.anon_name,
  role: row.role,
  category: row.category,
  group_id: row.group_id || undefined,
  content: row.content,
  color: row.color || undefined,
  is_supporter: row.is_supporter,
  audio_data: row.audio_data || undefined,
  video_url: row.video_url || undefined,
  image_url: row.image_url || undefined,
  type: row.type || undefined,
  created_at: row.created_at,
  last_active_at: row.last_active_at || undefined,
  reply_count: row.reply_count || 0,
  upvotes: row.upvotes || [],
  downvotes: row.downvotes || [],
});

const mapReplyRow = (row: any): Reply => ({
  id: row.id,
  post_id: row.post_id,
  user_id: row.user_id,
  anon_name: row.anon_name,
  role: row.role,
  content: row.content,
  color: row.color || undefined,
  is_supporter: row.is_supporter,
  audio_data: row.audio_data || undefined,
  helpful_count: row.helpful_count || 0,
  created_at: row.created_at,
});

const mapGroupRow = (row: any): Group => ({
  id: row.id,
  name: row.name,
  description: row.description,
  member_count: row.member_count || 0,
  min_age: row.min_age || undefined,
});

const mapNotificationRow = (row: any): Notification => ({
  id: row.id,
  user_id: row.user_id,
  type: row.type,
  title: row.title,
  message: row.message,
  read: row.read,
  created_at: row.created_at,
  data: row.data,
});

const mapGoalRow = (row: any): Goal => ({
  id: row.id,
  user_id: row.user_id,
  text: row.text,
  progress: row.progress,
  week_number: row.week_number,
  year: row.year,
  completed: row.completed,
  created_at: row.created_at,
});

const mapChatRow = (row: any): PrivateChat => ({
  id: row.id,
  post_id: row.post_id,
  reply_id: row.reply_id,
  initiator_id: row.initiator_id,
  receiver_id: row.receiver_id,
  initiator_name: row.initiator_name,
  receiver_name: row.receiver_name,
  status: row.status,
  blocked_by: row.blocked_by || undefined,
  created_at: row.created_at,
  last_message: row.last_message || undefined,
});

async function getAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

async function getProfileByUserId(userId: string): Promise<User | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) return null;

  const [bookmarksResult, groupsResult] = await Promise.all([
    supabase.from('bookmarks').select('post_id').eq('user_id', userId),
    supabase.from('user_groups').select('group_id').eq('user_id', userId),
  ]);

  return mapProfileToUser(profile as ProfileRow, {
    bookmarks: (bookmarksResult.data || []).map((row: BookmarkRow) => row.post_id),
    joined_groups: (groupsResult.data || []).map((row: UserGroupRow) => row.group_id),
  });
}

async function getCurrentAuthedUser(): Promise<User | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return getProfileByUserId(authUser.id);
}

async function getCurrentUserProfile(): Promise<User> {
  const user = await getCurrentAuthedUser();
  if (!user) throw new Error('No authenticated profile found.');
  return user;
}

async function ensureProfileFromSignup(authUserId: string, username: string, role: UserRole, age?: number) {
  const payload = {
    id: authUserId,
    username,
    anon_name: generateAnonName(),
    role,
    color: DEFAULT_COLOR,
    age: age ?? null,
    is_admin: username.toLowerCase().startsWith('admin'),
    is_banned: false,
    is_supporter: false,
    is_paid_member: false,
    trial_started_at: null,
    notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) throw error;

  const user = await getProfileByUserId(authUserId);
  if (!user) throw new Error('Profile creation failed.');
  return user;
}

async function requireOwnOrAdminPost(postId: string, userId: string) {
  const { data: postRow, error } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
  if (error || !postRow) throw new Error('Post not found');

  const current = await getCurrentAuthedUser();
  if (!current) throw new Error('Not authenticated');

  if (postRow.user_id !== userId && !current.isAdmin) {
    throw new Error('Unauthorized');
  }

  return mapPostRow(postRow);
}

export const api = {
  getCurrentUser: async (): Promise<User | null> => getCurrentAuthedUser(),

  login: async (emailOrUsername: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrUsername,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Login failed.');

    const user = await getProfileByUserId(data.user.id);
    if (!user) throw new Error('Profile not found.');
    return user;
  },

  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  },

  signup: async (email: string, username: string, password: string, role: UserRole, age?: number): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          anon_name: generateAnonName(),
          role,
          age,
          color: DEFAULT_COLOR,
        },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Signup failed.');

    return ensureProfileFromSignup(data.user.id, username, role, age);
  },

  updateNotificationPreferences: async (userId: string, preferences: NotificationPreferences): Promise<User> => {
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  getGroups: async (): Promise<Group[]> => {
    const { data, error } = await supabase.from('groups').select('*').order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapGroupRow);
  },

  joinGroup: async (userId: string, groupId: string): Promise<User> => {
    const { error } = await supabase.from('user_groups').upsert({ user_id: userId, group_id: groupId });
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  leaveGroup: async (userId: string, groupId: string): Promise<User> => {
    const { error } = await supabase.from('user_groups').delete().eq('user_id', userId).eq('group_id', groupId);
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  updateUsername: async (userId: string, newUsername: string): Promise<User> => {
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  updateColor: async (userId: string, color: string): Promise<User> => {
    const { error } = await supabase
      .from('profiles')
      .update({ color, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  updatePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<User> => {
    const authUser = await getAuthUser();
    if (!authUser?.email) throw new Error('No authenticated email available.');

    if (currentPassword) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error('Current password is incorrect');
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPostRow);
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => mapProfileToUser(row as ProfileRow));
  },

  deleteUser: async (userId: string): Promise<void> => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  },

  banUser: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: true, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  },

  unbanUser: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: false, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  },

  deletePostAsAdmin: async (postId: string): Promise<void> => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  },

  createPost: async (
    userId: string,
    username: string,
    role: UserRole,
    category: Category,
    content: string,
    groupId?: string,
    color?: string,
    audioData?: string,
    videoUrl?: string,
    imageUrl?: string,
    type?: 'question' | 'topic'
  ): Promise<Post> => {
    const current = await getCurrentUserProfile();
    const payload = {
      user_id: userId,
      anon_name: current.anon_name,
      role,
      category,
      group_id: groupId || null,
      content,
      color: color || current.color || DEFAULT_COLOR,
      is_supporter: current.is_supporter || false,
      audio_data: audioData || null,
      video_url: videoUrl || null,
      image_url: imageUrl || null,
      type: type || null,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      reply_count: 0,
      upvotes: [],
      downvotes: [],
    };

    const { data, error } = await supabase.from('posts').insert(payload).select('*').single();
    if (error) throw error;
    return mapPostRow(data);
  },

  updatePost: async (postId: string, userId: string, category: Category, content: string): Promise<Post> => {
    await requireOwnOrAdminPost(postId, userId);

    const { data, error } = await supabase
      .from('posts')
      .update({ category, content, last_active_at: new Date().toISOString() })
      .eq('id', postId)
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return mapPostRow(data);
  },

  votePost: async (postId: string, userId: string, voteType: 'up' | 'down' | 'none'): Promise<Post> => {
    const { data: postRow, error } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
    if (error || !postRow) throw new Error('Post not found');

    const post = mapPostRow(postRow);
    const upvotes = new Set(post.upvotes || []);
    const downvotes = new Set(post.downvotes || []);
    upvotes.delete(userId);
    downvotes.delete(userId);
    if (voteType === 'up') upvotes.add(userId);
    if (voteType === 'down') downvotes.add(userId);

    const { data, error: updateError } = await supabase
      .from('posts')
      .update({
        upvotes: Array.from(upvotes),
        downvotes: Array.from(downvotes),
        last_active_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select('*')
      .single();
    if (updateError) throw updateError;
    return mapPostRow(data);
  },

  deletePost: async (postId: string, userId: string): Promise<void> => {
    await requireOwnOrAdminPost(postId, userId);

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  },

  getReplies: async (postId: string): Promise<Reply[]> => {
    const { data, error } = await supabase.from('replies').select('*').eq('post_id', postId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapReplyRow);
  },

  createReply: async (
    postId: string,
    userId: string,
    username: string,
    role: UserRole,
    content: string,
    color?: string,
    audioData?: string
  ): Promise<Reply> => {
    const current = await getCurrentUserProfile();
    const payload = {
      post_id: postId,
      user_id: userId,
      anon_name: current.anon_name,
      role,
      content,
      color: color || current.color || DEFAULT_COLOR,
      is_supporter: current.is_supporter || false,
      audio_data: audioData || null,
      helpful_count: 0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('replies').insert(payload).select('*').single();
    if (error) throw error;

    const { data: postRow } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
    if (postRow) {
      await supabase
        .from('posts')
        .update({
          reply_count: (postRow.reply_count || 0) + 1,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (postRow.user_id !== userId) {
        await api.createNotification(postRow.user_id, 'REPLY', 'New Reply', `${current.anon_name} replied to your post.`);
      }
    }

    return mapReplyRow(data);
  },

  markHelpful: async (replyId: string): Promise<void> => {
    const { data: replyRow, error } = await supabase.from('replies').select('*').eq('id', replyId).maybeSingle();
    if (error || !replyRow) throw new Error('Reply not found');

    const { error: updateError } = await supabase
      .from('replies')
      .update({ helpful_count: (replyRow.helpful_count || 0) + 1 })
      .eq('id', replyId);
    if (updateError) throw updateError;
  },

  toggleBookmark: async (userId: string, postId: string): Promise<User> => {
    const { data: existing, error: existingError } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId).eq('post_id', postId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('bookmarks').insert({ user_id: userId, post_id: postId });
      if (error) throw error;
    }

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  getBookmarkedPosts: async (userId: string): Promise<Post[]> => {
    const { data: bookmarks, error: bookmarkError } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userId);
    if (bookmarkError) throw bookmarkError;

    const ids = (bookmarks || []).map((row: BookmarkRow) => row.post_id);
    if (!ids.length) return [];

    const { data: posts, error: postsError } = await supabase.from('posts').select('*').in('id', ids);
    if (postsError) throw postsError;
    return (posts || []).map(mapPostRow);
  },

  reportItem: async (type: 'post' | 'reply' | 'chat', itemId: string, reason: string): Promise<void> => {
    const { error } = await supabase.from('reports').insert({
      type,
      item_id: itemId,
      reason,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  getReports: async (): Promise<Report[]> => {
    const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      item_id: row.item_id,
      reason: row.reason,
      created_at: row.created_at,
    }));
  },

  deleteReport: async (reportId: string): Promise<void> => {
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) throw error;
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapNotificationRow);
  },

  createNotification: async (
    userId: string,
    type: 'REPLY' | 'CHAT_REQUEST' | 'SYSTEM' | 'GOAL_ACHIEVED',
    title: string,
    message: string,
    data?: any
  ): Promise<void> => {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      read: false,
      data: data || null,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  markNotificationRead: async (notifId: string): Promise<void> => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    if (error) throw error;
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    const { data, error } = await supabase.from('system_status').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    if (!data) return { isLocked: false };

    const row = data as SystemStatusRow;
    return { isLocked: row.is_locked, lockedAt: row.locked_at || undefined };
  },

  setSystemStatus: async (isLocked: boolean): Promise<void> => {
    const { error } = await supabase.from('system_status').upsert({
      id: 1,
      is_locked: isLocked,
      locked_at: isLocked ? new Date().toISOString() : null,
    });
    if (error) throw error;
  },

  getPrivateChats: async (userId: string): Promise<PrivateChat[]> => {
    const { data, error } = await supabase
      .from('private_chats')
      .select('*')
      .or(`initiator_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapChatRow);
  },

  initiatePrivateChat: async (initiator: User, reply: Reply): Promise<PrivateChat> => {
    const { data: existing, error: existingError } = await supabase
      .from('private_chats')
      .select('*')
      .eq('reply_id', reply.id)
      .eq('initiator_id', initiator.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return mapChatRow(existing);

    const payload = {
      post_id: reply.post_id,
      reply_id: reply.id,
      initiator_id: initiator.id,
      receiver_id: reply.user_id,
      initiator_name: initiator.anon_name,
      receiver_name: reply.anon_name,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('private_chats').insert(payload).select('*').single();
    if (error) throw error;

    await api.createNotification(reply.user_id, 'CHAT_REQUEST', 'New Chat Request', `${initiator.anon_name} wants to talk privately.`);
    return mapChatRow(data);
  },

  acceptChat: async (chatId: string): Promise<void> => {
    const { error } = await supabase.from('private_chats').update({ status: 'ACTIVE' }).eq('id', chatId);
    if (error) throw error;
  },

  blockChat: async (chatId: string, userId: string): Promise<void> => {
    const { error } = await supabase.from('private_chats').update({ status: 'BLOCKED', blocked_by: userId }).eq('id', chatId);
    if (error) throw error;
  },

  getChatMessages: async (chatId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase.from('chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      chat_id: row.chat_id,
      sender_id: row.sender_id,
      content: row.content,
      created_at: row.created_at,
    }));
  },

  sendMessage: async (chatId: string, senderId: string, content: string): Promise<ChatMessage> => {
    const { data, error } = await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    }).select('*').single();
    if (error) throw error;

    const { error: chatError } = await supabase.from('private_chats').update({ last_message: content }).eq('id', chatId);
    if (chatError) throw chatError;

    return {
      id: data.id,
      chat_id: data.chat_id,
      sender_id: data.sender_id,
      content: data.content,
      created_at: data.created_at,
    };
  },

  getWeeklyGoal: async (userId: string): Promise<Goal | null> => {
    const week_number = getWeekNumber(new Date());
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('week_number', week_number)
      .eq('year', year)
      .maybeSingle();
    if (error) throw error;
    return data ? mapGoalRow(data) : null;
  },

  setWeeklyGoal: async (userId: string, text: string): Promise<Goal> => {
    const week_number = getWeekNumber(new Date());
    const year = new Date().getFullYear();

    const { data, error } = await supabase
      .from('goals')
      .upsert({
        user_id: userId,
        text,
        progress: 0,
        week_number,
        year,
        completed: false,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_number,year' })
      .select('*')
      .single();
    if (error) throw error;
    return mapGoalRow(data);
  },

  updateGoalProgress: async (goalId: string, progress: number): Promise<Goal> => {
    const { data: current, error: fetchError } = await supabase.from('goals').select('*').eq('id', goalId).maybeSingle();
    if (fetchError || !current) throw new Error('Goal not found');

    const completed = progress >= 100;
    const { data, error } = await supabase
      .from('goals')
      .update({ progress, completed })
      .eq('id', goalId)
      .select('*')
      .single();
    if (error) throw error;

    if (!current.completed && completed) {
      await api.createNotification(current.user_id, 'GOAL_ACHIEVED', 'Goal Achieved!', 'You completed your weekly goal. Stay strong!');
    }

    return mapGoalRow(data);
  },

  toggleSystemLock: async (): Promise<SystemStatus> => {
    const current = await api.getSystemStatus();
    await api.setSystemStatus(!current.isLocked);
    return { isLocked: !current.isLocked, lockedAt: !current.isLocked ? new Date().toISOString() : undefined };
  },

  completeMembershipPayment: async (userId: string): Promise<User> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_paid_member: true, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  setSupporterStatus: async (userId: string, isSupporter: boolean = true): Promise<User> => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_supporter: isSupporter, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;

    const user = await getProfileByUserId(userId);
    if (!user) throw new Error('User not found');
    return user;
  },

  deleteAccount: async (userId: string): Promise<void> => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  },

  getAnalytics: async () => {
    const [{ count: totalUsers }, { count: totalPosts }, { count: totalReplies }, { data: posts }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('replies').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('category'),
    ]);

    const categoryStats: Record<Category, number> = {
      Stress: 0,
      Money: 0,
      Relationships: 0,
      Work: 0,
      Life: 0,
    };

    (posts || []).forEach((row: any) => {
      const category = row.category as Category;
      if (category in categoryStats) {
        categoryStats[category] += 1;
      }
    });

    return {
      totalUsers: totalUsers || 0,
      totalPosts: totalPosts || 0,
      totalReplies: totalReplies || 0,
      activeUsers: Math.max(1, Math.floor((totalUsers || 0) * 0.4)),
      categoryStats,
    };
  },
};
