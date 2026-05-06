import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Post, Group, SystemStatus, Report } from '../../types.ts';
import { api } from '../../services/api.ts';
import { Shield, Users, MessageSquare, Trash2, AlertTriangle, Activity, Lock, Unlock, ChevronLeft, Ban, X, Flag, Search } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onBack: () => void;
  systemStatus: SystemStatus;
  setSystemStatus: (status: SystemStatus) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onBack, systemStatus, setSystemStatus }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'question' | 'topic'>('topic');
  const [newPostVideoUrl, setNewPostVideoUrl] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedReports, setExpandedReports] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedPosts, fetchedGroups, fetchedReports] = await Promise.all([
        api.getAllUsers(),
        api.getPosts(),
        api.getGroups(),
        api.getReports()
      ]);
      setUsers(fetchedUsers);
      setPosts(fetchedPosts);
      setGroups(fetchedGroups);
      setReports(fetchedReports);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await api.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error) {
        alert("Failed to delete user.");
      }
    }
  };

  const handleBanUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to ban this user? They will not be able to log in.")) {
      try {
        await api.banUser(userId);
        setUsers(users.map(u => u.id === userId ? { ...u, isBanned: true } : u));
      } catch (error) {
        alert("Failed to ban user.");
      }
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to unban this user?")) {
      try {
        await api.unbanUser(userId);
        setUsers(users.map(u => u.id === userId ? { ...u, isBanned: false } : u));
      } catch (error) {
        alert("Failed to unban user.");
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await api.deletePostAsAdmin(postId);
        setPosts(posts.filter(p => p.id !== postId));
        setReports(reports.filter(r => r.item_id !== postId));
      } catch (error) {
        alert("Failed to delete post.");
      }
    }
  };

  const handleDismissReports = async (postId: string) => {
    if (window.confirm("Are you sure you want to dismiss all reports for this post?")) {
      try {
        const postReports = reports.filter(r => r.item_id === postId && r.type === 'post');
        await Promise.all(postReports.map(r => api.deleteReport(r.id)));
        setReports(reports.filter(r => !(r.item_id === postId && r.type === 'post')));
        setExpandedReports(null);
      } catch (error) {
        alert("Failed to dismiss reports.");
      }
    }
  };

  const handleCreateAdminPost = async () => {
    if (!newPostContent.trim() && !newPostVideoUrl.trim() && !newPostImageUrl.trim()) {
      alert("Please enter content, a video URL, or an image URL.");
      return;
    }
    
    setIsPosting(true);
    try {
      const newPost = await api.createPost(
        user.id,
        user.username,
        user.role,
        'Life', // Default category for admin posts
        newPostContent,
        undefined,
        '#1A1A1F',
        undefined,
        newPostVideoUrl.trim() || undefined,
        newPostImageUrl.trim() || undefined,
        newPostType
      );
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostType('topic');
      setNewPostVideoUrl('');
      setNewPostImageUrl('');
      setIsCreatingPost(false);
    } catch (error: any) {
      alert("Failed to create post: " + error.message);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Please choose an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-brand-bg">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-brand-primary mb-2">Access Denied</h2>
        <p className="text-brand-secondary mb-6">You do not have permission to view this page.</p>
        <button onClick={onBack} className="px-6 py-2 bg-brand-accent text-white rounded-xl font-medium shadow-sm">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col md:flex-row h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans"
    >
      {/* Sidebar Navigation (Desktop) */}
      <div className="hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col p-6 shadow-sm z-20">
        <div className="flex items-center gap-3 mb-10">
          <button onClick={onBack} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'posts', label: 'Moderation', icon: Shield },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-zinc-800">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-1">System</div>
          <button 
            onClick={async () => {
              try {
                await api.setSystemStatus(!systemStatus.isLocked);
                setSystemStatus({ isLocked: !systemStatus.isLocked });
              } catch (error) {
                alert("Failed to update system status.");
              }
            }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all ${
              systemStatus.isLocked 
                ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50' 
                : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
            }`}
          >
            {systemStatus.isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            {systemStatus.isLocked ? 'Unlock System' : 'Lock System'}
          </button>
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden bg-zinc-900 border-t border-zinc-800 flex justify-around p-4 z-20">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'posts', label: 'Moderation', icon: Shield },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === item.id 
                ? 'text-blue-400' 
                : 'text-zinc-500'
            }`}
          >
            <item.icon className="w-6 h-6" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10">
        {/* Header with Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            {activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'users' ? 'User Directory' : 'Content Moderation'}
          </h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600 w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-zinc-100"></div>
          </div>
        ) : (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                  {[
                    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-950/50' },
                    { label: 'Total Posts', value: posts.length, icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-950/50' },
                    { label: 'Active Groups', value: groups.length, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-950/50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900 p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-sm flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400 font-semibold">{stat.label}</p>
                        <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">User Directory</h2>
                  <span className="px-4 py-1.5 bg-zinc-800 text-zinc-300 text-sm font-bold rounded-full">
                    {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).length} Total
                  </span>
                </div>
                
                <div className="space-y-3">
                  {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                    <div key={u.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-sm flex items-center gap-4 hover:border-zinc-700 transition-colors">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-lg border border-zinc-700">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <button onClick={() => setSelectedUser(u)} className="text-sm font-bold text-white hover:text-blue-400 transition-colors text-left block truncate w-full">
                          {u.username}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          {u.isAdmin && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-700 text-white rounded uppercase tracking-wider">Admin</span>}
                          {u.isBanned && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-950 text-red-300 rounded uppercase tracking-wider">Banned</span>}
                          <span className="text-xs text-zinc-400 font-medium truncate">Joined {new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Action Icons */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <button 
                          onClick={() => u.isBanned ? handleUnbanUser(u.id) : handleBanUser(u.id)}
                          disabled={u.isAdmin}
                          className={`p-2 rounded-xl transition-colors ${u.isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700 text-zinc-400'}`}
                          title={u.isAdmin ? "Cannot modify admin" : u.isBanned ? "Unban User" : "Ban User"}
                        >
                          {u.isBanned ? <Unlock className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={u.isAdmin}
                          className={`p-2 rounded-xl transition-colors ${u.isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-950 text-red-400'}`}
                          title={u.isAdmin ? "Cannot delete admin" : "Delete User"}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">Content Moderation</h2>
                  <button 
                    onClick={() => setIsCreatingPost(!isCreatingPost)}
                    className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    {isCreatingPost ? 'Cancel' : 'Post'}
                  </button>
                </div>

                {isCreatingPost && (
                  <div className="bg-zinc-900 p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-white">Create Admin Post</h3>
                    <textarea 
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What do you want to share with the community?"
                      className="w-full h-32 p-5 rounded-2xl border border-zinc-700 bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                    />
                    <select
                      value={newPostType}
                      onChange={(e) => setNewPostType(e.target.value as 'question' | 'topic')}
                      className="w-full p-3 rounded-2xl border border-zinc-700 bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="topic">Topic</option>
                      <option value="question">Question</option>
                    </select>
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={handleCreateAdminPost}
                        disabled={isPosting}
                        className="px-6 py-3 md:px-8 md:py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-sm disabled:opacity-50"
                      >
                        {isPosting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 md:space-y-6">
                  {posts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.username.toLowerCase().includes(searchQuery.toLowerCase())).map(post => {
                    const postReports = reports.filter(r => r.item_id === post.id && r.type === 'post');
                    const isReported = postReports.length > 0;
                    const isExpanded = expandedReports === post.id;

                    return (
                    <div key={post.id} className={`bg-zinc-900 p-6 md:p-8 rounded-3xl border shadow-sm transition-all ${isReported ? 'border-orange-900' : 'border-zinc-800'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-xs font-bold px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-full uppercase tracking-wider">
                            {post.category}
                          </div>
                          <span className="text-sm font-semibold text-white">by {post.username}</span>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4">
                          {isReported && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-950 text-orange-300 rounded-full text-xs font-bold uppercase tracking-wider border border-orange-900">
                              <Flag className="w-4 h-4" />
                              Reported ({postReports.length})
                            </span>
                          )}
                          <span className="text-sm text-zinc-500 font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <p className="text-base text-zinc-300 mb-6 leading-relaxed">{post.content}</p>
                      
                      <div className="flex items-center justify-end pt-6 border-t border-zinc-800 gap-4">
                        {isReported && (
                          <button 
                            onClick={() => setExpandedReports(isExpanded ? null : post.id)}
                            className="flex items-center gap-2.5 px-4 py-2 md:px-5 md:py-3 text-sm font-bold text-orange-300 bg-orange-950/50 hover:bg-orange-950 rounded-2xl transition-colors"
                          >
                            <AlertTriangle className="w-5 h-5" />
                            {isExpanded ? 'Hide' : 'Review'}
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="flex items-center gap-2.5 px-4 py-2 md:px-5 md:py-3 text-sm font-bold text-red-400 bg-red-950/50 hover:bg-red-950 rounded-2xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          Remove
                        </button>
                      </div>

                      {isExpanded && isReported && (
                        <div className="mt-6 p-6 bg-orange-950/30 border border-orange-900 rounded-2xl">
                          <h4 className="text-sm font-bold text-orange-300 mb-4">Reports</h4>
                          <div className="space-y-3 mb-5">
                            {postReports.map(report => (
                              <div key={report.id} className="p-4 bg-zinc-950 rounded-xl border border-orange-900 text-sm text-zinc-300">
                                <span className="font-bold text-white block mb-1.5 text-xs">
                                  {new Date(report.created_at).toLocaleDateString()}
                                </span>
                                {report.reason}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end">
                            <button 
                              onClick={() => handleDismissReports(post.id)}
                              className="px-5 py-3 text-sm font-bold bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 rounded-xl transition-colors"
                            >
                              Dismiss All
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </motion.div>
  );
};

export default AdminDashboard;
