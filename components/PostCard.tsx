import React, { useState, useMemo } from 'react';
import { Post } from '../types.ts';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from './AudioPlayer.tsx';

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
  index?: number;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
  isOwnPost?: boolean;
  isAdmin?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReport?: (id: string) => void;
  onVote?: (id: string, type: 'up' | 'down') => void;
  currentUserId?: string;
  backgroundImage?: string;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onClick, 
  index = 0, 
  isBookmarked = false, 
  onBookmark,
  isOwnPost = false,
  isAdmin = false,
  onEdit,
  onDelete,
  onReport,
  onVote,
  currentUserId,
  backgroundImage
}) => {
  const isNew = useMemo(() => {
    const postDate = new Date(post.created_at).getTime();
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return now - postDate < twentyFourHours;
  }, [post.created_at]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(post.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(post.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(post.id);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReport?.(post.id);
  };

  // Dark theme with soft contrast
  const cardStyle = {
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(post.id)}
      style={cardStyle}
      className={`p-4 rounded-2xl mb-3 cursor-pointer relative group transition-all duration-300 ease-in-out border border-gray-800 bg-gray-900 shadow-sm overflow-hidden`}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />
      )}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
              {post.category}
            </span>
            {post.type && (
              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-900 uppercase">
                {post.type}
              </span>
            )}
            {isNew && (
              <span className="text-[9px] font-bold text-indigo-400">NEW</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(isOwnPost || isAdmin) && (
              <div className="flex items-center gap-1">
                {isOwnPost && <button onClick={handleEdit} className="text-gray-400 hover:text-indigo-400 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>}
                <button onClick={handleDeleteClick} className="text-gray-400 hover:text-red-400 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            )}
            <span className="text-[10px] text-gray-400">
               {formatDate(post.created_at)}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <p 
          className="text-sm font-medium text-gray-200 leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {post.content}
        </p>

        {post.audio_data && (
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <AudioPlayer audioData={post.audio_data} />
          </div>
        )}

        {post.video_url && (
          <div className="mt-3 rounded-2xl overflow-hidden bg-black border border-gray-700 shadow-inner" onClick={(e) => e.stopPropagation()}>
            <video src={post.video_url} controls className="w-full max-h-96 object-contain" />
          </div>
        )}

        {post.image_url && (
          <div className="mt-3 rounded-2xl overflow-hidden bg-gray-800 border border-gray-700 shadow-inner" onClick={(e) => e.stopPropagation()}>
            <img src={post.image_url} alt="Post content" className="w-full max-h-96 object-contain" referrerPolicy="no-referrer" />
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#9CA3AF]">
              {post.anon_name}
            </span>
            <span className="text-[10px] text-[#6B7280]">â€¢</span>
            <span className="text-[10px] text-[#6B7280]">
              {getRelativeTime(post.created_at)}
            </span>
          </div>
          
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => onVote?.(post.id, currentUserId && post.upvotes?.includes(currentUserId) ? 'none' : 'up')}
                className={`transition-colors ${currentUserId && post.upvotes?.includes(currentUserId) ? 'text-emerald-500' : 'text-[#9CA3AF] hover:text-gray-200'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
              </button>
              <span className="text-[11px] font-medium text-[#9CA3AF]">
                {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[#9CA3AF]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[11px] font-medium">{post.reply_count || 0}</span>
            </div>

            <button 
              onClick={handleReport}
              className="text-[#9CA3AF] hover:text-red-400 transition-colors"
              title="Report Post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm0 0h2" /></svg>
            </button>

            <button 
              onClick={handleBookmark}
              className={`transition-colors ${isBookmarked ? 'text-indigo-400' : 'text-[#9CA3AF] hover:text-gray-200'}`}
            >
              <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
