import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import UsersPage from '@/pages/users/UsersPage';
import RolesPage from '@/pages/roles/RolesPage';
import PermissionsPage from '@/pages/permissions/PermissionsPage';
import ModelsPage from '@/pages/models/ModelsPage';
import ModelViewerPage from '@/pages/models/ModelViewerPage';
import ThreeDAILabPage from '@/pages/ai/ThreeDAILabPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import CategoriesPage from '@/pages/categories/CategoriesPage';
import TypesPage from '@/pages/types/TypesPage';
import SeasonsPage from '@/pages/seasons/SeasonsPage';
import StudiosPage from '@/pages/studios/StudiosPage';
import LanguagesPage from '@/pages/languages/LanguagesPage';
import AnimesPage from '@/pages/animes/AnimesPage';
import WatchPage from '@/pages/animes/WatchPage';
import EpisodesPage from '@/pages/episodes/EpisodesPage';
import { HomeLayout } from '@/layouts/HomeLayout';
import HomePage from '@/pages/home/HomePage';
import AnimeBrowsePage from '@/pages/animes/AnimeBrowsePage';
import AnimeDetailsPage from '@/pages/animes/AnimeDetailsPage';
import UserLibraryPage from '@/pages/UserLibraryPage';
import HistoryPage from '@/pages/HistoryPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SearchPage from '@/pages/SearchPage';
import { LanguageWrapper } from '@/components/LanguageWrapper';
import { RedirectToDefaultLang } from '@/components/RedirectToDefaultLang';
import { RootRedirect } from '@/components/RootRedirect';
import ScrollToTop from '@/components/ScrollToTop';
import { UserControlPanelLayout } from '@/layouts/UserControlPanelLayout';
import UserInfoPage from '@/pages/user-dashboard/UserInfoPage';
import EditProfilePage from '@/pages/user-dashboard/EditProfilePage';
import UserSettingsPage from '@/pages/user-dashboard/UserSettingsPage';
import DashboardReportsPage from '@/pages/dashboard/DashboardReportsPage';
import DashboardAnalyticsPage from '@/pages/dashboard/DashboardAnalyticsPage';
import DashboardCommentsPage from '@/pages/dashboard/DashboardCommentsPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <>
                <ScrollToTop />
                <RootRedirect />
            </>
        ),
    },
    // Explicitly catch un-prefixed routes to redirect them to /en/...
    {
        path: '/dashboard/*',
        element: <RedirectToDefaultLang />,
    },
    {
        path: '/auth/*',
        element: <RedirectToDefaultLang />,
    },
    {
        path: '/watch/*',
        element: <RedirectToDefaultLang />,
    },
    {
        path: '/:lang',
        element: (
            <>
                <ScrollToTop />
                <LanguageWrapper />
            </>
        ),
        children: [
            {
                path: 'auth',
                element: <AuthLayout />,
                children: [

                    {
                        path: 'login',
                        element: <LoginPage />,
                    },
                ],
            },
            {
                element: <ProtectedRoute />,
                children: [
                    // Home Route (Gallery)
                    {
                        element: <HomeLayout />,
                        children: [
                            {
                                index: true,
                                element: <HomePage />,
                            },
                            {
                                path: 'animes',
                                element: <AnimeBrowsePage />,
                            },
                            {
                                path: 'animes/:id',
                                element: <AnimeDetailsPage />,
                            },
                            {
                                path: 'models/:id',
                                element: <ModelViewerPage />,
                            },
                            {
                                path: 'watch/:animeId/:episodeNum',
                                element: <WatchPage />,
                            },
                            {
                                path: 'library',
                                element: <UserLibraryPage />,
                            },
                            {
                                path: 'history',
                                element: <HistoryPage />,
                            },
                            {
                                path: 'notifications',
                                element: <NotificationsPage />,
                            },
                            {
                                path: 'search',
                                element: <SearchPage />,
                            },
                        ],
                    },
                    // User Dashboard Route (Control Panel) - /my/dashboard
                    {
                        path: 'my/dashboard',
                        element: <UserControlPanelLayout />,
                        children: [
                            {
                                index: true,
                                element: <UserInfoPage />,
                            },
                            {
                                path: 'edit',
                                element: <EditProfilePage />,
                            },
                            {
                                path: 'settings',
                                element: <UserSettingsPage />,
                            },
                        ]
                    },
                    // Admin Dashboard Route
                    {
                        path: 'dashboard',
                        element: <DashboardLayout />,
                        children: [
                            {
                                index: true,
                                element: <DashboardPage />,
                            },
                            {
                                path: 'users',
                                element: <UsersPage />,
                            },
                            {
                                path: 'roles',
                                element: <RolesPage />,
                            },
                            {
                                path: 'permissions',
                                element: <PermissionsPage />,
                            },
                            {
                                path: 'models',
                                element: <ModelsPage />,
                            },
                            {
                                path: 'models',
                                element: <ModelsPage />,
                            },
                            {
                                path: 'categories',
                                element: <CategoriesPage />,
                            },
                            {
                                path: 'types',
                                element: <TypesPage />,
                            },
                            {
                                path: 'seasons',
                                element: <SeasonsPage />,
                            },
                            {
                                path: 'studios',
                                element: <StudiosPage />,
                            },
                            {
                                path: 'languages',
                                element: <LanguagesPage />,
                            },
                            {
                                path: 'animes',
                                element: <AnimesPage />,
                            },
                            {
                                path: 'episodes',
                                element: <EpisodesPage />,
                            },
                            {
                                path: 'reports',
                                element: <DashboardReportsPage />,
                            },
                            {
                                path: 'analytics',
                                element: <DashboardAnalyticsPage />,
                            },
                            {
                                path: 'comments',
                                element: <DashboardCommentsPage />,
                            },
                            {
                                path: 'settings',
                                element: <SettingsPage />,
                            },
                            {
                                path: 'ai-lab',
                                element: <ThreeDAILabPage />,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        path: '*',
        element: <div>404 Not Found</div>,
    },
]);
