import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Smile, Sparkles, MoreVertical, Edit2, Trash2, CornerDownRight, ChevronDown, ChevronUp, Loader2, SendHorizontal, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import api from '@/lib/api';
import { getImageUrl } from '@/utils/image-utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CustomEmojiPicker } from './CustomEmojiPicker';
import { RichTextInput } from './RichTextInput';
import { QuickEmojiRow } from './QuickEmojiRow';
import { renderEmojiContent } from '@/utils/render-content';

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
    children?: Comment[];
    parent_id?: number | null;
    post_id?: number;
    episode_id?: number;
    // For YouTube-style: who this reply is directed at
    reply_to_user?: {
        id: number;
        name: string;
    } | null;
}

interface CommentItemProps {
    comment: Comment;
    type: 'episode' | 'post';
    itemId: number;
    depth?: number;
    // rootParentId: the top-level comment's ID, used so replies-to-replies
    // are still posted under the same first-level parent (YouTube style)
    rootParentId?: number;
    onReplySuccess: () => void;
    onUpdateSuccess: (comment: Comment) => void;
    onDeleteSuccess: (id: number) => void;
}

// Helper: parse @mention from content start
// Returns { mentionName, restContent } or null if no mention
const parseMention = (content: string): { mentionName: string; restContent: string } | null => {
    // Match "@Name: " or "@Name " at the start
    const match = content.match(/^@([^:]+):\s*([\s\S]*)$/);
    if (match) {
        return { mentionName: match[1].trim(), restContent: match[2] };
    }
    return null;
};

// Renders comment content with styled @mention if present
const CommentContent: React.FC<{ content: string; isAr: boolean }> = ({ content, isAr }) => {
    const mention = parseMention(content);
    if (mention) {
        return (
            <p className={`text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1] leading-7 ${isAr ? 'text-right' : 'text-left'}`}>
                <Link
                    to="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                >
                    @{mention.mentionName}
                </Link>
                <span className="text-gray-400 dark:text-gray-500 mx-1">·</span>
                {renderEmojiContent(mention.restContent)}
            </p>
        );
    }
    return (
        <p className={`text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1] leading-7 ${isAr ? 'text-right' : 'text-left'}`}>
            {renderEmojiContent(content)}
        </p>
    );
};

