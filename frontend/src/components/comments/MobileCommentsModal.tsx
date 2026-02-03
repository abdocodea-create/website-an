import React, { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CommentsSection } from './CommentsSection';
import { X, Smile, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CustomEmojiPicker } from './CustomEmojiPicker';
import { RichTextInput } from './RichTextInput';
import api from '@/lib/api';

interface MobileCommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    episodeId: number;
}

export const MobileCommentsModal: React.FC<MobileCommentsModalProps> = ({
    isOpen,
    onClose,
    episodeId
}) => {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const { user } = useAuthStore();

    interface RichTextInputHandle {
        insertEmoji: (emojiUrl: string) => void;
        insertText: (text: string) => void;
    }

    const [newComment, setNewComment] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCustomEmojiPicker, setShowCustomEmojiPicker] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const emojiRef = useRef<HTMLDivElement>(null);
    const customEmojiRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<RichTextInputHandle>(null);

    // Handle click outside to close pickers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (customEmojiRef.current && !customEmojiRef.current.contains(event.target as Node)) {
                setShowCustomEmojiPicker(false);
            }
        };

        if (showEmojiPicker || showCustomEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker, showCustomEmojiPicker]);

    const getAvatarUrl = (avatar?: string) => {
        if (!avatar) return '';
        if (avatar.startsWith('http')) return avatar;
        return avatar.startsWith('/') ? avatar : `/${avatar}`;
    };

    const addComment = async () => {
        if (!newComment.trim()) return;
        try {
            await api.post(`/episodes/${episodeId}/comments`, { content: newComment });
            setNewComment('');
            setIsInputFocused(false);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error("Failed to post comment", error);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (inputRef.current) {
            inputRef.current.insertText(emojiData.emoji);
        }
        // Keep picker open for multiple selection
    };

    const onCustomEmojiClick = (emoji: string) => {
        if (inputRef.current) {
            inputRef.current.insertEmoji(emoji);
        }
        // Keep picker open for multiple selection
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="h-[100dvh] w-full p-0 bg-white dark:bg-[#111] border-t border-gray-200 dark:border-[#333] rounded-t-xl flex flex-col focus:outline-none outline-none">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#222] flex-shrink-0">
                    <SheetTitle className="text-lg font-bold text-gray-900 dark:text-white">
                        {lang === 'ar' ? 'التعليقات' : 'Comments'}
                    </SheetTitle>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Comments Area */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
                    dir="rtl"
                >
                    <CommentsSection key={refreshKey} episodeId={episodeId} stickyInput={true} />
                </div>

                {/* Sticky Comment Input at Bottom */}
                <div className="border-t border-gray-200 dark:border-[#222] bg-white dark:bg-[#111] p-4 flex-shrink-0 pb-safe" dir="rtl">
                    <div className="flex gap-3">
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
                                    ref={inputRef as any}
                                    value={newComment}
                                    onChange={setNewComment}
                                    onFocus={() => setIsInputFocused(true)}
                                    placeholder="إضافة تعليق..."
                                    className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-700 focus:border-[#f47521] py-2 px-0 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 resize-none outline-none transition-colors duration-200"
                                />
                                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                    <div className="relative" ref={emojiRef}>
                                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition text-gray-500 dark:text-[#aaa] hover:text-[#0f0f0f] dark:hover:text-white">
                                            <Smile className="w-5 h-5" />
                                        </button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full mb-2 left-0 z-50">
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
                            {(isInputFocused || newComment) && (
                                <div className="flex items-center justify-end gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
                                    <button onClick={() => { setIsInputFocused(false); setNewComment(''); }} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-[#f1f1f1] hover:bg-gray-200 dark:hover:bg-[#272727] rounded-full transition">إلغاء</button>
                                    <button onClick={addComment} disabled={!newComment} className={`px-5 py-2 text-sm font-bold rounded-full transition shadow-sm ${newComment ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-200 dark:bg-[#272727] text-gray-500 cursor-not-allowed'}`}>تعليق</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
