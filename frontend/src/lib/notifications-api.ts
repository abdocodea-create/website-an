import api from './api';

// Notification types matching backend
export type NotificationType = 'reply' | 'like' | 'system' | 'new_post';

export interface NotificationData {
    comment_id?: number;
    actor_id?: number;
    actor_name?: string;
    episode_id?: number;
    anime_id?: number;
}

export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    data: NotificationData;
    is_read: boolean;
    created_at: string;
}

// Fetch user notifications
export const fetchNotifications = async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
};

// Mark a single notification as read
export const markNotificationAsRead = async (id: number): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<void> => {
    await api.post('/notifications/read-all');
};
