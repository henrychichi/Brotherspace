import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Post, Reply, User, Category, PrivateChat, ChatMessage, UserRole, SystemStatus, Notification, Group } from './types.ts';
import { CATEGORIES, DAILY_PROMPTS } from './constants.ts';
import { api } from './services/api.ts';
import { getAIAdvice } from './services/gemini.ts';
import { useAuth } from './services/AuthContext.tsx';
import PostCard from './components/PostCard.tsx';
import ReplyItem from './components/ReplyItem.tsx';
import SafetyBanner from './components/SafetyBanner.tsx';
import DailyPrompt from './components/DailyPrompt.tsx';
import AudioPlayer from './components/AudioPlayer.tsx';
import AudioRecorder from './components/AudioRecorder.tsx';
import MotivationalCarousel from './components/MotivationalCarousel.tsx';
import SupportSpace from './components/SupportSpace.tsx'; 
import WeeklyGoals from './components/WeeklyGoals.tsx';
import WeeklyMotion from './src/components/WeeklyMotion.tsx';
import ConfirmationDialog from './components/ConfirmationDialog.tsx';
import { motion, AnimatePresence } from 'framer-motion';

import ConfessScreen from './src/screens/ConfessScreen.tsx';
import AdminDashboard from './src/screens/AdminDashboard.tsx';

type Screen = 'WELCOME' | 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'HOME' | 'CREATE' | 'EDIT' | 'DETAILS' | 'MESSAGES' | 'CONVERSATION' | 'BOOKMARKS' | 'IDENTITY' | 'NOTIFICATIONS' | 'ADMIN' | 'SUPPORT' | 'GROUPS' | 'GROUP_FEED' | 'CONFESS';

interface AnalyticsData {
  totalUsers: number;
  totalPosts: number;
  totalReplies: number;
  activeUsers: number;
  categoryStats: Record<Category, number>;
}

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } 
  },
};

const ROLES: UserRole[] = ['Young adult', 'Father', 'Married', 'Business owner', 'Brother'];
const IDENTITY_COLORS = ['#3A7AFE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="100" height="100" rx="24" fill="white" />
    <path d="M75 35C75 26.7157 68.2843 20 60 20H40C31.7157 20 25 26.7157 25 35V55C25 63.2843 31.7157 70 40 70H45V85L60 70H60C68.2843 70 75 63.2843 75 55V35Z" fill="#4A44F2" />
    <circle cx="40" cy="45" r="4" fill="white" />
    <circle cx="50" cy="45" r="4" fill="white" />
    <circle cx="60" cy="45" r="4" fill="white" />
  </svg>
);

