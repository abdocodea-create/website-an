import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check, MessageCircle, Heart, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotificationsStore } from '@/stores/notifications-store';
import { Notification } from '@/lib/notifications-api';
import CrunchyrollSkeleton from '@/components/skeleton/CrunchyrollSkeleton';
import api from '@/lib/api';

// Helper to get user info from actor_id
const useActorInfo = (actorId: number | undefined) => {
    const [actorName, setActorName] = useState<string>('');

    useEffect(() => {
        if (!actorId) return;

        const fetchActor = async () => {
            try {
                const response = await api.get(`/users/${actorId}`);
                setActorName(response.data.name);
            } catch (error) {
                console.error('Failed to fetch actor info:', error);
                setActorName('User');
            }
        };

        fetchActor();
    }, [actorId]);

    return actorName;
};

// Helper to get comment and episode info
const useCommentInfo = (commentId: number | undefined) => {
    const [info, setInfo] = useState<{ episodeId?: number; animeId?: number; commentContent?: string }>({});

    useEffect(() => {
        if (!commentId) return;

        const fetchComment = async () => {
            try {
                // We need to fetch the comment to get episode_id
                // Unfortunately the backend doesn't have a direct endpoint for a single comment
                // We'll need to extract episode_id from the notification data if available
                // For now, we'll rely on the data field in the notification
            } catch (error) {
                console.error('Failed to fetch comment info:', error);
            }
        };

        fetchComment();
    }, [commentId]);

    return info;
};

interface NotificationItemProps {
    notification: Notification;
    isRtl: boolean;
    onClick: () => void;
}

function NotificationItem({ notification, isRtl, onClick }: NotificationItemProps) {
    const actorName = useActorInfo(notification.data.actor_id);
    const { i18n } = useTranslation();

    const getNotificationContent = () => {
        const name = actorName || (isRtl ? 'مستخدم' : 'User');

        switch (notification.type) {
            case 'like':
                return {
                    icon: <Heart className="w-5 h-5 text-red-500 fill-current" />,
                    text: isRtl ? `أعجب ${name} بتعليقك` : `${name} liked your comment`,
                    color: 'bg-red-50 dark:bg-red-900/10',
                };
            case 'reply':
                return {
                    icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
                    text: isRtl ? `رد ${name} على تعليقك` : `${name} replied to your comment`,
                    color: 'bg-blue-50 dark:bg-blue-900/10',
                };
            default:
                return {
                    icon: <Bell className="w-5 h-5 text-gray-500" />,
                    text: isRtl ? 'إشعار جديد' : 'New notification',
                    color: 'bg-gray-50 dark:bg-gray-900/10',
                };
        }
    };

    const content = getNotificationContent();
    const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: isRtl ? ar : undefined,
    });

    return (
        <div
            onClick={onClick}
            className={`
                relative p-4 rounded-lg border cursor-pointer transition-all
                ${notification.is_read
                    ? 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#333] hover:border-gray-300 dark:hover:border-[#444]'
                    : `${content.color} border-${notification.type === 'like' ? 'red' : 'blue'}-200 dark:border-${notification.type === 'like' ? 'red' : 'blue'}-800 hover:shadow-md`
                }
            `}
        >
            {/* Unread indicator */}
            {!notification.is_read && (
                <div className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-2 w-2 h-2 rounded-full ${notification.type === 'like' ? 'bg-red-500' : 'bg-blue-500'}`} />
            )}

            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                    {content.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {content.text}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {timeAgo}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function NotificationsPage() {
    const { i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const navigate = useNavigate();
    const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate to the episode if we have the data
        if (notification.data.episode_id && notification.data.anime_id) {
            // We need to find the episode number from episode_id
            // For now, we'll navigate to the anime page
            navigate(`/${i18n.language}/animes/${notification.data.anime_id}`);
        } else if (notification.data.comment_id) {
            // If we only have comment_id, we could try to fetch the comment
            // But for now, we'll just mark it as read
            console.log('Comment ID:', notification.data.comment_id);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (window.confirm(isRtl ? 'هل تريد تعليم جميع الإشعارات كمقروءة؟' : 'Mark all notifications as read?')) {
            await markAllAsRead();
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{isRtl ? 'الإشعارات' : 'Notifications'} - AnimeLast</title>
            </Helmet>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[80vh]">
                    <div className="container px-4 sm:px-6 md:px-8 py-8 mx-auto max-w-4xl">
                        <div className="space-y-4">
                            <CrunchyrollSkeleton count={8} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bell className="w-6 h-6 text-[#f47521]" />
                                    {isRtl ? 'الإشعارات' : 'Notifications'}
                                </h1>
                                {notifications.length > 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {notifications.filter(n => !n.is_read).length > 0
                                            ? isRtl
                                                ? `${notifications.filter(n => !n.is_read).length} غير مقروء`
                                                : `${notifications.filter(n => !n.is_read).length} unread`
                                            : isRtl
                                                ? 'جميع الإشعارات مقروءة'
                                                : 'All notifications read'
                                        }
                                    </p>
                                )}
                            </div>
                            {notifications.filter(n => !n.is_read).length > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#f47521] hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-md transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    {isRtl ? 'تعليم الكل كمقروء' : 'Mark all as read'}
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                <Bell className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">{isRtl ? 'لا توجد إشعارات' : 'No notifications'}</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    {isRtl ? 'سيتم إشعارك عندما يتفاعل شخص ما مع تعليقاتك' : 'You\'ll be notified when someone interacts with your comments'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        isRtl={isRtl}
                                        onClick={() => handleNotificationClick(notification)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
