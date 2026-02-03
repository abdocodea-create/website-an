import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutDashboard, Users, Shield, Key, Settings, Box, Sparkles, Folder, Globe, Tag, Calendar, Building, Languages, Film, Play, Flag, BarChart3, MessageSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate?: () => void;
    lang?: string;
}

export function Sidebar({ className, onNavigate, lang = 'en' }: SidebarProps) {
    const { pathname } = useLocation();
    const { t } = useTranslation();

    const routes = [
        {
            label: t('common.dashboard'),
            icon: LayoutDashboard,
            href: `/${lang}/dashboard`,
            active: pathname === `/${lang}/dashboard`,
        },
        {
            label: t('common.users'),
            icon: Users,
            href: `/${lang}/dashboard/users`,
            active: pathname.startsWith(`/${lang}/dashboard/users`),
        },
        {
            label: t('common.roles'),
            icon: Shield,
            href: `/${lang}/dashboard/roles`,
            active: pathname.startsWith(`/${lang}/dashboard/roles`),
        },
        {
            label: t('common.permissions'),
            icon: Key,
            href: `/${lang}/dashboard/permissions`,
            active: pathname.startsWith(`/${lang}/dashboard/permissions`),
        },
        {
            label: "3D Models",
            icon: Box,
            href: `/${lang}/dashboard/models`,
            active: pathname.startsWith(`/${lang}/dashboard/models`),
        },
        {
            label: "Categories",
            icon: Folder,
            href: `/${lang}/dashboard/categories`,
            active: pathname.startsWith(`/${lang}/dashboard/categories`),
        },
        {
            label: "Types",
            icon: Tag,
            href: `/${lang}/dashboard/types`,
            active: pathname.startsWith(`/${lang}/dashboard/types`),
        },
        {
            label: "Seasons",
            icon: Calendar,
            href: `/${lang}/dashboard/seasons`,
            active: pathname.startsWith(`/${lang}/dashboard/seasons`),
        },
        {
            label: "Studios",
            icon: Building,
            href: `/${lang}/dashboard/studios`,
            active: pathname.startsWith(`/${lang}/dashboard/studios`),
        },
        {
            label: "Languages",
            icon: Languages,
            href: `/${lang}/dashboard/languages`,
            active: pathname.startsWith(`/${lang}/dashboard/languages`),
        },
        {
            label: "Animes",
            icon: Film,
            href: `/${lang}/dashboard/animes`,
            active: pathname.startsWith(`/${lang}/dashboard/animes`),
        },
        {
            label: "Episodes",
            icon: Play,
            href: `/${lang}/dashboard/episodes`,
            active: pathname.startsWith(`/${lang}/dashboard/episodes`),
        },
        {
            label: "3D AI Lab",
            icon: Sparkles,
            href: `/${lang}/dashboard/ai-lab`,
            active: pathname.startsWith(`/${lang}/dashboard/ai-lab`),
        },
        {
            label: "Reports",
            icon: Flag,
            href: `/${lang}/dashboard/reports`,
            active: pathname.startsWith(`/${lang}/dashboard/reports`),
        },
        {
            label: "Analytics",
            icon: BarChart3,
            href: `/${lang}/dashboard/analytics`,
            active: pathname.startsWith(`/${lang}/dashboard/analytics`),
        },
        {
            label: "Comments",
            icon: MessageSquare,
            href: `/${lang}/dashboard/comments`,
            active: pathname.startsWith(`/${lang}/dashboard/comments`),
        },
        {
            label: t('common.settings'),
            icon: Settings,
            href: `/${lang}/dashboard/settings`,
            active: pathname.startsWith(`/${lang}/dashboard/settings`),
        },
    ];

    return (
        <div className={cn("pb-12 h-full bg-background/95 border-r border-border/40", className)}>
            <div className="space-y-2 py-4"> {/* Reduced space-y-4 to space-y-2 */}

                {/* Homepage Section */}
                <div className="px-3 py-1">
                    {/* <h2 className="mb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
            {t('common.homepage', { defaultValue: 'HOMEPAGE' })}
          </h2> */}
                    {/* The image doesn't show "Homepage" header explicitly for the first items, or maybe it does but very subtle.
              The user's image shows "Project" (مشروع) as a top level item? Or a section?
              Actually the image shows "Dashboard" isn't even there?
              It shows "Project", "CRM", "Analytics", "HRM"...
              I will keep my structure but make font smaller/cleaner.
          */}
                    <div className="space-y-0.5"> {/* Tighter list */}
                        <Button
                            variant={pathname === `/${lang}/dashboard` ? "secondary" : "ghost"}
                            className={cn("w-full justify-start text-[12px] font-normal h-8 px-4", pathname === `/${lang}/dashboard` && "bg-primary/10 text-primary hover:bg-primary/20")}
                            asChild
                        >
                            <Link to={`/${lang}/dashboard`} onClick={onNavigate}>
                                <LayoutDashboard className="mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 opacity-80" /> {/* Slightly smaller icon h-4 w-4 */}
                                {t('common.dashboard')}
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn("w-full justify-start text-[12px] font-normal h-8 px-4")}
                            asChild
                        >
                            <Link to={`/${lang}`} onClick={onNavigate}>
                                <Globe className="mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 opacity-80" />
                                {useTranslation().i18n.language === 'ar' ? 'صفحة الموقع' : 'Website'}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Apps Section */}
                <div className="px-3 py-1">
                    <h2 className="mb-1 px-4 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                        {t('common.apps', { defaultValue: 'APPS' })}
                    </h2>
                    <div className="space-y-0.5">
                        {routes.slice(1).map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn("w-full justify-start text-[12px] font-normal h-8 px-4", route.active && "bg-primary/10 text-primary hover:bg-primary/20")}
                                asChild
                            >
                                <Link to={route.href} onClick={onNavigate}>
                                    <route.icon className="mr-3 h-4 w-4 rtl:ml-3 rtl:mr-0 opacity-80" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
