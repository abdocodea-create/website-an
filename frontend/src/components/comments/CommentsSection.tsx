import React, { useState, useEffect, useRef } from 'react';
import { AlignLeft, Smile, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';

import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CommentItem } from './CommentItem';
import { CustomEmojiPicker } from './CustomEmojiPicker';
import { RichTextInput } from './RichTextInput';
import { CommentsSkeleton } from './CommentsSkeleton';

interface CommentsSectionProps {
    episodeId: number;
    stickyInput?: boolean; // New prop for mobile modal
    onCommentInputRender?: (inputElement: React.ReactNode) => void; // Callback to pass input to parent
}

interface Comment {
    id: number;
    content: string;
    user_id: number;
    user: {
        id: number;
        name: string;
        avatar?: string;
    };
    created_at: string;
    likes: number;
    dislikes: number;
    user_interaction?: boolean | null;
    children?: Comment[]; // For nested replies
    episode_id?: number;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ episodeId, stickyInput = false, onCommentInputRender }) => {
    const { user } = useAuthStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isMainInputFocused, setIsMainInputFocused] = useState(false);
    const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);
    const [showCustomEmojiPicker, setShowCustomEmojiPicker] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const customEmojiRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/episodes/${episodeId}/comments`);
            // Backend returns flat list or nested? 
            // Our Repo GetByEpisodeID returns all comments with ParentID=null (top level) 
            // and Preloads Children. So it should be nested structure already.
            setComments(res.data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (episodeId) fetchComments();
    }, [episodeId]);

    // Click outside emoji picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowMainEmojiPicker(false);
            }
            if (customEmojiRef.current && !customEmojiRef.current.contains(event.target as Node)) {
                setShowCustomEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getAvatarUrl = (avatar?: string) => {
        if (!avatar) return '';
        if (avatar.startsWith('http')) return avatar;
        return avatar.startsWith('/') ? avatar : `/${avatar}`;
    };

    const addComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await api.post(`/episodes/${episodeId}/comments`, { content: newComment });
            // Prepend new comment
            // Create dummy user object for immediate display if backend returning bare
            const createdComment = {
                ...res.data,
                user: user, // Optimistic user data
                children: []
            };
            setComments([createdComment, ...comments]);
            setNewComment('');
            setIsMainInputFocused(false);
        } catch (error) {
            console.error("Failed to post comment", error);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewComment(prev => prev + emojiData.emoji);
        setShowMainEmojiPicker(false);
    };

    const onCustomEmojiClick = (emojiUrl: string) => {
        // Insert emoji image directly into the rich text input
        if (inputRef.current && (inputRef.current as any).insertEmoji) {
            (inputRef.current as any).insertEmoji(emojiUrl);
        }
    };

    // Callback to refresh or update list on deep changes
    // For simplicity, we can refetch or traverse update. Refetch is easiest for consistency.
    const handleRefresh = () => fetchComments();

    const onUpdateSuccess = (updatedComment: Comment) => {
        setComments(prev => prev.map(c => c.id === updatedComment.id ? { ...c, content: updatedComment.content } : c));
    };

    const onDeleteSuccess = (commentId: number) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    // Optimistic updates for deep items could be handled by Context or complex reducer, 
    // but for now Refetch on Reply/Delete is safer.
    // Using onUpdateSuccess to update generic item in list would be recursive search.
    // Let's rely on Refetch for Reply/Delete for data consistency.

    return (
        <div className={`flex flex-col bg-transparent shadow-sm ${stickyInput ? 'p-4' : 'mt-0 px-4 pb-4 pt-2'}`} dir="rtl">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{comments ? comments.length : 0} تعليق</h3>
                {/* Sort Button - Implementation can wait or just be visual */}
                <button className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#272727] px-4 py-2 rounded-full transition">
                    <AlignLeft className="w-5 h-5" />
                    <span>الترتيب حسب</span>
                </button>
            </div>

            {/* Add Comment Input */}
            {!stickyInput && (
                <div className="flex gap-4 mb-8">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden bg-purple-600 rounded-full select-none shadow-md">
                        {user?.avatar ? (
                            <img src={getAvatarUrl(user.avatar)} alt={user.name} className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-lg font-bold text-white">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="relative group">
                            <RichTextInput
                                ref={inputRef}
                                value={newComment}
                                onChange={setNewComment}
                                onFocus={() => setIsMainInputFocused(true)}
                                placeholder="إضافة تعليق..."
                                className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-[#f47521] py-3 px-0 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 resize-none outline-none transition-colors duration-200"
                            />
                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                <div className="relative" ref={emojiRef}>
                                    <button onClick={() => setShowMainEmojiPicker(!showMainEmojiPicker)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-500 dark:text-[#aaa] hover:text-[#0f0f0f] dark:hover:text-white">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    {showMainEmojiPicker && (
                                        <div className="absolute top-full mt-2 left-0 z-50">
                                            <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} />
                                        </div>
                                    )}
                                </div>
                                <div className="relative" ref={customEmojiRef}>
                                    <button onClick={() => setShowCustomEmojiPicker(!showCustomEmojiPicker)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-500 dark:text-[#aaa] hover:text-[#0f0f0f] dark:hover:text-white" title="رموز مخصصة">
                                        <Sparkles className="w-5 h-5" />
                                    </button>
                                    {showCustomEmojiPicker && (
                                        <CustomEmojiPicker onEmojiClick={onCustomEmojiClick} onClose={() => setShowCustomEmojiPicker(false)} />
                                    )}
                                </div>
                            </div>
                        </div>
                        {(isMainInputFocused || newComment) && (
                            <div className="flex items-center justify-end gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                                <button onClick={() => { setIsMainInputFocused(false); setNewComment(''); }} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-[#f1f1f1] hover:bg-gray-200 dark:hover:bg-[#272727] rounded-full transition">إلغاء</button>
                                <button onClick={addComment} disabled={!newComment} className={`px-5 py-2 text-sm font-bold rounded-full transition shadow-sm ${newComment ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-200 dark:bg-[#272727] text-gray-500 cursor-not-allowed'}`}>تعليق</button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Comments List */}
            {isLoading ? (
                <CommentsSkeleton />
            ) : comments && comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            depth={0}
                            onReplySuccess={handleRefresh}
                            onUpdateSuccess={onUpdateSuccess}
                            onDeleteSuccess={onDeleteSuccess}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
                </div>
            )}
        </div>
    );
};
