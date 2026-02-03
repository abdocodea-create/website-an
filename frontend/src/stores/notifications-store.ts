import { create } from 'zustand';
import {
    Notification,
    fetchNotifications as apiFetchNotifications,
    markNotificationAsRead as apiMarkAsRead,
    markAllNotificationsAsRead as apiMarkAllAsRead,
} from '@/lib/notifications-api';

interface NotificationsStore {
    notifications: Notification[];
    isLoading: boolean;
    error: string | null;
    unreadCount: number;

    // Actions
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
    notifications: [],
    isLoading: false,
    error: null,
    unreadCount: 0,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const notifications = await apiFetchNotifications();
            const unreadCount = notifications.filter(n => !n.is_read).length;
            set({ notifications, unreadCount, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch notifications', isLoading: false });
        }
    },

    markAsRead: async (id: number) => {
        try {
            await apiMarkAsRead(id);
            const notifications = get().notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            );
            const unreadCount = notifications.filter(n => !n.is_read).length;
            set({ notifications, unreadCount });
        } catch (error: any) {
            set({ error: error.message || 'Failed to mark as read' });
        }
    },

    markAllAsRead: async () => {
        try {
            await apiMarkAllAsRead();
            const notifications = get().notifications.map(n => ({ ...n, is_read: true }));
            set({ notifications, unreadCount: 0 });
        } catch (error: any) {
            set({ error: error.message || 'Failed to mark all as read' });
        }
    },

    addNotification: (notification: Notification) => {
        const notifications = [notification, ...get().notifications];
        const unreadCount = notifications.filter(n => !n.is_read).length;
        set({ notifications, unreadCount });
    },
}));
