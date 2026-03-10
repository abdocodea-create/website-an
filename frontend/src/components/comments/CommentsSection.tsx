import React, { useState, useEffect, useRef } from 'react';
import { AlignLeft, Smile, Sparkles, ChevronDown, Loader2, SendHorizontal } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { getImageUrl } from '@/utils/image-utils';

import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CommentItem } from './CommentItem';
import { CustomEmojiPicker } from './CustomEmojiPicker';
import { RichTextInput } from './RichTextInput';
import { QuickEmojiRow } from './QuickEmojiRow';
import { CommentsSkeleton } from './CommentsSkeleton';
import { useSocketStore } from '@/stores/socket-store';

interface CommentsSectionProps {
    itemId: number;
    type: 'episode' | 'post';
    stickyInput?: boolean;
    onCommentInputRender?: (inputElement: React.ReactNode) => void;
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

export const CommentsSection: React.FC<CommentsSectionProps> = ({ itemId, type, stickyInput = false, onCommentInputRender }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isMainInputFocused, setIsMainInputFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMainEmojiPicker, setShowMainEmojiPicker] = useState(false);
    const [showCustomEmojiPicker, setShowCustomEmojiPicker] = useState(false);
    const [pickerPosition, setPickerPosition] = useState<'top' | 'bottom'>('top');
    const emojiRef = useRef<HTMLDivElement>(null);
    const customEmojiRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    const fetchComments = async () => {
        try {
            const url = type === 'episode' ? `/episodes/${itemId}/comments` : `/posts/${itemId}/comments`;
            const res = await api.get(url);
            const data = type === 'episode' ? res.data : res.data.data;
            setComments(data || []);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const isConnected = useSocketStore(state => state.isConnected);
    const subscribe = useSocketStore(state => state.subscribe);
    const unsubscribe = useSocketStore(state => state.unsubscribe);

    useEffect(() => {
        if (itemId) {
            fetchComments();

            // Subscribe to real-time comments
            const topic = `${type}:${itemId}`;
            if (isConnected) {
                subscribe(topic);
            }

            // Event Listeners
            const handleNewComment = (event: any) => {
                const comment = event.detail;
                const matches = type === 'episode'
                    ? comment.episode_id === itemId
                    : comment.post_id === itemId;

                if (matches) {
                    setComments(prev => {
                        const currentComments = prev || [];
                        // Prevent duplicate insertions
                        if (currentComments.some(c => c.id === comment.id)) return prev;
                        // Also check inside children of top-level comments
                        if (currentComments.some(c => c.children?.some((ch: any) => ch.id === comment.id))) return prev;

                        if (comment.parent_id) {
                            // YouTube-style flat reply:
                            // Find the ROOT top-level comment that owns this reply chain.
                            // A reply's parent_id may point to another reply (depth=1),
                            // so we walk up once: if parent_id matches a top-level comment → insert there.
                            // If parent_id matches a child (i.e., it's a reply-to-reply) → insert under that child's parent.

                            const findRootParentId = (list: Comment[], targetId: number): number | null => {
                                // Is targetId a top-level comment?
                                if (list.some(c => c.id === targetId)) return targetId;
                                // Is targetId a child of a top-level comment?
                                for (const c of list) {
                                    if (c.children?.some((ch: any) => ch.id === targetId)) {
                                        return c.id; // return the top-level parent
                                    }
                                }
                                return null;
                            };

                            const rootId = findRootParentId(currentComments, comment.parent_id);

                            if (rootId !== null) {
                                return currentComments.map(c => {
                                    if (c.id === rootId) {
                                        if (c.children?.some((ch: any) => ch.id === comment.id)) return c;
                                        // Push to END (bottom) for chronological order
                                        return { ...c, children: [...(c.children || []), comment] };
                                    }
                                    return c;
                                });
                            }

                            // Fallback: parent not found yet (race condition), prepend to top-level
                            return [comment, ...prev];
                        }

                        // Top-level comment: prepend
                        return [comment, ...prev];
                    });
                }
            };

            const handleCommentLike = (event: any) => {
                const data = event.detail;
                // Flat structure: max 1 level deep (YouTube-style)
                const updateLikes = (list: Comment[]): Comment[] => {
                    return list.map(c => {
                        if (c.id === data.comment_id) {
                            const diff = data.is_like ? 1 : -1;
                            return { ...c, likes: (c.likes || 0) + diff };
                        }
                        // Check direct children only (depth=1 max)
                        if (c.children && c.children.length > 0) {
                            const updatedChildren = c.children.map((ch: Comment) => {
                                if (ch.id === data.comment_id) {
                                    const diff = data.is_like ? 1 : -1;
                                    return { ...ch, likes: (ch.likes || 0) + diff };
                                }
                                return ch;
                            });
                            return { ...c, children: updatedChildren };
                        }
                        return c;
                    });
                };
                setComments(prev => updateLikes(prev));
            };

            window.addEventListener('app:comment', handleNewComment);
            window.addEventListener('app:comment_like', handleCommentLike);

            return () => {
                unsubscribe(topic);
                window.removeEventListener('app:comment', handleNewComment);
                window.removeEventListener('app:comment_like', handleCommentLike);
            };
        }
    }, [itemId, isConnected]);

    // Handle visibleCount for Deep Linking
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const targetCommentId = params.get('commentId');
        if (!targetCommentId || !comments.length) return;

        const targetIdNum = parseInt(targetCommentId);

        // Recursive helper to check if a comment tree contains the ID
        const containsComment = (c: Comment, id: number): boolean => {
            if (c.id === id) return true;
            if (!c.children) return false;
            return c.children.some(child => containsComment(child, id));
        };

        // Find the index of the top-level comment that contains our target
        const index = comments.findIndex(c => containsComment(c, targetIdNum));

        if (index !== -1 && index >= visibleCount) {
            setVisibleCount(index + 1);
        }
    }, [comments, visibleCount]);

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
        return getImageUrl(avatar);
    };

    const addComment = async () => {
        if (!user) {
            const currentLang = i18n.language || 'ar';
            navigate(`/${currentLang}/auth/login`);
            return;
        }
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const url = type === 'episode' ? `/episodes/${itemId}/comments` : `/posts/${itemId}/comments`;
            const res = await api.post(url, { content: newComment });
            setComments(prev => {
                const currentComments = prev || [];
                if (currentComments.some(c => c.id === res.data.id)) return prev;
                return [res.data, ...prev];
            });
            setNewComment('');
            setIsMainInputFocused(false);
            setShowMainEmojiPicker(false);
            setShowCustomEmojiPicker(false);
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (inputRef.current && (inputRef.current as any).insertText) {
            (inputRef.current as any).insertText(emojiData.emoji);
        } else {
            setNewComment(prev => prev + emojiData.emoji);
        }
        setShowMainEmojiPicker(false);
    };

    const onCustomEmojiClick = (emojiUrl: string) => {
        if (inputRef.current && (inputRef.current as any).insertEmoji) {
            (inputRef.current as any).insertEmoji(emojiUrl);
        }
    };

    const handleRefresh = () => fetchComments();

    // YouTube-style: max depth is 1, so we only need 2 levels to search
    const onUpdateSuccess = (updatedComment: Comment) => {
        setComments(prev => prev.map(c => {
            if (c.id === updatedComment.id) {
                return { ...c, content: updatedComment.content };
            }
            // Check direct children (depth=1)
            if (c.children && c.children.length > 0) {
                return {
                    ...c,
                    children: c.children.map((ch: Comment) =>
                        ch.id === updatedComment.id ? { ...ch, content: updatedComment.content } : ch
                    )
                };
            }
            return c;
        }));
    };

    const onDeleteSuccess = (commentId: number) => {
        setComments(prev =>
            prev
                .filter(c => c.id !== commentId)
                .map(c => {
                    if (c.children && c.children.length > 0) {
                        return {
                            ...c,
                            children: c.children.filter((ch: Comment) => ch.id !== commentId)
                        };
                    }
                    return c;
                })
        );
    };

    return (
        <div className={`flex flex-col bg-transparent shadow-sm ${stickyInput ? 'p-4' : 'mt-0 px-4 pb-4 pt-2'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{comments ? comments.length : 0} {isAr ? 'تعليق' : 'comments'}</h3>
                <button className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#272727] px-4 py-2 rounded-full transition">
                    <AlignLeft className="w-5 h-5" />
                    <span>{isAr ? 'الترتيب حسب' : 'Sort by'}</span>
                </button>
            </div>

            {!stickyInput && (
                <div className="flex flex-col mb-1 animate-in fade-in duration-300">
                    <div className="flex gap-3 mb-1">
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
                            <RichTextInput
                                ref={inputRef}
                                value={newComment}
                                onChange={setNewComment}
                                onFocus={() => setIsMainInputFocused(true)}
                                placeholder={isAr ? 'إضافة تعليق...' : 'Add a comment...'}
                                className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white py-2 px-0 text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 resize-none outline-none transition-colors duration-200 font-medium"
                            />
                        </div>
                    </div>



                    <div className={`flex items-center gap-3 mt-1 animate-in fade-in slide-in-from-top-2 w-full relative`}>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={addComment}
                                disabled={!newComment || isSubmitting}
                                className={`flex h-9 px-4 items-center justify-center rounded-none transition-all shrink-0 font-bold text-sm
                                    ${newComment
                                        ? 'bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#272727] active:scale-95'
                                        : 'bg-transparent text-gray-400 cursor-not-allowed'}`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span>{isAr ? 'إرسال' : 'Send'}</span>
                                        <SendHorizontal className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                                    </div>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center shrink-0">
                            <QuickEmojiRow onEmojiClick={onCustomEmojiClick} />
                        </div>

                        <div className="flex-1 min-w-0" />

                        <button
                            onClick={() => { setIsMainInputFocused(false); setNewComment(''); }}
                            className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-[#f1f1f1] hover:bg-gray-200 dark:hover:bg-[#272727] rounded-full transition shrink-0"
                        >
                            {isAr ? 'إلغاء' : 'Cancel'}
                        </button>

                        {showMainEmojiPicker && (
                            <div ref={emojiRef}>
                                <div className="fixed inset-0 z-[2000]" onClick={() => setShowMainEmojiPicker(false)} />
                                <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${isAr ? 'right-0' : 'left-0'} z-[2001] animate-in zoom-in-95 duration-200 shadow-2xl`}>
                                    <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} />
                                </div>
                            </div>
                        )}

                        {showCustomEmojiPicker && (
                            <div ref={customEmojiRef}>
                                <div className="fixed inset-0 z-[2000]" onClick={() => setShowCustomEmojiPicker(false)} />
                                <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${isAr ? 'right-0' : 'left-0'} z-[2001] animate-in zoom-in-95 duration-200`}>
                                    <CustomEmojiPicker
                                        onEmojiClick={onCustomEmojiClick}
                                        onClose={() => setShowCustomEmojiPicker(false)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {
                isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-12 h-12 text-black dark:text-gray-400 animate-spin" />
                    </div>
                ) : comments && comments.length > 0 ? (
                    <div className="space-y-4 overflow-x-auto custom-scrollbar pb-2">
                        {comments.slice(0, visibleCount).map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                type={type}
                                itemId={itemId}
                                depth={0}
                                onReplySuccess={handleRefresh}
                                onUpdateSuccess={onUpdateSuccess}
                                onDeleteSuccess={onDeleteSuccess}
                            />
                        ))}

                        {visibleCount < comments.length && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={async () => {
                                        setIsMoreLoading(true);
                                        await new Promise(resolve => setTimeout(resolve, 800));
                                        setVisibleCount(prev => prev + 8);
                                        setIsMoreLoading(false);
                                    }}
                                    disabled={isMoreLoading}
                                    className="flex items-center gap-2 px-8 py-3 bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white rounded-full font-black text-lg transition-all shadow-sm group border-2 border-transparent hover:border-gray-300 dark:hover:border-[#444] disabled:opacity-70"
                                >
                                    {isMoreLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    ) : (
                                        <>
                                            <span>{isAr ? 'أظهر المزيد من التعليقات' : 'Show more comments'}</span>
                                            <ChevronDown className="w-6 h-6 stroke-[3] group-hover:translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">{isAr ? 'لا توجد تعليقات حتى الآن. كن أول من يعلق!' : 'No comments yet. Be the first to comment!'}</p>
                    </div>
                )
            }
        </div >
    );
};
