import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    created_at?: string;
    role: {
        id: number;
        name: string;
        permissions: { key: string }[];
    };
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    setAccessToken: (token: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            setAccessToken: (token) =>
                set({ accessToken: token, isAuthenticated: !!token }),
            setUser: (user) => set({ user }),
            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Helper to check permissions
export const usePermission = (permissionKey: string): boolean => {
    const user = useAuthStore((state) => state.user);
    if (!user || !user.role || !user.role.permissions) return false;
    return user.role.permissions.some((p) => p.key === permissionKey);
};

export const hasPermission = (permissionKey: string): boolean => {
    const user = useAuthStore.getState().user;
    if (!user || !user.role || !user.role.permissions) return false;
    return user.role.permissions.some((p) => p.key === permissionKey);
};
