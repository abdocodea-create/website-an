import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LogOut,
    Settings,
    Crown,
    ArrowRightLeft,
    Bookmark,
    List,
    History,
    Bell,
    Pen,
    User as UserIcon,
    Loader2,
    LayoutDashboard,
    Languages,
    Check
} from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/components/theme-provider';

interface UserMenuContentProps {
    user: any;
    onClose?: () => void;
}

export function UserMenuContent({ user, onClose }: UserMenuContentProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { i18n } = useTranslation();
    const logout = useAuthStore((state) => state.logout);
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        notifications_count: 0,
        history_count: 0,
        watch_later_count: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/user/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch user stats', error);
            } finally {
                setTimeout(() => setIsLoading(false), 300);
            }
        };

        fetchStats();
    }, []);

    const getAvatarUrl = (avatar: string | undefined) => {
        if (!avatar) return undefined;
        if (avatar.startsWith('http')) return avatar;
        return avatar.startsWith('/') ? avatar : `/${avatar}`;
    };

    const handleLogout = () => {
        logout();
        navigate(`/${i18n.language}/auth/login`);
        if (onClose) onClose();
    };

    const handleNavigation = (path: string) => {
        const lang = i18n.language || 'en';
        // Ensure path includes language prefix
        const targetPath = path.startsWith('/') ? `/${lang}${path}` : `/${lang}/${path}`;
        navigate(targetPath);
        if (onClose) onClose();
    };

    const handleLanguageSwitch = (newLang: string) => {
        const currentPath = location.pathname;
        const pathSegments = currentPath.split('/').filter(Boolean);

        // If path has language prefix, replace it
        if (pathSegments.length > 0 && (pathSegments[0] === 'ar' || pathSegments[0] === 'en')) {
            pathSegments[0] = newLang;
            const newPath = '/' + pathSegments.join('/');
            navigate(newPath);
        } else {
            // If no prefix (shouldn't happen often with strict routing), prepend
            navigate(`/${newLang}${currentPath}`);
        }

        if (onClose) onClose();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 h-full py-20 gap-4 w-80">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-gray-100 dark:border-[#333] rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-[#f47521] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-400 font-medium">جاري التحميل...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-96 max-h-[600px] overflow-y-auto custom-scrollbar min-h-[300px]">
            {/* Profile Header */}
            <DropdownMenuLabel className="p-4 font-normal">
                <div className="flex items-center justify-between">
                    {/* Edit Profile Icon (Left) */}
                    <button
                        onClick={() => handleNavigation('/my/dashboard/edit')}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <Pen className="w-5 h-5" />
                    </button>

                    {/* User Info (Center/Right) */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{user?.name}</span>
                        </div>

                        {/* Avatar (Right) */}
                        <div className="relative w-14 h-14 overflow-hidden rounded-full ring-2 ring-[#222]">
                            {user?.avatar ? (
                                <img
                                    src={getAvatarUrl(user.avatar)}
                                    alt={user.name}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full bg-[#f47521] text-white font-bold text-xl">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DropdownMenuLabel>

            {/* Premium/Trial Banner */}
            <div className="px-2 mb-2">
                <div className="bg-[#f47521] rounded-none p-3 flex items-center justify-center gap-3 cursor-pointer hover:bg-[#ff8c42] transition-colors">
                    <Crown className="w-5 h-5 text-black fill-current" />
                    <span className="text-base font-black text-black uppercase tracking-wide">تجربة مجانية لـ 7 يومًا</span>
                </div>
            </div>

            <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#333]" />

            {/* Menu Group 1: Profile, Admin, Settings, Language */}
            <DropdownMenuGroup className="py-1">
                <DropdownMenuItem
                    onClick={() => handleNavigation('/my/dashboard')}
                    className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
                >
                    <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">تغيير الملف الشخصي</span>
                    <ArrowRightLeft className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </DropdownMenuItem>

                {/* Admin Dashboard Link */}
                <DropdownMenuItem
                    onClick={() => handleNavigation('/dashboard')}
                    className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
                >
                    <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">لوحة التحكم الأدمن</span>
                    <LayoutDashboard className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleNavigation('/my/dashboard/settings')}
                    className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
                >
                    <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">إعدادات</span>
                    <Settings className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </DropdownMenuItem>

                {/* Language Switcher Submenu */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                            {i18n.language === 'ar' ? 'اللغة' : 'Language'}
                        </span>
                        <Languages className="w-5 h-5 ml-2 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    </DropdownMenuSubTrigger>

                    <DropdownMenuSubContent className="w-48 bg-white dark:bg-[#111] border-gray-100 dark:border-[#333]">
                        <DropdownMenuItem
                            onClick={() => handleLanguageSwitch('ar')}
                            className="flex items-center justify-between cursor-pointer focus:bg-gray-100 dark:focus:bg-[#222]"
                        >
                            <span className="font-medium">العربية</span>
                            {i18n.language === 'ar' && <Check className="w-4 h-4 text-[#f47521]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleLanguageSwitch('en')}
                            className="flex items-center justify-between cursor-pointer focus:bg-gray-100 dark:focus:bg-[#222]"
                        >
                            <span className="font-medium">English</span>
                            {i18n.language === 'en' && <Check className="w-4 h-4 text-[#f47521]" />}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#333]" />

            {/* Menu Group 2 */}
            <DropdownMenuGroup className="py-1">
                <DropdownMenuItem
                    onClick={() => handleNavigation('/library')}
                    className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
                >
                    <div className="flex items-center gap-2">
                        {stats.watch_later_count > 0 && (
                            <span className="text-xs font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full">{stats.watch_later_count}</span>
                        )}
                        <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">قائمة المشاهدة</span>
                    </div>
                    <Bookmark className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleNavigation('/library')}
                    className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
                >
                    <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">قوائم كرانشي</span>
                    <List className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleNavigation('/history')}
                    className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
                >
                    <div className="flex items-center gap-2">
                        {stats.history_count > 0 && (
                            <span className="text-xs font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full">{stats.history_count}</span>
                        )}
                        <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">السجل</span>
                    </div>
                    <History className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#333]" />

            {/* Menu Group 3 */}
            <DropdownMenuGroup className="py-1">
                <DropdownMenuItem
                    onClick={() => handleNavigation('/notifications')}
                    className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
                >
                    <div className="flex items-center gap-2">
                        {stats.notifications_count > 0 && (
                            <span className="text-xs font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full">{stats.notifications_count}</span>
                        )}
                        <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">إشعارات</span>
                    </div>
                    <Bell className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#333]" />

            {/* Theme Toggle */}
            <DropdownMenuGroup className="py-1">
                <div
                    className="flex items-center justify-between w-full px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        setTheme(theme === 'dark' ? 'light' : 'dark');
                    }}
                >
                    {/* Switch */}
                    <div className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ease-in-out ${theme === 'dark' ? 'bg-[#f47521]' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm absolute top-1 ${theme === 'dark' ? 'left-1' : 'right-1'}`}></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                            {theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}
                        </span>
                    </div>
                </div>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#333]" />

            {/* Logout */}
            <DropdownMenuItem
                onClick={handleLogout}
                className="focus:bg-gray-100 dark:focus:bg-[#1a1a1a] cursor-pointer rounded-none mb-1 flex items-center justify-end w-full px-5 py-2.5 gap-4 group"
            >
                <span className="text-base font-medium text-gray-700 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white transition-colors">تسجيل الخروج</span>
                <LogOut className="w-5 h-5 text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
            </DropdownMenuItem>
        </div>
    );
}