export const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    type,
    itemId,
    depth = 0,
    rootParentId,
    onReplySuccess,
    onUpdateSuccess,
    onDeleteSuccess
}) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [editText, setEditText] = useState(comment.content);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCustomEmojiPicker, setShowCustomEmojiPicker] = useState(false);
    const [pickerPosition, setPickerPosition] = useState<'top' | 'bottom'>('top');
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [currentEmojiTarget, setCurrentEmojiTarget] = useState<'reply' | 'edit'>('reply');
    const emojiRef = useRef<HTMLDivElement>(null);
    const customEmojiRef = useRef<HTMLDivElement>(null);
    const desktopReplyInputRef = useRef<HTMLDivElement>(null);
    const mobileReplyInputRef = useRef<HTMLDivElement>(null);
    const editInputRef = useRef<HTMLDivElement>(null);
    const mobileEditInputRef = useRef<HTMLDivElement>(null);
    const replyContainerRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

    // Optimistic UI state
    const [likes, setLikes] = useState(comment.likes);
    const [dislikes, setDislikes] = useState(comment.dislikes);
    const [interaction, setInteraction] = useState<boolean | null | undefined>(comment.user_interaction);

    useEffect(() => {
        setLikes(comment.likes);
        setDislikes(comment.dislikes);
        setInteraction(comment.user_interaction);
    }, [comment]);


    // Click outside emoji picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (customEmojiRef.current && !customEmojiRef.current.contains(event.target as Node)) {
                setShowCustomEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-focus reply input when opening (mobile uses mobileReplyInputRef)
    useEffect(() => {
        if (isReplying) {
            setTimeout(() => {
                const targetRef = window.innerWidth >= 768 ? desktopReplyInputRef : mobileReplyInputRef;
                if (targetRef.current) {
                    (targetRef.current as any).focus?.();
                }
            }, 150);
        }
    }, [isReplying]);

    // Auto-focus edit input with cursor at end (mobile uses mobileEditInputRef)
    useEffect(() => {
        if (isEditing) {
            setTimeout(() => {
                const targetRef = window.innerWidth >= 768 ? editInputRef : mobileEditInputRef;
                if (targetRef.current && (targetRef.current as any).focusAtEnd) {
                    (targetRef.current as any).focusAtEnd();
                } else if (targetRef.current) {
                    (targetRef.current as any).focus?.();
                }
            }, 150);
        }
    }, [isEditing]);

    // Deep linking: scroll to comment and highlight if commentId is in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const targetCommentId = params.get('commentId');
        const targetParentId = params.get('parentId');

        // 1. If this is a parent comment and it's mentioned in the URL, expand it
        if (targetParentId && parseInt(targetParentId) === comment.id) {
            setIsExpanded(true);
        }

        // 2. If this is the actual target comment, scroll to it and highlight
        if (targetCommentId && parseInt(targetCommentId) === comment.id && containerRef.current) {
            // Delay slightly to ensure comments are rendered and parents are expanded
            const timer = setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setIsHighlighted(true);

                // Remove highlight after 3 seconds
                setTimeout(() => setIsHighlighted(false), 3000);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [comment.id, location.search]);

    const getAvatarUrl = (avatar?: string) => {
        return getImageUrl(avatar);
    };

    const toggleLike = async (isLike: boolean) => {
        if (!user) {
            const currentLang = i18n.language || 'ar';
            navigate(`/${currentLang}/auth/login`);
            return;
        }

        const prevInteraction = interaction;
        const prevLikes = likes;
        const prevDislikes = dislikes;

        if (interaction === isLike) {
            setInteraction(null);
            if (isLike) setLikes(prev => prev - 1);
            else setDislikes(prev => prev - 1);
        } else {
            if (interaction === true) setLikes(prev => prev - 1);
            if (interaction === false) setDislikes(prev => prev - 1);
            setInteraction(isLike);
            if (isLike) setLikes(prev => prev + 1);
            else setDislikes(prev => prev + 1);
        }

        try {
            const url = type === 'episode'
                ? `/comments/${comment.id}/like`
                : `/posts/comments/${comment.id}/like`;
            await api.post(url, { is_like: isLike });
        } catch (error) {
            setInteraction(prevInteraction);
            setLikes(prevLikes);
            setDislikes(prevDislikes);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const url = type === 'episode'
                ? `/episodes/${itemId}/comments`
                : `/posts/${itemId}/comments`;

            // YouTube-style: if replying to a reply (depth > 0),
            // post under the root parent (first-level comment) instead of creating deeper nesting.
            // Prefix content with @name: to identify who is being replied to.
            const isReplyToReply = depth > 0;
            const actualParentId = isReplyToReply ? (rootParentId ?? comment.id) : comment.id;
            const contentToSend = isReplyToReply
                ? `@${comment.user?.name || 'مستخدم'}: ${replyText}`
                : replyText;

            await api.post(url, {
                content: contentToSend,
                parent_id: actualParentId,
                mention_user_id: isReplyToReply ? comment.user_id : null,
                ...(type === 'episode' ? { episode_id: itemId } : { post_id: itemId })
            });
            setReplyText('');
            setIsReplying(false);
            setIsExpanded(true);
            onReplySuccess();
        } catch (error) {
            console.error("Failed to reply", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;
        try {
            const url = type === 'episode'
                ? `/comments/${comment.id}`
                : `/posts/comments/${comment.id}`;
            const res = await api.put(url, { content: editText });
            setIsEditing(false);
            onUpdateSuccess(res.data);
        } catch (error) {
            console.error("Failed to update", error);
        }
    };

    const handleDelete = async () => {
        if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا التعليق؟' : 'Are you sure you want to delete this comment?')) return;
        try {
            const url = type === 'episode'
                ? `/comments/${comment.id}`
                : `/posts/comments/${comment.id}`;
            await api.delete(url);
            onDeleteSuccess(comment.id);
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (currentEmojiTarget === 'reply') {
            const targetRef = window.innerWidth >= 768 ? desktopReplyInputRef : mobileReplyInputRef;
            if (targetRef.current && (targetRef.current as any).insertText) {
                (targetRef.current as any).insertText(emojiData.emoji);
            } else {
                setReplyText(prev => prev + emojiData.emoji);
            }
        } else {
            const targetRef = window.innerWidth >= 768 ? editInputRef : mobileEditInputRef;
            if (targetRef.current && (targetRef.current as any).insertText) {
                (targetRef.current as any).insertText(emojiData.emoji);
            } else {
                setEditText(prev => prev + emojiData.emoji);
            }
        }
        setShowEmojiPicker(false);
    };

    const onCustomEmojiClick = (emojiUrl: string) => {
        if (currentEmojiTarget === 'reply') {
            const targetRef = window.innerWidth >= 768 ? desktopReplyInputRef : mobileReplyInputRef;
            if (targetRef.current && (targetRef.current as any).insertEmoji) {
                (targetRef.current as any).insertEmoji(emojiUrl);
            } else {
                setReplyText(prev => prev + `![emoji](${emojiUrl})`);
            }
        } else {
            const targetRef = window.innerWidth >= 768 ? editInputRef : mobileEditInputRef;
            if (targetRef.current && (targetRef.current as any).insertEmoji) {
                (targetRef.current as any).insertEmoji(emojiUrl);
            } else {
                setEditText(prev => prev + `![emoji](${emojiUrl})`);
            }
        }
        setShowCustomEmojiPicker(false);
    };

    const displayUser = comment.user || (user?.id === comment.user_id ? { name: user.name, avatar: user.avatar } : null);

    const isAr = i18n.language === 'ar';
    // Only indent depth=1 (first-level replies), no deeper indentation
    const marginClass = depth > 0 ? (isAr ? 'mr-4 md:mr-8' : 'ml-4 md:ml-8') : '';
    const borderClass = depth > 0 ? (isAr ? 'border-r-2 pr-4' : 'border-l-2 pl-4') : '';

    return (
        <div
            id={`comment-${comment.id}`}
            ref={containerRef}
            className={`group relative transition-all duration-500 ${isHighlighted ? 'animate-comment-highlight ring-2 ring-blue-400/30 z-10' : ''} ${depth > 0 ? `${marginClass} ${borderClass} border-gray-100 dark:border-[#333]` : ''}`}
        >
            <div className={`flex gap-3 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <Link to={`/${i18n.language}/u/${comment.user_id}/profile`} className="block">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-[#272727] shadow-sm hover:opacity-80 transition-opacity">
                            {displayUser?.avatar ? (
                                <img src={getAvatarUrl(displayUser.avatar)} alt={displayUser.name} className="object-cover w-full h-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                                    {displayUser?.name ? displayUser.name.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0" dir={isAr ? 'rtl' : 'ltr'}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Link to={`/${i18n.language}/u/${comment.user_id}/profile`}>
                                <span className="text-sm font-bold text-[#0f0f0f] dark:text-[#f1f1f1] hover:text-black dark:hover:text-white cursor-pointer transition">
                                    {displayUser?.name || 'مستخدم غير معروف'}
                                </span>
                            </Link>
                            <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: i18n.language === 'ar' ? ar : undefined })}
                            </span>

                            {/* Actions Menu */}
                            {user && user.id === comment.user_id && (
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowOptionsMenu(!showOptionsMenu);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {showOptionsMenu && (
                                        <>
                                            <div className="fixed inset-0 z-[998]" onClick={() => setShowOptionsMenu(false)} />
                                            <div className={`absolute ${isAr ? 'left-0' : 'right-0'} top-full mt-1 w-32 bg-white dark:bg-[#1f1f1f] rounded-none shadow-xl border border-gray-100 dark:border-[#333] py-1 z-[999] animate-in fade-in zoom-in-95 duration-200`}>
                                                <button
                                                    onClick={() => {
                                                        setCurrentEmojiTarget('edit');
                                                        setIsEditing(true);
                                                        setShowOptionsMenu(false);
                                                    }}
                                                    className={`w-full ${isAr ? 'text-right' : 'text-left'} px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#272727] flex items-center gap-2`}
                                                >
                                                    <Edit2 className="w-4 h-4" /> {isAr ? 'تعديل' : 'Edit'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDelete();
                                                        setShowOptionsMenu(false);
                                                    }}
                                                    className={`w-full ${isAr ? 'text-right' : 'text-left'} px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2`}
                                                >
                                                    <Trash2 className="w-4 h-4" /> {isAr ? 'حذف' : 'Delete'}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Content - with @mention rendering */}
                    {!isEditing ? (
                        <CommentContent content={comment.content} isAr={isAr} />
                    ) : (
                        <>
                            {/* Desktop Edit (hidden on mobile) */}
                            <div className="hidden md:block mt-1">
                                <div className="flex gap-2">
                                    <RichTextInput
                                        ref={editInputRef}
                                        value={editText}
                                        onChange={setEditText}
                                        className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white py-2 px-0 text-sm text-[#0f0f0f] dark:text-[#f1f1f1] resize-none outline-none transition-colors duration-200"
                                    />
                                </div>

                                {/* Desktop actions bar: [Cancel] [Save] [——emoji row——>] */}
                                <div className="flex items-center gap-1 mt-1 w-full relative">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="h-9 px-3 flex items-center justify-center rounded-none transition-all shrink-0 font-bold text-sm text-gray-500 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#272727] active:scale-95"
                                    >
                                        {isAr ? 'إلغاء' : 'Cancel'}
                                    </button>

                                    <button
                                        onClick={handleEdit}
                                        className="h-9 px-4 flex items-center justify-center rounded-none transition-all shrink-0 font-bold text-sm bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#272727] active:scale-95"
                                    >
                                        {isAr ? 'حفظ' : 'Save'}
                                    </button>

                                    <div className="flex items-center shrink-0">
                                        <QuickEmojiRow onEmojiClick={onCustomEmojiClick} />
                                    </div>

                                    {showEmojiPicker && (
                                        <div ref={emojiRef}>
                                            <div className="fixed inset-0 z-[2000]" onClick={() => setShowEmojiPicker(false)} />
                                            <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${isAr ? 'right-0' : 'left-0'} z-[2001] animate-in zoom-in-95 duration-200 shadow-2xl`}>
                                                <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} />
                                            </div>
                                        </div>
                                    )}

                                    {showCustomEmojiPicker && (
                                        <div ref={customEmojiRef}>
                                            <div className="fixed inset-0 z-[2000]" onClick={() => setShowCustomEmojiPicker(false)} />
                                            <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${isAr ? 'right-0' : 'left-0'} z-[2001] animate-in zoom-in-95 duration-200`}>
                                                <CustomEmojiPicker onEmojiClick={onCustomEmojiClick} onClose={() => setShowCustomEmojiPicker(false)} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Edit Modal */}
                            <div className="md:hidden fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300 ease-out flex flex-col justify-end" onClick={() => setIsEditing(false)}>
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white dark:bg-[#1a1a1a] w-full max-h-[70vh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-bottom-full duration-300 ease-out flex-shrink-0"
                                >
                                    {/* Modal Handle & Header */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#333] relative">
                                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none" />
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-gray-100 dark:ring-[#222]">
                                                {user?.avatar ? (
                                                    <img src={getAvatarUrl(user.avatar)} alt={user.name} className="object-cover w-full h-full" />
                                                ) : (
                                                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                                )}
                                            </div>
                                            <span className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
                                                {isAr ? 'تعديل التعليق' : 'Edit Comment'}
                                            </span>
                                        </div>
                                        <button onClick={() => setIsEditing(false)} className="mt-1 p-2 bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Modal Body & Input */}
                                    <div className="p-5 flex flex-col overflow-y-auto w-full">
                                        <div className="flex-1 w-full bg-gray-50 dark:bg-[#111] rounded-2xl p-4 border border-gray-100 dark:border-[#222]">
                                            <RichTextInput
                                                ref={mobileEditInputRef}
                                                value={editText}
                                                onChange={setEditText}
                                                placeholder={isAr ? 'عدّل تعليقك...' : 'Edit your comment...'}
                                                className="w-full bg-transparent border-none py-0 px-0 text-base text-[#0f0f0f] dark:text-[#f1f1f1] resize-none outline-none transition-colors duration-200 min-h-[120px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Modal Bottom Actions */}
                                    <div className="flex items-center justify-between p-4 px-5 border-t border-gray-100 dark:border-[#333] bg-white dark:bg-[#1a1a1a] shrink-0 mt-auto rounded-b-lg w-full overflow-hidden">
                                        <div className="flex-1 min-w-0 pr-2 rtl:pl-2 rtl:pr-0">
                                            <QuickEmojiRow onEmojiClick={onCustomEmojiClick} />
                                        </div>
                                        <button
                                            onClick={handleEdit}
                                            disabled={!editText || isSubmitting}
                                            className={`h-11 px-5 ml-1 rtl:ml-0 rtl:mr-1 flex items-center justify-center rounded-xl transition-all shrink-0 font-bold text-sm
                                            ${editText ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20' : 'bg-gray-100 dark:bg-[#222] text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>{isAr ? 'حفظ' : 'Save'}</span>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => toggleLike(true)} className={`flex items-center gap-1.5 transition group/btn ${interaction === true ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-[#aaa] hover:text-blue-600 dark:hover:text-blue-500'}`}>
                            <ThumbsUp className={`w-4 h-4 transition-transform ${interaction === true ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold">{likes}</span>
                        </button>
                        <button onClick={() => toggleLike(false)} className={`flex items-center gap-1.5 transition group/btn ${interaction === false ? 'text-red-600 dark:text-red-500' : 'text-gray-500 dark:text-[#aaa] hover:text-red-600 dark:hover:text-red-500'}`}>
                            <ThumbsDown className={`w-4 h-4 transition-transform ${interaction === false ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold">{dislikes}</span>
                        </button>
                        <button onClick={() => {
                            if (!user) {
                                const currentLang = i18n.language || 'ar';
                                navigate(`/${currentLang}/auth/login`);
                                return;
                            }
                            setIsReplying(!isReplying);
                            if (!isReplying) setCurrentEmojiTarget('reply');
                        }} className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#272727] px-2 py-1 rounded-none transition">
                            <CornerDownRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} /> {isAr ? 'رد' : 'Reply'}
                        </button>
                    </div>

                    {/* Reply Form */}
                    {isReplying && (
                        <div ref={replyContainerRef}>
                            {/* Desktop Container (Hidden on mobile) */}
                            <div className="hidden md:block mt-2 animate-in fade-in slide-in-from-top-2">
                                {/* Show who we're replying to (YouTube-style hint) */}
                                {depth > 0 && (
                                    <div className={`text-xs text-blue-500 dark:text-blue-400 font-bold mb-1 ${isAr ? 'text-right' : 'text-left'}`}>
                                        {isAr ? `الرد على @${comment.user?.name}` : `Replying to @${comment.user?.name}`}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <div className="flex gap-3 mb-1">
                                        <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                            {user?.avatar ? (
                                                <img src={getAvatarUrl(user.avatar)} alt={user.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <RichTextInput
                                                ref={desktopReplyInputRef}
                                                value={replyText}
                                                onChange={setReplyText}
                                                placeholder={isAr ? "اكتب ردك هنا..." : "Write your reply here..."}
                                                className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white py-2 px-0 text-sm text-[#0f0f0f] dark:text-[#f1f1f1] resize-none outline-none transition-colors duration-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Desktop actions bar: [Cancel] [Reply→] [emoji row] */}
                                    <div className="flex items-center gap-1 mt-1 w-full relative">
                                        <button
                                            onClick={() => setIsReplying(false)}
                                            className="h-9 px-3 flex items-center justify-center rounded-none transition-all shrink-0 font-bold text-sm text-gray-500 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#272727] active:scale-95"
                                        >
                                            {isAr ? 'إلغاء' : 'Cancel'}
                                        </button>

                                        <button
                                            onClick={handleReply}
                                            disabled={!replyText || isSubmitting}
                                            className={`h-9 px-4 flex items-center justify-center rounded-none transition-all shrink-0 font-bold text-sm
                                            ${replyText ? 'bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#272727] active:scale-95' : 'bg-transparent text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>{isAr ? 'رد' : 'Reply'}</span>
                                                    <SendHorizontal className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                                                </div>
                                            )}
                                        </button>

                                        <div className="flex items-center shrink-0">
                                            <QuickEmojiRow onEmojiClick={onCustomEmojiClick} />
                                        </div>

                                        {showEmojiPicker && (
                                            <div ref={emojiRef}>
                                                <div className="fixed inset-0 z-[2000]" onClick={() => setShowEmojiPicker(false)} />
                                                <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${isAr ? 'right-0' : 'left-0'} z-[2001] animate-in zoom-in-95 duration-200 shadow-2xl`}>
                                                    <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.AUTO} />
                                                </div>
                                            </div>
                                        )}

                                        {showCustomEmojiPicker && (
                                            <div ref={customEmojiRef}>
                                                <div className="fixed inset-0 z-[2000]" onClick={() => setShowCustomEmojiPicker(false)} />
                                                <div className={`absolute ${pickerPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${isAr ? 'right-0' : 'left-0'} z-[2001] animate-in zoom-in-95 duration-200`}>
                                                    <CustomEmojiPicker onEmojiClick={onCustomEmojiClick} onClose={() => setShowCustomEmojiPicker(false)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Half-Screen Modal */}
                            <div className="md:hidden fixed inset-0 z-[9999] bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-300 ease-out flex flex-col justify-end" onClick={() => setIsReplying(false)}>
                                {/* Prevent click propagation to overlay */}
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white dark:bg-[#1a1a1a] w-full max-h-[70vh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-bottom-full duration-300 ease-out flex-shrink-0"
                                >
                                    {/* Modal Handle & Header */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#333] relative">
                                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none" />
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-gray-100 dark:ring-[#222]">
                                                {user?.avatar ? (
                                                    <img src={getAvatarUrl(user.avatar)} alt={user.name} className="object-cover w-full h-full" />
                                                ) : (
                                                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                                )}
                                            </div>
                                            <span className="font-extrabold text-gray-900 dark:text-white text-base leading-tight">
                                                {isAr ? 'إضافة رد' : 'Add Reply'}
                                                <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                                                    {isAr ? `على @${comment.user?.name}` : `to @${comment.user?.name}`}
                                                </span>
                                            </span>
                                        </div>
                                        <button onClick={() => setIsReplying(false)} className="mt-1 p-2 bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#333] rounded-full transition-colors text-gray-500 dark:text-gray-400">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Modal Body & Input */}
                                    <div className="p-5 flex flex-col overflow-y-auto w-full">
                                        <div className="flex-1 w-full bg-gray-50 dark:bg-[#111] rounded-2xl p-4 border border-gray-100 dark:border-[#222]">
                                            <RichTextInput
                                                ref={mobileReplyInputRef}
                                                value={replyText}
                                                onChange={setReplyText}
                                                placeholder={isAr ? "شاركنا برأيك هنا..." : "Share your thoughts here..."}
                                                className="w-full bg-transparent border-none py-0 px-0 text-base text-[#0f0f0f] dark:text-[#f1f1f1] resize-none outline-none transition-colors duration-200 min-h-[120px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Modal Bottom Actions */}
                                    <div className="flex items-center justify-between p-4 px-5 border-t border-gray-100 dark:border-[#333] bg-white dark:bg-[#1a1a1a] shrink-0 mt-auto rounded-b-lg w-full overflow-hidden">
                                        <div className="flex-1 min-w-0 pr-2 rtl:pl-2 rtl:pr-0">
                                            <QuickEmojiRow onEmojiClick={onCustomEmojiClick} />
                                        </div>
                                        <button
                                            onClick={handleReply}
                                            disabled={!replyText || isSubmitting}
                                            className={`h-11 px-5 ml-1 rtl:ml-0 rtl:mr-1 flex items-center justify-center rounded-xl transition-all shrink-0 font-bold text-sm
                                            ${replyText ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-600/20' : 'bg-gray-100 dark:bg-[#222] text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span>{isAr ? 'إرسال' : 'Send'}</span>
                                                    <SendHorizontal className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Emoji Picker Popover (fallback) */}
                    {showEmojiPicker && !isReplying && !isEditing && (
                        <div ref={emojiRef} className="absolute z-[2000] mt-2 shadow-xl">
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={Theme.AUTO}
                            />
                        </div>
                    )}

                    {/* ===== FLAT REPLIES (YouTube-style) =====
                        Only rendered for depth=0 (top-level comments).
                        All children (replies + replies-to-replies) are flat at depth=1.
                        Each child gets rootParentId = comment.id so further replies
                        are always posted under this top-level comment. */}
                    {depth === 0 && comment.children && comment.children.length > 0 && (
                        <div className="mt-3">
                            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-none transition w-fit mb-2">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span>{isExpanded ? (isAr ? 'إخفاء الردود' : 'Hide Replies') : (isAr ? `عرض ${comment.children.length} ردود` : `Show ${comment.children.length} replies`)}</span>
                            </button>
                            {isExpanded && (
                                <div className="space-y-4">
                                    {comment.children.map(child => (
                                        <CommentItem
                                            key={child.id}
                                            comment={child}
                                            type={type}
                                            itemId={itemId}
                                            depth={1}
                                            rootParentId={comment.id}
                                            onReplySuccess={onReplySuccess}
                                            onUpdateSuccess={onUpdateSuccess}
                                            onDeleteSuccess={onDeleteSuccess}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