const App: React.FC = () => {
  const { user: authUser, loading: authLoading, setUser, signIn, signInWithPassword, signUp, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>('WELCOME');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // const [user, setUser] = useState<User | null>(null); // Replaced by authUser
  const user = authUser;
  const loading = authLoading;
  const [isPosting, setIsPosting] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<Category>('Stress');
  const [newPostColor, setNewPostColor] = useState('#1A1A1F');
  const [newPostAudioData, setNewPostAudioData] = useState<string | null>(null);
  const [newPostVideoUrl, setNewPostVideoUrl] = useState<string>('');
  const [newPostRecorderKey, setNewPostRecorderKey] = useState(0);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostCategory, setEditPostCategory] = useState<Category>('Stress');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ isLocked: false });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('Brother');
  const [authAge, setAuthAge] = useState('');
  const [authError, setAuthError] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3A7AFE');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [identitySuccess, setIdentitySuccess] = useState('');
  const [isUpdatingIdentity, setIsUpdatingIdentity] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    newReplies: true,
    newMessages: true,
    systemUpdates: true
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | 'All'>('All');
  const [creatingForGroupId, setCreatingForGroupId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const trialStatus = useMemo(() => {
    if (!user || !user.trial_started_at || user.is_paid_member) return { isExpired: false, daysLeft: 30 };
    const started = new Date(user.trial_started_at).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const diff = Date.now() - started;
    const daysLeft = Math.max(0, Math.ceil((thirtyDays - diff) / (1000 * 60 * 60 * 24)));
    return { isExpired: diff > thirtyDays, daysLeft };
  }, [user]);

  const dailyPrompt = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
  }, []);

  const refreshPosts = async () => {
    try {
      const allPosts = await api.getPosts();
      setPosts(allPosts || []);
      setAppError(null);
    } catch (err: any) {
      console.warn("Failed to load feed:", err.message);
      // Fallback to empty feed instead of showing error screen
      setPosts([]);
      setAppError(null);
    }
  };

  const refreshGroups = async () => {
    try {
      const allGroups = await api.getGroups();
      setGroups(allGroups || []);
    } catch (err: any) {
      console.error("Failed to load groups:", err.message);
    }
  };

  const refreshChats = async (uid: string) => {
    try {
      const userChats = await api.getPrivateChats(uid);
      setChats(userChats || []);
    } catch (err: any) {
      console.error("Failed to load chats:", err.message);
    }
  };

  const refreshNotifications = async (uid: string) => {
    try {
      const notifs = await api.getNotifications(uid);
      setNotifications(notifs || []);
    } catch (err: any) {
      console.error("Failed to load notifications:", err.message);
    }
  };

  const initializeApp = async () => {
    // setLoading(true); // Handled by AuthContext
    setAppError(null);
    try {
      const currentUser = await api.getCurrentUser();
      const status = await api.getSystemStatus();
      setSystemStatus(status);
      
      if (currentUser) {
        // setUser(currentUser); // Handled by AuthContext
        setEditUsername(currentUser.username);
        setSelectedColor(currentUser.color || '#3A7AFE');
        setScreen('HOME');
        const saved = await api.getBookmarkedPosts(currentUser.id);
        setBookmarkedPosts(saved || []);
        refreshChats(currentUser.id);
        refreshNotifications(currentUser.id);
        refreshGroups();
        if (currentUser.isAdmin) {
           const stats = await api.getAnalytics();
           setAnalytics(stats);
        }
      }
      await refreshPosts();
    } catch (err: any) {
      console.error("Initialization error:", err.message);
      setAppError("System error during initialization.");
    } finally {
      // setLoading(false); // Handled by AuthContext
    }
  };

  useEffect(() => {
    initializeApp();
  }, [user?.id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (!authPassword) {
      setAuthError("Please enter your password.");
      return;
    }
    try {
      await signInWithPassword(authEmail, authPassword);
      setScreen('HOME');
    } catch (err: any) {
      setAuthError(err.message || "Login error");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError("Please enter a valid email address.");
      return;
    }
    try {
      await api.resetPassword(forgotPasswordEmail);
      setForgotPasswordSuccess("Password reset link sent to your email.");
    } catch (err: any) {
      setForgotPasswordError(err.message || "Error sending reset link");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    try {
      await signUp(authEmail, authPassword);
      setScreen('HOME');
    } catch (err: any) {
      setAuthError(err.message || "Signup error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // setUser(null); // Handled by AuthContext
      setScreen('WELCOME');
    } catch (err: any) {
      console.error("Logout failed:", err.message);
    }
  };

  const handleCreatePost = async () => {
    if (systemStatus.isLocked) return;
    if (!user) return;
    if (!newPostContent.trim() && !newPostAudioData && !newPostVideoUrl.trim()) { alert("Please type something, record a voice note, or add a video URL before posting."); return; }
    if (isPosting) return;

    setIsPosting(true);
    try {
      await api.createPost(user.id, user.username, user.role, newPostCategory, newPostContent, creatingForGroupId || undefined, newPostColor, newPostAudioData || undefined, newPostVideoUrl.trim() || undefined);
      setNewPostContent('');
      setNewPostColor('#1A1A1F');
      setNewPostAudioData(null);
      setNewPostVideoUrl('');
      setNewPostRecorderKey(prev => prev + 1);
      setScreen(creatingForGroupId ? 'GROUP_FEED' : 'HOME');
      refreshPosts();
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to post."));
    } finally {
      setIsPosting(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Video is too large. Please choose a video under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostVideoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePost = async () => {
    if (!user || !editingPostId || !editPostContent.trim()) return;
    try {
      const updated = await api.updatePost(editingPostId, user.id, editPostCategory, editPostContent);
      setPosts(prev => prev.map(p => p.id === editingPostId ? updated : p));
      setEditingPostId(null);
      setScreen('HOME');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePost = async () => {
    if (!user || !postToDelete) return;
    try {
      await api.deletePost(postToDelete, user.id);
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      setPostToDelete(null);
      if (screen === 'DETAILS') setScreen('HOME');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
  };

  const handleVotePost = async (postId: string, voteType: 'up' | 'down') => {
    if (!user) return;
    try {
      const updatedPost = await api.votePost(postId, user.id, voteType);
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBookmarkToggle = async (postId: string) => {
    if (!user) return;
    try {
      const updatedUser = await api.toggleBookmark(user.id, postId);
      setUser(updatedUser);
      const saved = await api.getBookmarkedPosts(user.id);
      setBookmarkedPosts(saved || []);
    } catch (err: any) {
      console.error("Bookmark toggle failed:", err.message);
    }
  };

  const handleReport = async (type: 'post' | 'reply' | 'chat', id: string) => {
    const reason = prompt("Reason for reporting?");
    if (!reason) return;
    try {
      await api.reportItem(type, id, reason);
      alert("Reported successfully.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTalkPrivately = async (reply: Reply) => {
    if (!user || systemStatus.isLocked) return;
    try {
      const chat = await api.initiatePrivateChat(user, reply);
      refreshChats(user.id);
      setSelectedChatId(chat.id);
      setScreen('CONVERSATION');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenIdentity = () => {
    if (user) {
      setEditUsername(user.username);
      setSelectedColor(user.color || '#3A7AFE');
      if (user.notificationPreferences) {
        setNotificationPrefs(user.notificationPreferences);
      } else {
        setNotificationPrefs({ newReplies: true, newMessages: true, systemUpdates: true });
      }
    }
    setScreen('IDENTITY');
  };

  const handleUpdateIdentity = async () => {
    setIdentityError(''); setIdentitySuccess('');
    if (!user) return;
    setIsUpdatingIdentity(true);
    try {
      let updatedUser = user;
      if (editUsername.trim() !== '' && editUsername !== user.username) {
        updatedUser = await api.updateUsername(user.id, editUsername);
      }
      if (selectedColor !== user.color) {
        updatedUser = await api.updateColor(user.id, selectedColor);
      }
      if (newPassword !== '') {
        if (newPassword !== confirmPassword) throw new Error('Passwords do not match.');
        updatedUser = await api.updatePassword(user.id, currentPassword, newPassword);
      }
      updatedUser = await api.updateNotificationPreferences(user.id, notificationPrefs);
      setUser(updatedUser);
      setIdentitySuccess('Updated successfully.');
    } catch (err: any) {
      setIdentityError(err.message);
    } finally {
      setIsUpdatingIdentity(false);
    }
  };

  const isPostBookmarked = (id: string) => user?.bookmarks?.includes(id) || false;
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  if (appError && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen max-w-lg mx-auto bg-brand-bg px-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-bold mb-4">Space Connection Error</h2>
        <p className="text-brand-secondary text-sm mb-8 leading-relaxed">{appError}</p>
        <button onClick={initializeApp} className="w-full h-12 bg-brand-accent text-white rounded-brand font-medium shadow-lg hover:brightness-110 transition-all">Try Again</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-brand-bg overflow-hidden relative shadow-2xl font-sans text-brand-primary">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex items-center justify-center h-screen">
            <LogoIcon className="w-16 h-16 animate-pulse" />
          </motion.div>
        ) : screen === 'WELCOME' ? (
          <motion.div key="welcome" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-between h-screen px-8 py-12 text-center bg-white">
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <h1 className="text-2xl font-medium text-gray-800 mb-12">Welcome to BrotherSpace</h1>
              <img src="https://picsum.photos/seed/social/400/300" alt="Illustration" className="w-full max-w-[280px] h-auto mb-12 rounded-2xl" referrerPolicy="no-referrer" />
              <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed">
                Read our Privacy Policy. Tap Create Account to accept the Terms of Services.
              </p>
            </div>
            <div className="w-full space-y-4">
              <button onClick={() => setScreen('SIGNUP')} className="w-full h-14 bg-[#4A44F2] text-white rounded-xl font-medium shadow-md flex items-center justify-center gap-2">
                Create Account <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <button onClick={() => setScreen('LOGIN')} className="w-full h-14 text-[#4A44F2] font-medium">Sign In</button>
            </div>
          </motion.div>
        ) : screen === 'HOME' ? (
          <motion.div key="home" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-[#F4F6FB]">
            <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm rounded-b-3xl">
              <div className="flex items-center gap-3"><LogoIcon className="w-8 h-8" /><h1 className="text-lg font-bold text-gray-800 tracking-tight">BrotherSpace</h1></div>
              <div className="flex items-center gap-4">
                <button onClick={() => { refreshGroups(); setScreen('GROUPS'); }} className="text-gray-400 hover:text-[#4A44F2] transition-colors" title="Groups">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </button>
                <button onClick={() => { if(user) refreshNotifications(user.id); setScreen('NOTIFICATIONS'); }} className="relative text-gray-400 hover:text-[#4A44F2] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadNotifsCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#4A44F2] rounded-full border border-white"></span>}
                </button>
                {user?.isAdmin && (
                  <button onClick={() => setScreen('ADMIN')} className="text-[#4A44F2] hover:text-[#4A44F2]/80 transition-colors" title="Admin Dashboard">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </button>
                )}
                <button onClick={handleOpenIdentity} className="text-gray-400 hover:text-[#4A44F2] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
                <button onClick={() => setScreen('BOOKMARKS')} className="text-gray-400 hover:text-[#4A44F2] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg></button>
                <button onClick={() => { if(user) refreshChats(user.id); setScreen('MESSAGES'); }} className="text-gray-400 hover:text-[#4A44F2] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
              {user && <WeeklyGoals user={user} />}
              <WeeklyMotion />
              <MotivationalCarousel />
              <DailyPrompt prompt={dailyPrompt} onClick={(p) => { setNewPostContent(p); setCreatingForGroupId(null); setScreen('CREATE'); }} />
              
              <div className="mb-6">
                <button 
                  onClick={() => setScreen('CONFESS')}
                  className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-red-600 text-sm">Confess Anonymously</h3>
                      <p className="text-xs text-gray-500">Disguise your voice and share a secret</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-red-300 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              <SafetyBanner />
              <div className="flex justify-between items-center mb-4 mt-8">
                <h3 className="text-base font-bold text-gray-800">Recent Posts</h3>
                <div className="relative">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value as Category | 'All')}
                    className="appearance-none bg-white text-xs font-medium text-gray-600 border border-gray-200 rounded-full pl-4 pr-8 py-2 focus:outline-none focus:border-[#4A44F2] cursor-pointer shadow-sm"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pb-24">
                {posts.filter(p => selectedCategoryFilter === 'All' || p.category === selectedCategoryFilter).map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} onClick={(id) => { setSelectedPostId(id); setScreen('DETAILS'); }} isBookmarked={isPostBookmarked(post.id)} onBookmark={handleBookmarkToggle} isOwnPost={user?.id === post.user_id} isAdmin={user?.isAdmin} onEdit={(id) => { setEditingPostId(id); setEditPostContent(post.content); setScreen('EDIT'); }} onDelete={confirmDelete} onReport={(id) => handleReport('post', id)} onVote={handleVotePost} currentUserId={user?.id} />
                ))}
              </div>
            </main>
            {!systemStatus.isLocked && <button onClick={() => { setCreatingForGroupId(null); setScreen('CREATE'); }} className="fixed bottom-6 right-6 w-14 h-14 bg-[#4A44F2] text-white rounded-full shadow-lg shadow-[#4A44F2]/30 flex items-center justify-center z-20 text-3xl font-light hover:scale-105 transition-transform">+</button>}
          </motion.div>
        ) : screen === 'LOGIN' ? (
          <motion.div key="login" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen px-8 pt-12">
            <button onClick={() => setScreen('WELCOME')} className="text-brand-secondary mb-10 text-left">â† Back</button>
            <h2 className="text-2xl font-bold mb-8">Welcome Back</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-brand-surface p-4 rounded-brand focus:outline-none" />
              <div className="space-y-2">
                <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-brand-surface p-4 rounded-brand focus:outline-none" />
                <button type="button" onClick={() => { setForgotPasswordEmail(authEmail); setForgotPasswordError(''); setForgotPasswordSuccess(''); setScreen('FORGOT_PASSWORD'); }} className="text-xs text-brand-accent hover:text-white transition-colors text-right w-full">Forgot Password?</button>
              </div>
              {authError && <p className="text-red-400 text-xs">{authError}</p>}
              <button type="submit" className="w-full h-12 bg-brand-accent text-white rounded-brand font-medium">Sign In</button>
            </form>
          </motion.div>
        ) : screen === 'FORGOT_PASSWORD' ? (
          <motion.div key="forgot-password" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen px-8 pt-12">
            <button onClick={() => setScreen('LOGIN')} className="text-brand-secondary mb-10 text-left">â† Back to Login</button>
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            <p className="text-brand-secondary text-sm mb-8">Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <input type="email" placeholder="Email Address" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} className="w-full bg-brand-surface p-4 rounded-brand focus:outline-none" />
              {forgotPasswordError && <p className="text-red-400 text-xs">{forgotPasswordError}</p>}
              {forgotPasswordSuccess && <p className="text-green-400 text-xs">{forgotPasswordSuccess}</p>}
              <button type="submit" className="w-full h-12 bg-brand-accent text-white rounded-brand font-medium">Send Reset Link</button>
            </form>
          </motion.div>
        ) : screen === 'SIGNUP' ? (
          <motion.div key="signup" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen px-8 pt-12 overflow-y-auto">
            <button onClick={() => setScreen('WELCOME')} className="text-brand-secondary mb-10 text-left">â† Back</button>
            <h2 className="text-2xl font-bold mb-8">Join the Space</h2>
            <form onSubmit={handleSignup} className="space-y-6 pb-20">
              <input type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-brand-surface p-4 rounded-brand focus:outline-none" />
              <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-brand-surface p-4 rounded-brand focus:outline-none" />
              <input type="number" placeholder="Age" value={authAge} onChange={(e) => setAuthAge(e.target.value)} className="w-full bg-brand-surface p-4 rounded-brand focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setAuthRole(r)} className={`h-11 rounded-brand text-[12px] font-semibold border ${authRole === r ? 'bg-brand-accent border-brand-accent text-white' : 'bg-brand-surface text-brand-secondary border-transparent'}`}>{r}</button>
                ))}
              </div>
              {authError && <p className="text-red-400 text-xs">{authError}</p>}
              <button type="submit" className="w-full h-12 bg-brand-accent text-white rounded-brand font-medium">Create Account</button>
            </form>
          </motion.div>
        ) : screen === 'DETAILS' ? (
          <motion.div key="details" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="w-full h-full">
            {selectedPostId && <PostDetailsView post={posts.find(p => p.id === selectedPostId)!} onBack={() => { refreshPosts(); setScreen('HOME'); }} user={user!} isSystemLocked={systemStatus.isLocked} onTalkPrivately={handleTalkPrivately} onReportItem={(type, id) => handleReport(type, id)} onDelete={confirmDelete} onEdit={(id) => { setEditingPostId(id); setEditPostContent(posts.find(p => p.id === id)?.content || ''); setScreen('EDIT'); }} onVote={handleVotePost} />}
          </motion.div>
        ) : screen === 'MESSAGES' ? (
          <motion.div key="messages" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-[#F4F6FB] relative">
            <header className="flex items-center justify-between px-6 pt-12 pb-6">
              <button onClick={() => setScreen('HOME')} className="w-10 h-10 bg-[#4A44F2] text-white rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase">BrotherSpace</h2>
              <button onClick={handleOpenIdentity} className="w-10 h-10 bg-gray-200 text-gray-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </header>

            <div className="px-6 mb-6">
              <div className="flex bg-gray-200/50 rounded-xl p-1">
                <button className="flex-1 py-2 text-sm font-semibold bg-white text-gray-800 rounded-lg shadow-sm">Chats</button>
                <button className="flex-1 py-2 text-sm font-medium text-gray-500">Status</button>
                <button className="flex-1 py-2 text-sm font-medium text-gray-500">Calls</button>
              </div>
            </div>

            <main className="flex-1 overflow-y-auto px-6 pb-24">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Friends</h3>
              <div className="space-y-4">
                {chats.map(chat => {
                  const otherName = chat.initiator_id === user?.id ? chat.receiver_name : chat.initiator_name;
                  return (
                    <button key={chat.id} onClick={() => { setSelectedChatId(chat.id); setScreen('CONVERSATION'); }} className="w-full flex items-center gap-4 text-left group">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherName}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-semibold text-gray-800 truncate">{otherName}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(chat.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <span className="text-sm text-gray-500 truncate block">{chat.last_message || 'Start a conversation...'}</span>
                      </div>
                    </button>
                  );
                })}
                {chats.length === 0 && <p className="text-center py-10 text-gray-400 text-sm">No active conversations.</p>}
              </div>
            </main>

            <button className="absolute bottom-8 right-8 w-14 h-14 bg-[#4A44F2] text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </button>
          </motion.div>
        ) : screen === 'CREATE' ? (
          <motion.div key="create" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-white relative">
            <header className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-gray-100">
              <button onClick={() => setScreen(creatingForGroupId ? 'GROUP_FEED' : 'HOME')} className="text-gray-500 font-medium hover:text-gray-800 transition-colors">Cancel</button>
              <h2 className="text-sm font-bold tracking-widest text-gray-800 uppercase">
                {creatingForGroupId ? `Post to ${groups.find(g => g.id === creatingForGroupId)?.name}` : 'New Post'}
              </h2>
              <button onClick={handleCreatePost} disabled={isPosting} className="bg-[#4A44F2] px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:bg-[#3A34D2] transition-colors disabled:opacity-50">
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setNewPostCategory(c)} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                      newPostCategory === c 
                        ? 'bg-[#4A44F2] border-[#4A44F2] text-white shadow-md' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3 mb-6">
                {['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF'].map(color => (
                  <button 
                    key={color} 
                    onClick={() => setNewPostColor(color)} 
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      newPostColor === color ? 'border-[#4A44F2] scale-110 shadow-sm' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <textarea 
                autoFocus
                value={newPostContent} 
                onChange={(e) => setNewPostContent(e.target.value)} 
                placeholder="What's on your mind, brother?" 
                className="w-full h-64 text-lg leading-relaxed focus:outline-none resize-none p-5 rounded-2xl shadow-sm border border-gray-200 transition-colors mb-6"
                style={{ 
                  backgroundColor: newPostColor,
                  color: ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB'].includes(newPostColor) ? '#1F2937' : '#FFFFFF' 
                }}
              />

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <span className="text-sm text-gray-600 font-medium flex-1">Add a voice note (optional):</span>
                <AudioRecorder key={newPostRecorderKey} onAudioReady={setNewPostAudioData} />
              </div>

              {user?.isAdmin && (
                <div className="flex flex-col gap-2 mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Add a video (Admin only):</span>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={newPostVideoUrl.startsWith('data:') ? '' : newPostVideoUrl} 
                      onChange={(e) => setNewPostVideoUrl(e.target.value)} 
                      placeholder="https://example.com/video.mp4" 
                      disabled={newPostVideoUrl.startsWith('data:')}
                      className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:border-[#4A44F2] disabled:opacity-50"
                    />
                    <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Upload</span>
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </label>
                  </div>
                  {newPostVideoUrl.startsWith('data:') && (
                    <div className="mt-1 flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                      <span className="text-xs text-emerald-600 font-medium truncate">Local video attached</span>
                      <button onClick={() => setNewPostVideoUrl('')} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1">Remove</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : screen === 'EDIT' ? (
          <motion.div key="edit" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-white relative">
            <header className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-gray-100">
              <button onClick={() => setScreen('HOME')} className="text-gray-500 font-medium hover:text-gray-800 transition-colors">Cancel</button>
              <h2 className="text-sm font-bold tracking-widest text-gray-800 uppercase">Edit Post</h2>
              <button onClick={handleUpdatePost} className="bg-[#4A44F2] px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md hover:bg-[#3A34D2] transition-colors">
                Update
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setEditPostCategory(c)} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                      editPostCategory === c 
                        ? 'bg-[#4A44F2] border-[#4A44F2] text-white shadow-md' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <textarea 
                autoFocus
                value={editPostContent} 
                onChange={(e) => setEditPostContent(e.target.value)} 
                className="w-full h-64 bg-white text-gray-800 text-lg leading-relaxed focus:outline-none resize-none placeholder-gray-400 p-5 rounded-2xl shadow-sm border border-gray-200 transition-colors"
              />
            </div>
          </motion.div>
        ) : screen === 'GROUPS' ? (
          <motion.div key="groups" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-[#F4F6FB] relative">
            <header className="flex items-center justify-between px-6 pt-12 pb-6">
              <button onClick={() => setScreen('HOME')} className="w-10 h-10 bg-[#4A44F2] text-white rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase">Groups</h2>
              <div className="w-10 h-10"></div>
            </header>
            <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-4">
               {groups.map(group => (
                 <div key={group.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                     <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">{group.member_count} members</span>
                   </div>
                   <p className="text-gray-500 text-sm mb-4">{group.description}</p>
                   {group.min_age && <p className="text-xs text-gray-400 mb-4 font-medium">Min Age: {group.min_age}+</p>}
                   
                   {user?.joined_groups?.includes(group.id) ? (
                     <button onClick={() => { setSelectedGroupId(group.id); setScreen('GROUP_FEED'); }} className="w-full py-3 bg-[#4A44F2]/10 text-[#4A44F2] rounded-xl font-bold text-sm hover:bg-[#4A44F2]/20 transition-colors">View Group</button>
                   ) : (
                     <button onClick={async () => {
                       try {
                         if (user) {
                           const updatedUser = await api.joinGroup(user.id, group.id);
                           // setUser(updatedUser); // Handled by AuthContext if needed, or refresh user data
                           refreshGroups();
                         }
                       } catch (e: any) { alert(e.message); }
                     }} className="w-full py-3 bg-[#4A44F2] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#3A34D2] transition-colors">Join Group</button>
                   )}
                 </div>
               ))}
             </main>
          </motion.div>
        ) : screen === 'GROUP_FEED' ? (
          <motion.div key="group_feed" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-[#F4F6FB] relative">
             {(() => {
               const group = groups.find(g => g.id === selectedGroupId);
               const groupPosts = posts.filter(p => p.group_id === selectedGroupId);
               return (
                 <>
                   <header className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
                     <div className="flex items-center gap-4">
                       <button onClick={() => setScreen('GROUPS')} className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                       </button>
                       <h1 className="text-lg font-bold truncate max-w-[200px] text-gray-800">{group?.name}</h1>
                     </div>
                     <button onClick={async () => {
                        if (confirm('Leave this group?')) {
                          if (user && group) {
                            const updatedUser = await api.leaveGroup(user.id, group.id);
                            // setUser(updatedUser); // Handled by AuthContext if needed
                            refreshGroups();
                            setScreen('GROUPS');
                          }
                        }
                     }} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Leave</button>
                   </header>
                   <main className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar space-y-4">
                     {groupPosts.length === 0 ? <p className="text-center py-20 text-gray-400 font-medium">No posts in this group yet. Be the first!</p> : (
                       groupPosts.map((post, i) => (
                         <PostCard key={post.id} post={post} index={i} onClick={(id) => { setSelectedPostId(id); setScreen('DETAILS'); }} isBookmarked={isPostBookmarked(post.id)} onBookmark={handleBookmarkToggle} isOwnPost={user?.id === post.user_id} isAdmin={user?.isAdmin} onEdit={(id) => { setEditingPostId(id); setEditPostContent(post.content); setScreen('EDIT'); }} onDelete={confirmDelete} onReport={(id) => handleReport('post', id)} onVote={handleVotePost} currentUserId={user?.id} />
                       ))
                     )}
                   </main>
                   {!systemStatus.isLocked && (
                     <button onClick={() => { setCreatingForGroupId(selectedGroupId); setNewPostCategory('Life'); setScreen('CREATE'); }} className="absolute bottom-8 right-8 w-14 h-14 bg-[#4A44F2] text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-20">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                     </button>
                   )}
                 </>
               );
             })()}
          </motion.div>
        ) : screen === 'NOTIFICATIONS' ? (
           <motion.div key="notifications" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-[#F4F6FB] relative">
             <header className="flex items-center justify-between px-6 pt-12 pb-6">
               <button onClick={() => setScreen('HOME')} className="w-10 h-10 bg-[#4A44F2] text-white rounded-xl flex items-center justify-center shadow-md">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase">Notifications</h2>
               <div className="w-10 h-10"></div>
             </header>
             <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-3">
               {notifications.length === 0 ? <p className="text-center py-20 text-gray-400 font-medium">No notifications yet.</p> : (
                 notifications.map(n => (
                   <div key={n.id} className={`p-4 rounded-2xl border-l-4 shadow-sm ${n.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-[#4A44F2]'}`}>
                     <h4 className="font-bold text-sm mb-1 text-gray-800">{n.title}</h4>
                     <p className="text-xs text-gray-500">{n.message}</p>
                   </div>
                 ))
               )}
             </main>
           </motion.div>
        ) : screen === 'BOOKMARKS' ? (
           <motion.div key="bookmarks" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-[#F4F6FB] relative">
             <header className="flex items-center justify-between px-6 pt-12 pb-6">
               <button onClick={() => setScreen('HOME')} className="w-10 h-10 bg-[#4A44F2] text-white rounded-xl flex items-center justify-center shadow-md">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase">Saved Posts</h2>
               <div className="w-10 h-10"></div>
             </header>
             <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-4">
               {bookmarkedPosts.length === 0 ? <p className="text-center py-20 text-gray-400 font-medium">No saved posts.</p> : (
                 bookmarkedPosts.map((post, i) => (
                   <PostCard key={post.id} post={post} index={i} onClick={(id) => { setSelectedPostId(id); setScreen('DETAILS'); }} isBookmarked={true} onBookmark={handleBookmarkToggle} isOwnPost={user?.id === post.user_id} isAdmin={user?.isAdmin} onEdit={(id) => { setEditingPostId(id); setEditPostContent(post.content); setScreen('EDIT'); }} onDelete={confirmDelete} onReport={(id) => handleReport('post', id)} onVote={handleVotePost} currentUserId={user?.id} />
                 ))
               )}
             </main>
           </motion.div>
        ) : screen === 'CONVERSATION' ? (
            <motion.div key="conversation" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="w-full h-full">
              {selectedChatId && chats.find(c => c.id === selectedChatId) && user && (
                <PrivateConversationView 
                  chat={chats.find(c => c.id === selectedChatId)!} 
                  user={user} 
                  onBack={() => setScreen('MESSAGES')} 
                  isSystemLocked={systemStatus.isLocked} 
                  onRefresh={() => refreshChats(user.id)} 
                />
              )}
            </motion.div>
        ) : screen === 'IDENTITY' ? (
          <motion.div key="identity" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col h-screen w-full bg-white relative">
            <header className="flex items-center justify-between px-6 pt-12 pb-6">
              <button onClick={() => setScreen('HOME')} className="w-10 h-10 bg-[#4A44F2] text-white rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase">Account</h2>
              <div className="w-10 h-10"></div>
            </header>
            
            <div className="flex-1 overflow-y-auto px-6 pb-24">
              <div className="flex justify-center mb-8 relative w-max mx-auto">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm" style={{ backgroundColor: selectedColor }}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#4A44F2] rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-gray-800 font-medium" placeholder="Username" />
                </div>
                <p className="text-xs text-gray-400 px-2">This is not your username or pin. This name will be visible to your contacts.</p>

                <div className="grid grid-cols-4 gap-4 mt-6">
                  {IDENTITY_COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => setSelectedColor(color)} 
                      className={`w-full aspect-square rounded-2xl border-4 transition-all ${
                        selectedColor === color 
                          ? 'border-[#4A44F2] scale-110 shadow-lg' 
                          : 'border-white shadow-sm'
                      }`} 
                      style={{ backgroundColor: color }} 
                    />
                  ))}
                </div>

                <div className="mt-8 mb-4">
                  <h3 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4 px-2">Notification Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
                      <span className="text-sm font-medium text-gray-800">New Replies</span>
                      <input type="checkbox" checked={notificationPrefs.newReplies} onChange={(e) => setNotificationPrefs({...notificationPrefs, newReplies: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#4A44F2] focus:ring-[#4A44F2]" />
                    </label>
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
                      <span className="text-sm font-medium text-gray-800">New Messages</span>
                      <input type="checkbox" checked={notificationPrefs.newMessages} onChange={(e) => setNotificationPrefs({...notificationPrefs, newMessages: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#4A44F2] focus:ring-[#4A44F2]" />
                    </label>
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white">
                      <span className="text-sm font-medium text-gray-800">System Updates</span>
                      <input type="checkbox" checked={notificationPrefs.systemUpdates} onChange={(e) => setNotificationPrefs({...notificationPrefs, systemUpdates: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-[#4A44F2] focus:ring-[#4A44F2]" />
                    </label>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button onClick={handleLogout} className="w-full py-4 text-red-500 font-bold uppercase text-xs border border-red-100 rounded-xl bg-red-50">Log Out</button>
                  <button onClick={async () => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      if (confirm('Really delete? All your posts and data will be removed permanently.')) {
                        try {
                          if (user) {
                            await api.deleteAccount(user.id);
                            await signOut();
                            setScreen('WELCOME');
                          }
                        } catch (e: any) {
                          alert('Failed to delete account: ' + e.message);
                        }
                      }
                    }
                  }} className="w-full py-4 text-red-600 font-bold uppercase text-[10px] opacity-50 hover:opacity-100">Delete Account</button>
                </div>
              </div>
              {identitySuccess && <p className="text-green-500 text-center mt-4 text-sm font-medium">{identitySuccess}</p>}
              {identityError && <p className="text-red-500 text-center mt-4 text-sm font-medium">{identityError}</p>}
            </div>

            <button disabled={isUpdatingIdentity} onClick={handleUpdateIdentity} className="absolute bottom-8 right-8 w-14 h-14 bg-[#FCD34D] text-gray-900 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </motion.div>
        ) : screen === 'CONFESS' && user ? (
          <ConfessScreen 
            user={user} 
            onBack={() => setScreen('HOME')} 
            onSuccess={() => { refreshPosts(); setScreen('HOME'); }} 
          />
        ) : screen === 'ADMIN' && user ? (
          <AdminDashboard 
            user={user} 
            onBack={() => setScreen('HOME')} 
            systemStatus={systemStatus}
            setSystemStatus={setSystemStatus}
          />
        ) : null}
      </AnimatePresence>
      <ConfirmationDialog
        isOpen={!!postToDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleDeletePost}
        onCancel={() => setPostToDelete(null)}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

const PostDetailsView: React.FC<{ post: Post, onBack: () => void, user: User, isSystemLocked: boolean, onTalkPrivately: (r: Reply) => void, onReportItem: (type: 'post' | 'reply', id: string) => void, onDelete?: (id: string) => void, onEdit?: (id: string) => void, onVote?: (id: string, type: 'up' | 'down') => void }> = ({ post, onBack, user, isSystemLocked, onTalkPrivately, onReportItem, onDelete, onEdit, onVote }) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReplies = async () => {
    if (post) {
      try {
        const data = await api.getReplies(post.id);
        setReplies(data);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => { 
    fetchReplies();
  }, [post?.id]);

  const handleSendReply = async () => {
    if (!newReply.trim() && !audioData) return;
    try {
      await api.createReply(post.id, user.id, user.username, user.role, newReply, audioData || undefined);
      setNewReply('');
      setAudioData(null);
      setRecorderKey(prev => prev + 1);
      fetchReplies();
    } catch (err: any) { alert(err.message); }
  };

  if (!post) return <div className="p-20 text-center text-brand-hint">Post not found</div>;

  const isOwnPost = user.id === post.user_id;

  return (
    <div className="flex flex-col h-screen w-full bg-[#F4F6FB] relative">
      <header className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">Support</h1>
        </div>
        {(isOwnPost || user.isAdmin) && (
          <div className="flex items-center gap-3">
            {isOwnPost && <button onClick={() => onEdit?.(post.id)} className="text-sm font-semibold text-gray-500 hover:text-[#4A44F2] transition-colors">Edit</button>}
            <button onClick={() => onDelete?.(post.id)} className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors">Delete</button>
          </div>
        )}
      </header>
      <main className="flex-1 px-4 py-6 overflow-y-auto pb-24 no-scrollbar space-y-4">
        <div className="p-5 bg-white rounded-2xl border-l-4 shadow-sm border-y border-r border-gray-100" style={{ borderLeftColor: post.color || '#4A44F2' }}>
          <div className="flex justify-between items-start mb-3">
             <p className="text-gray-500 text-xs font-medium">{post.anon_name} â€¢ {post.category}</p>
             <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{post.role}</div>
          </div>
          <p className="text-[16px] leading-relaxed font-medium text-gray-800 mb-4">{post.content}</p>
          {post.audio_data && (
            <div className="mb-4">
              <AudioPlayer audioData={post.audio_data} />
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-200 w-fit mt-4">
            <button 
              onClick={() => onVote?.(post.id, user && post.upvotes?.includes(user.id) ? 'none' : 'up')}
              className={`p-1 rounded-full transition-colors ${user && post.upvotes?.includes(user.id) ? 'text-green-500' : 'text-gray-400 hover:bg-gray-200'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
            </button>
            <span className="text-xs font-bold text-gray-700">
              {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
            </span>
            <button 
              onClick={() => onVote?.(post.id, user && post.downvotes?.includes(user.id) ? 'none' : 'down')}
              className={`p-1 rounded-full transition-colors ${user && post.downvotes?.includes(user.id) ? 'text-red-500' : 'text-gray-400 hover:bg-gray-200'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>
        <div className="space-y-4 mt-8">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-4">Replies ({replies.length})</h4>
          {loading ? <div className="text-center py-10 animate-pulse text-gray-400 text-sm font-medium">Loading replies...</div> : (
            replies.map((reply, i) => <ReplyItem key={reply.id} reply={reply} index={i} onHelpful={(id) => api.markHelpful(id)} onTalkPrivately={onTalkPrivately} onReport={(id) => onReportItem('reply', id)} currentUserId={user.id} />)
          )}
        </div>
      </main>
      {!isSystemLocked && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex items-center gap-3 z-20">
          <AudioRecorder key={recorderKey} onAudioReady={setAudioData} />
          <input value={newReply} onChange={(e) => setNewReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} className="flex-1 bg-gray-50 px-4 py-3 rounded-xl focus:outline-none text-[14px] text-gray-800 border border-gray-200 placeholder-gray-400 focus:border-[#4A44F2] focus:ring-1 focus:ring-[#4A44F2] transition-all" placeholder="Add support..." />
          <button onClick={handleSendReply} className="px-5 py-3 bg-[#4A44F2] rounded-xl text-white font-bold text-[14px] shadow-md shadow-[#4A44F2]/20 hover:bg-[#3b36c7] transition-all active:scale-95">Send</button>
        </div>
      )}
    </div>
  );
};

const PrivateConversationView: React.FC<{ chat: PrivateChat, user: User, onBack: () => void, isSystemLocked: boolean, onRefresh: () => void }> = ({ chat: initialChat, user, onBack, isSystemLocked, onRefresh }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState<PrivateChat>(initialChat);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => { try { const msgs = await api.getChatMessages(chat.id); setMessages(msgs || []); } catch (e) {} };
  useEffect(() => { loadMessages(); }, [chat.id]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async () => {
    if (isSystemLocked || !newMessage.trim() || chat.status !== 'ACTIVE') return;
    try { 
      await api.sendMessage(chat.id, user.id, newMessage); 
      setNewMessage(''); 
      loadMessages();
    } catch (err: any) { alert(err.message); }
  };

  const otherName = chat.initiator_id === user.id ? chat.receiver_name : chat.initiator_name;

  return (
    <div className="flex flex-col h-screen bg-[#F4F6FB] relative">
      <header className="flex items-center justify-between px-6 pt-12 pb-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-bold text-gray-800 text-lg">{otherName}</span>
        <div className="w-10 h-10"></div>
      </header>
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar">
        {chat.status === 'PENDING' ? (
          <div className="text-center py-20 px-8">
            {chat.receiver_id === user.id ? (
              <button onClick={async () => { await api.acceptChat(chat.id); setChat({...chat, status: 'ACTIVE'}); onRefresh(); }} className="w-full py-4 bg-[#4A44F2] text-white rounded-xl font-bold shadow-md hover:bg-[#3A34D2] transition-colors">
                Accept Connection
              </button>
            ) : (
              <p className="text-gray-500 italic text-sm font-medium">Waiting for this brother to accept...</p>
            )}
          </div>
        ) : messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] text-[15px] leading-relaxed shadow-sm ${m.sender_id === user.id ? 'bg-[#4A44F2] text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </main>
      {chat.status === 'ACTIVE' && (
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3 pb-8">
          <input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
            className="flex-1 bg-gray-50 text-gray-800 px-5 py-3 rounded-2xl focus:outline-none border border-gray-200 focus:border-[#4A44F2] transition-colors" 
            placeholder="Type a message..." 
          />
          <button 
            onClick={handleSendMessage} 
            className="w-12 h-12 bg-[#4A44F2] text-white rounded-2xl flex items-center justify-center shadow-md hover:bg-[#3A34D2] transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
