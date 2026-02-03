import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import {
    Play, Plus, Share2, Flag, Download, MessageSquare,
    Globe, Clock, Eye, ChevronUp, ChevronLeft, Star, Filter, Library,
    ThumbsUp, ThumbsDown, MoreVertical, X, Check, Copy, Link as LinkIcon,
    Maximize2, Minimize2
} from "lucide-react";
import { toast } from 'sonner';
import api from "@/lib/api";
import CrunchyrollSkeleton from "@/components/skeleton/CrunchyrollSkeleton";
import AnimeHoverCard from "@/components/AnimeHoverCard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import EpisodesModal from '@/components/EpisodesModal';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { WatchLaterButton } from '@/components/common/WatchLaterButton'; // Import Button
import { EpisodeInfoMenu } from '@/components/episodes/EpisodeInfoMenu';
import { ReportModal } from '@/components/episodes/ReportModal';

import { ShareModal } from '@/components/episodes/ShareModal';
import { MobileCommentsModal } from '@/components/comments/MobileCommentsModal';
import { trackEpisodeView, toggleEpisodeReaction, getEpisodeStats, EpisodeStats } from '@/lib/episode-stats-api';

// Helper for image URLs
const BASE_URL = '';
const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

// Helper for relative time display
const getRelativeTime = (dateString: string, lang: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (lang === 'ar') {
        if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'منذ يوم واحد';
        if (diffDays === 2) return 'منذ يومين';
        if (diffDays < 30) return `منذ ${diffDays} يوم`;
        if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} شهر`;
        return `منذ ${Math.floor(diffDays / 365)} سنة`;
    } else {
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }
};

export default function WatchPage() {
    const { animeId, episodeNum } = useParams(); // URL params: /watch/:animeId/:episodeNum
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const lang = i18n.language;

    // State
    const [activeTab, setActiveTab] = useState<'episodes' | 'comments'>('episodes');
    const [isLoadingDelay, setIsLoadingDelay] = useState(true);
    const [selectedServer, setSelectedServer] = useState<number>(0);
    const [isEpisodesModalOpen, setIsEpisodesModalOpen] = useState(false);
    const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isEpisodeInfoOpen, setIsEpisodeInfoOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const activeEpisodeRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Mobile Expansion State
    const [isEpisodesExpanded, setIsEpisodesExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Episode Stats State
    const [stats, setStats] = useState<EpisodeStats | null>(null);
    const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
    const [isAnimating, setIsAnimating] = useState<'like' | 'dislike' | null>(null);
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint is usually where sidebar moves
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Hover State
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (index: number) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredCardIndex(index);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredCardIndex(null);
        }, 100);
    };

    const keepCardOpen = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };

    // Fetch Anime Data (includes episodes)
    const { data: anime, isLoading: isQueryLoading } = useQuery({
        queryKey: ["anime", animeId],
        queryFn: async () => {
            const response = await api.get(`/animes/${animeId}`);
            return response.data;
        },
        enabled: !!animeId,
    });

    // Fetch current episode
    const { data: episodeData, isLoading: episodeLoading, error: episodeError } = useQuery({
        queryKey: ['episode', animeId, episodeNum],
        queryFn: async () => {
            const response = await api.get(`/episodes?anime_id=${animeId}&episode_number=${episodeNum}`);
            const episodes = response.data;

            console.log('📦 API Response:', episodes);
            console.log('🔍 Looking for episode_number:', Number(episodeNum));

            const foundEpisode = episodes.find((ep: any) => ep.episode_number === Number(episodeNum)) || null;

            console.log('✅ Found Episode:', foundEpisode);
            if (foundEpisode) {
                console.log('📌 Episode ID:', foundEpisode.id, 'Episode Number:', foundEpisode.episode_number);
            }

            return foundEpisode;
        },
        enabled: !!animeId && !!episodeNum,
    });

    // Track Episode View (once per anime+episode combination)
    const trackedEpisodeRef = useRef<string | null>(null);
    useEffect(() => {
        if (episodeData?.id && animeId) {
            // CRITICAL: Always use URL animeId as source of truth
            // Database may have incorrect anime_id values for episodes
            const actualAnimeId = Number(animeId);

            console.log('Episode tracking data:', {
                episodeId: episodeData.id,
                episodeNumber: episodeData.episode_number,
                episodeAnimeId: episodeData.anime_id,
                urlAnimeId: Number(animeId),
                finalAnimeId: actualAnimeId,
                episodeThumbnail: episodeData.thumbnail
            });

            const trackingKey = `${actualAnimeId}-${episodeData.id}`;
            if (trackedEpisodeRef.current !== trackingKey) {
                trackedEpisodeRef.current = trackingKey;

                console.log('🔴 Sending to backend:', {
                    episode_id: episodeData.id,
                    anime_id: actualAnimeId,
                    image: episodeData.thumbnail || episodeData.banner || ''
                });

                // Track in backend history using the ACTUAL anime_id
                api.post('/history/track-episode', {
                    episode_id: episodeData.id, // This is the REAL database ID
                    anime_id: actualAnimeId,
                    image: episodeData.thumbnail || episodeData.banner || '' // Send episode image
                }).catch(err => console.error('Failed to track episode view:', err));

                // Track view count for the new stats system
                trackEpisodeView(episodeData.id);

                // Fetch episode stats
                getEpisodeStats(episodeData.id).then(data => {
                    setStats(data);
                    setUserReaction(data.user_reaction || null);
                }).catch(err => console.error('Failed to fetch episode stats:', err));
            }
        }
    }, [episodeData?.id, episodeData?.anime_id, animeId]);

    // Fetch Episodes Data (Fallback if not in anime object)
    const { data: episodesData, isLoading: isEpisodesLoading } = useQuery({
        queryKey: ["episodes", animeId],
        queryFn: async () => {
            const response = await api.get(`/episodes?anime_id=${animeId}`);
            return response.data;
        },
        enabled: !!animeId,
    });

    // Fetch Global Latest Episodes (for the bottom section)
    const { data: latestEpisodesData } = useQuery({
        queryKey: ["latestEpisodes"],
        queryFn: async () => {
            const response = await api.get('/episodes/latest?limit=12');
            return response.data;
        },
    });

    // Derived Data
    const episodesList = useMemo(() => {
        return anime?.episodes || episodesData || [];
    }, [anime, episodesData]);

    const filteredEpisodes = useMemo(() => {
        if (!animeId) return [];
        return episodesList.filter((ep: any) => Number(ep.anime_id) === Number(animeId));
    }, [episodesList, animeId]);

    // Determine Current Episode
    const currentEpisode = useMemo(() => {
        if (!filteredEpisodes.length) return null;
        return filteredEpisodes.find((ep: any) => ep.episode_number == episodeNum);
    }, [filteredEpisodes, episodeNum]);

    // Fetch Comments for Badge (Requires currentEpisode)
    const { data: commentsData } = useQuery({
        queryKey: ["comments", currentEpisode?.id],
        queryFn: async () => {
            if (!currentEpisode?.id) return [];
            const response = await api.get(`/episodes/${currentEpisode.id}/comments`);
            return response.data;
        },
        enabled: !!currentEpisode?.id,
    });



    // Scroll to active episode when list loads or episode changes (List Scroll Only)
    useEffect(() => {
        // Wait for data to load
        if (isQueryLoading || isEpisodesLoading) return;

        // Add delay to ensure DOM is fully rendered and data is loaded
        const timer = setTimeout(() => {
            if (activeEpisodeRef.current && listRef.current && filteredEpisodes.length > 0) {
                const element = activeEpisodeRef.current;
                const container = listRef.current;

                // Calculate position to align the element to the top (Vue implementation)
                const top = element.offsetTop - container.offsetTop;

                container.scrollTo({
                    top: Math.max(0, top),
                    behavior: 'smooth'
                });
            }
        }, 300); // Reduced delay since we're checking loading states

        return () => clearTimeout(timer);
    }, [episodeNum, activeTab, filteredEpisodes, isQueryLoading, isEpisodesLoading]);

    // Video Source Logic with robust parsing moved to top level
    const servers = useMemo(() => {
        if (!currentEpisode) return [];

        // Priority: Use new Servers relationship from backend
        if (currentEpisode.servers && currentEpisode.servers.length > 0) {
            return currentEpisode.servers.map((s: any) => ({
                url: s.url,
                name: s.name || `Server ${s.id}`,
                language: s.language
            }));
        }

        // Fallback: Legacy video_urls parsing
        if (!currentEpisode.video_urls) return [];
        try {
            // Attempt to parse as JSON
            let parsed;
            try {
                parsed = JSON.parse(currentEpisode.video_urls);
            } catch {
                // If parse fails, treat as plain string URL if valid
                if (typeof currentEpisode.video_urls === 'string' && currentEpisode.video_urls.startsWith('http')) {
                    return [{ url: currentEpisode.video_urls, name: "Main Server" }];
                }
                return [];
            }

            if (Array.isArray(parsed)) {
                // Ensure array elements have 'url' property, otherwise map them (if they are just strings)
                return parsed.map((item: any, idx: number) => {
                    if (typeof item === 'string') return { url: item, name: `Server ${idx + 1}` };
                    // Handle various potential keys
                    const url = item.url || item.link || item.src || item.video_url;
                    const name = item.name || item.label || item.server_name || `Server ${idx + 1}`;
                    return { url, name };
                }).filter(s => s.url); // Filter out empty urls
            }
            // If JSON is object but specific format
            if (parsed.url || parsed.link) return [{ url: parsed.url || parsed.link, name: parsed.name || "Main Server" }];
        } catch (e) {
            console.error("Error parsing video urls", e);
        }
        return [];
    }, [currentEpisode]);

    // Reset selected server when episode changes
    useEffect(() => {
        setSelectedServer(0);
    }, [currentEpisode]);

    // Simulate loading delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoadingDelay(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleReaction = async (type: 'like' | 'dislike') => {
        if (!currentEpisode?.id) return;

        setIsAnimating(type);
        setTimeout(() => setIsAnimating(null), 500);

        try {
            const isLike = type === 'like';
            // Optimistic update
            const oldStats = stats;
            const oldReaction = userReaction;

            // Logic to calculate optimistic stats could be complex, 
            // relying on API response is safer but slower. 
            // For now, let's just wait for API response which is safer.

            const newStats = await toggleEpisodeReaction(currentEpisode.id, isLike);
            setStats(prev => ({ ...prev, ...newStats }));
            setUserReaction(newStats.user_reaction || null);
        } catch (error) {
            console.error('Failed to toggle reaction:', error);
        }
    };

    const handleShare = (platform: string, url: string, text: string) => {
        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
                break;
            case 'bluesky':
                shareUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(text + ' ' + url)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                break;
            default:
                return;
        }

        if (platform !== 'copy') {
            window.open(shareUrl, '_blank');
        }

        toast.custom((t) => (
            <div className="flex w-full items-start gap-3 rounded-lg bg-white dark:bg-[#1a1a1a] p-4 shadow-lg border border-gray-100 dark:border-[#333] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                    <button onClick={() => toast.dismiss(t)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    {platform === 'copy' ? <Check className="w-6 h-6 text-green-600" /> : <Share2 className="w-6 h-6 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                        {platform === 'copy'
                            ? (lang === 'ar' ? 'تم نسخ الرابط!' : 'Link Copied!')
                            : (lang === 'ar' ? 'جاري المشاركة...' : 'Sharing...')}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {platform === 'copy'
                            ? (lang === 'ar' ? 'تم نسخ رابط الحلقة للحافظة.' : 'Episode link copied to clipboard.')
                            : (lang === 'ar' ? `يتم فتح ${platform} للمشاركة.` : `Opening ${platform} to share.`)}
                    </p>
                </div>
            </div>
        ), { position: 'top-center', duration: 3000 });
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const isLoading = isQueryLoading || isEpisodesLoading || isLoadingDelay;

    if (isLoading) return <CrunchyrollSkeleton variant="full-screen" />;

    if (!anime || !currentEpisode) {
        return <div className="min-h-screen flex items-center justify-center text-white">Episode not found.</div>;
    }

    const videoUrl = servers[selectedServer]?.url || "";


    return (
        <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
            <Helmet>
                <title>{currentEpisode.title || `Episode ${currentEpisode.episode_number}`} - AnimeLast</title>
            </Helmet>

            {/* Video Player - Outside container on mobile for edge-to-edge, inside on desktop */}
            <div className="block md:hidden w-screen aspect-video bg-black overflow-hidden relative left-1/2 right-1/2 -mx-[50vw] -mt-8">
                {videoUrl ? (
                    <iframe
                        src={videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title="Video Player"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-500">Video source unavailable</p>
                    </div>
                )}
            </div>

            <div className="max-w-[1600px] mx-auto px-0 md:px-4 py-0 animate-fade-in">
                <div className="grid items-start grid-cols-1 gap-0 md:gap-4 lg:grid-cols-12 grid-flow-dense">

                    {/* MAIN CONTENT 1: Player Wrapper */}
                    <div className={`flex flex-col mt-0 transition-all duration-500 ease-in-out ${isTheaterMode ? 'lg:col-span-12 xl:col-span-12 w-full lg:w-[80%] mx-auto' : 'lg:col-span-7 xl:col-span-7'}`}>

                        {/* Video Player - Desktop only */}
                        <div className="hidden md:block w-full aspect-video bg-black overflow-hidden rounded-lg shadow-2xl mb-4 relative group">
                            {videoUrl ? (
                                <iframe
                                    src={videoUrl}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title="Video Player"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-gray-500">Video source unavailable</p>
                                </div>
                            )}
                        </div>

                    </div>
                    {/* MAIN CONTENT 2: Details Wrapper (Servers, Stats, Info) */}
                    <div className="flex flex-col mt-0 lg:col-span-7 xl:col-span-7 transition-all duration-500 relative z-10">

                        {/* Servers List and Stats Row (Below Player) */}
                        <div className="flex flex-row flex-wrap gap-4 mb-4 px-2 md:px-0 items-center justify-between">
                            {/* Servers Section */}
                            <div className="flex flex-col gap-3 flex-1">
                                <h3 className="flex items-center gap-2 px-1 text-sm font-bold text-gray-900 dark:text-white">
                                    <Globe className="w-4 h-4 text-black dark:text-white" />
                                    {lang === 'ar' ? 'سيرفرات المشاهدة' : 'Servers'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select value={selectedServer.toString()} onValueChange={(val: string) => setSelectedServer(Number(val))}>
                                        <SelectTrigger className="w-[140px] bg-white dark:bg-[#272727] text-black dark:text-white border-gray-200 dark:border-[#333]">
                                            <SelectValue placeholder={lang === 'ar' ? 'اختر سيرفر' : 'Select Server'} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#272727] border-gray-200 dark:border-[#333]">
                                            {servers.length > 0 ? (
                                                servers.map((server: any, idx: number) => (
                                                    <SelectItem key={idx} value={idx.toString()} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#333]">
                                                        {server.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-xs text-red-400">
                                                    {lang === 'ar' ? 'لا توجد سيرفرات متاحة' : 'No servers available'}
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {/* Theater Mode Toggle */}
                                    <button
                                        onClick={() => {
                                            if (document.startViewTransition) {
                                                document.startViewTransition(() => {
                                                    setIsTheaterMode(!isTheaterMode);
                                                });
                                            } else {
                                                setIsTheaterMode(!isTheaterMode);
                                            }
                                        }}
                                        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-bold bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#333] rounded-md transition-colors text-gray-900 dark:text-white"
                                        title={isTheaterMode ? (lang === 'ar' ? 'تصغير المشغل' : 'Exit Theater Mode') : (lang === 'ar' ? 'وضع المسرح' : 'Theater Mode')}
                                    >
                                        {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        <span className="hidden xl:inline">{isTheaterMode ? (lang === 'ar' ? 'تصغير' : 'Minimize') : (lang === 'ar' ? 'تكبير' : 'Theater')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Episode Stats - Views, Likes, Dislikes */}
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Views */}
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Eye className="w-5 h-5 text-black dark:text-white" />
                                    <span className="text-sm font-bold">
                                        {formatNumber(stats?.views_count || 0)} {lang === 'ar' ? 'مشاهدة' : 'views'}
                                    </span>
                                </div>

                                {/* Like/Dislike Buttons - Pill Style */}
                                <div className="flex items-center bg-gray-100 dark:bg-[#272727] rounded-full overflow-hidden h-10">
                                    {/* Like Button */}
                                    <button
                                        onClick={() => handleReaction('like')}
                                        className={`group flex items-center gap-2 px-4 h-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${userReaction === 'like' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                            }`}
                                        title={lang === 'ar' ? 'أعجبني' : 'Like'}
                                    >
                                        <ThumbsUp
                                            className={`w-5 h-5 transition-transform duration-300 ${userReaction === 'like' ? 'fill-black dark:fill-white scale-110' : 'group-hover:scale-110'
                                                }`}
                                        />
                                        <span className="text-sm font-bold">{formatNumber(stats?.likes_count || 0)}</span>
                                    </button>

                                    {/* Vertical Divider */}
                                    <div className="w-px h-6 bg-gray-300 dark:bg-[#444]" />

                                    {/* Dislike Button */}
                                    <button
                                        onClick={() => handleReaction('dislike')}
                                        className={`group flex items-center gap-2 px-4 h-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${userReaction === 'dislike' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'
                                            }`}
                                        title={lang === 'ar' ? 'لم يعجبني' : 'Dislike'}
                                    >
                                        <ThumbsDown
                                            className={`w-5 h-5 transition-transform duration-300 ${userReaction === 'dislike' ? 'fill-black dark:fill-white scale-110' : 'group-hover:scale-110'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>



                        {/* Episode Details */}
                        <div className="mb-6 px-2 md:px-0">
                            <div className="flex gap-4">
                                {/* Anime Thumbnail - Desktop only */}
                                <div className="hidden md:block flex-shrink-0 w-28 h-40 rounded-none overflow-hidden shadow-lg">
                                    <Link to={`/${lang}/animes/${anime.id}`}>
                                        <img
                                            src={getImageUrl(anime?.cover || anime?.banner)}
                                            alt={anime?.title}
                                            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/160x200/1a1c22/FFF?text=No+Image';
                                            }}
                                        />
                                    </Link>
                                </div>

                                {/* Details Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                        <h1 className="text-2xl font-bold mb-2">
                                            {(lang === 'ar' ? currentEpisode.title : currentEpisode.title_en) || `Episode ${currentEpisode.episode_number}`}
                                        </h1>
                                        <div className="flex items-center gap-2">
                                            <WatchLaterButton
                                                animeId={Number(animeId)}
                                                episodeId={Number(currentEpisode.id)}
                                                episodeTitle={currentEpisode.title}
                                                episodeNumber={currentEpisode.episode_number}
                                                episodeImage={getImageUrl(currentEpisode.thumbnail)}
                                                variant="icon"
                                                className="h-10 w-10 p-0 hover:bg-gray-200 dark:hover:bg-[#222]"
                                                showLabel={false}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-full hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
                                                onClick={() => setIsShareModalOpen(true)}
                                            >
                                                <Share2 className="h-9 w-9" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-full hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
                                                onClick={() => setIsEpisodeInfoOpen(true)}
                                            >
                                                <MoreVertical className="h-9 w-9" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                        <span>{anime.title}</span>
                                        <span>•</span>
                                        <span>{currentEpisode.duration}m</span>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                                        {(lang === 'ar' ? (currentEpisode.description || anime.description) : (currentEpisode.description_en || anime.description_en)) || 'No description.'}
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Mobile Action Buttons (Episodes & Comments) */}
                        <div className="grid grid-cols-2 gap-3 mt-4 lg:hidden">
                            {/* Custom Episodes Card Button */}
                            <button
                                onClick={() => setIsEpisodesModalOpen(true)}
                                className="col-span-2 flex items-center gap-4 p-3 bg-white dark:bg-black rounded-none hover:bg-gray-50 dark:hover:bg-[#111] transition-colors text-left group overflow-hidden relative shadow-sm"
                            >
                                {/* Removed Background Image Blur Effect as requested for clean white/black look */}
                                {/* <div
                                    className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl z-0"
                                    style={{ backgroundImage: `url(${getImageUrl(anime?.cover || anime?.banner)})` }}
                                />
                                <div className="absolute inset-0 bg-black/40 z-0" /> */}

                                {/* Thumbnail Stack Effect */}
                                <div className="relative z-10 shrink-0 w-40 aspect-video">
                                    {/* Stack layers */}
                                    <div className="absolute top-0 left-2 right-0 bottom-2 bg-gray-700/50 rounded-none transform translate-x-2 -translate-y-1" />
                                    <div className="absolute top-1 left-1 right-1 bottom-1 bg-gray-600/50 rounded-none transform translate-x-1 -translate-y-0.5" />
                                    {/* Main Image */}
                                    <div className="relative w-full h-full rounded-none overflow-hidden bg-gray-900 border-none shadow-xl">
                                        <img
                                            src={getImageUrl(anime?.cover || anime?.banner)}
                                            alt={anime?.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="relative z-10 flex-1 min-w-0 py-1">
                                    <h4 className="font-black text-gray-900 dark:text-white text-lg leading-tight mb-1">
                                        {lang === 'ar' ? 'باقي حلقات المسلسل' : 'Rest of Series Episodes'}
                                    </h4>
                                    <p className="text-[#f47521] text-sm font-medium mb-2">
                                        {lang === 'ar' ? (anime?.title || anime?.title_en) : (anime?.title_en || anime?.title)}
                                    </p>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        {anime?.status && (
                                            <span className="uppercase">{anime.status}</span>
                                        )}
                                        {anime?.type && (
                                            <>
                                                <span>|</span>
                                                <span className="uppercase">{anime.type}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                            {/* Comments Preview Button */}
                            <button
                                onClick={() => setIsMobileCommentsOpen(true)}
                                className="col-span-2 flex flex-col gap-3 p-4 bg-white dark:bg-black rounded-none hover:bg-gray-50 dark:hover:bg-[#111] transition-colors text-left shadow-sm min-h-[100px]"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <h4 className="font-black text-gray-900 dark:text-white text-lg leading-tight flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-black dark:text-white" />
                                        {lang === 'ar' ? 'التعليقات' : 'Comments'}
                                    </h4>
                                    {commentsData && commentsData.length > 0 && (
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-[#1a1a1a] px-2 py-1 rounded-sm">
                                            {formatNumber(commentsData.length)}
                                        </span>
                                    )}
                                </div>

                                {commentsData && commentsData.length > 0 ? (
                                    <div className="flex items-start gap-3 w-full mt-1">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                            {commentsData[commentsData.length - 1].user?.avatar ? (
                                                <img
                                                    src={getImageUrl(commentsData[commentsData.length - 1].user.avatar)}
                                                    alt={commentsData[commentsData.length - 1].user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                                                    {commentsData[commentsData.length - 1].user?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Comment Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {commentsData[commentsData.length - 1].user?.name || 'User'}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {getRelativeTime(commentsData[commentsData.length - 1].created_at, lang)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                {/* Emoji Rendering Logic Inline */}
                                                {commentsData[commentsData.length - 1].content.split(/(!\[emoji\]\(.*?\.(?:png|jpg|jpeg)\))/).map((part: string, index: number) => {
                                                    const match = part.match(/!\[emoji\]\((.*?\.(?:png|jpg|jpeg))\)/);
                                                    if (match) {
                                                        const emojiUrl = match[1].replace('/storage/', '/');
                                                        return (
                                                            <img
                                                                key={index}
                                                                src={emojiUrl}
                                                                alt="emoji"
                                                                className="inline-block w-5 h-5 align-sub mx-0.5"
                                                            />
                                                        );
                                                    }
                                                    return <span key={index}>{part}</span>;
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm italic">
                                        <span>{lang === 'ar' ? 'لا توجد تعليقات حتى الآن' : 'No comments yet'}</span>
                                    </div>
                                )}
                            </button>
                        </div>


                        {/* Social Media Share */}

                    </div>


                    {/* SIDEBAR (Episodes List) - lg:col-span-6 */}
                    {/* SIDEBAR (Episodes List) - lg:col-span-6 */}
                    {/* SIDEBAR (Episodes List) - lg:col-span-6 */}
                    {/* SIDEBAR (Episodes List) - lg:col-span-5 */}
                    {/* SIDEBAR (Episodes List) */}
                    <div className="hidden lg:flex mt-0 flex-col gap-4 lg:col-span-5 xl:col-span-5 lg:row-span-2 h-fit transition-all duration-500">
                        {/* Wrapper for Theater Mode Layout if needed */}
                        <div className="w-full">
                            {/* Sticky Header Container (Mobile Only) */}
                            <div className="sticky top-[60px] z-30 bg-white dark:bg-black md:static shadow-md md:shadow-none">
                                {/* Tabs - Restored for Desktop */}
                                <div className="flex items-center border-b border-gray-200 dark:border-[#333]">
                                    <button
                                        onClick={() => setActiveTab('episodes')}
                                        className={`flex-1 py-3 text-sm font-bold transition-all relative ${activeTab === 'episodes' ? 'text-black dark:text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black dark:after:bg-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    >
                                        {lang === 'ar' ? 'حلقات المسلسل' : 'Episodes'}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('comments')}
                                        className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 relative ${activeTab === 'comments' ? 'text-black dark:text-white after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black dark:after:bg-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                    >
                                        {lang === 'ar' ? 'التعليقات' : 'Comments'}
                                        {commentsData && commentsData.length > 0 && (
                                            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold rounded-full ${activeTab === 'comments' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 text-gray-600 dark:bg-[#333] dark:text-gray-400'}`}>
                                                {commentsData.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Filter Button - Show only for episodes tab */}
                                {activeTab === 'episodes' && (
                                    <div className="flex items-center justify-end px-2 py-2 bg-white dark:bg-black border-b border-gray-100 dark:border-[#222]">
                                        <button
                                            onClick={() => setIsEpisodesModalOpen(true)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#222] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] transition-colors"
                                            title={lang === 'ar' ? 'بحث وفلترة الحلقات' : 'Search and filter episodes'}
                                        >
                                            <Filter className="w-5 h-5" />
                                            <span>{lang === 'ar' ? 'بحث' : 'Filter'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Episodes List Content */}
                            {activeTab === 'episodes' && (
                                <div className="flex flex-col">
                                    <div ref={listRef} className={`flex flex-col gap-2 overflow-y-auto pr-0 md:pr-2 custom-scrollbar relative ${isMobile && !isEpisodesExpanded ? 'max-h-none' : 'h-[500px]'}`}>
                                        {/* Render Logic: Slicing for mobile */}
                                        {(isMobile && !isEpisodesExpanded ? filteredEpisodes.slice(0, 1) : filteredEpisodes).map((ep: any) => (
                                            <div
                                                key={ep.id}
                                                ref={Number(ep.episode_number) === Number(episodeNum) ? activeEpisodeRef : null}
                                                onClick={() => navigate(`/${lang}/watch/${anime.id}/${ep.episode_number}`)}
                                                className={`flex items-start gap-2 md:gap-3 p-1 md:p-2 cursor-pointer transition-colors border-b ${Number(ep.episode_number) === Number(episodeNum)
                                                    ? 'bg-[#f47521]/10 border-[#f47521] dark:bg-[#f47521]/20'
                                                    : 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                                                    }`}
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative w-48 aspect-video flex-shrink-0 overflow-hidden bg-gray-900">
                                                    <img
                                                        src={getImageUrl(ep.thumbnail || ep.banner)}
                                                        alt={ep.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Episode Number Badge */}
                                                    <div className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-bold bg-black/80 text-white">
                                                        EP {ep.episode_number}
                                                    </div>
                                                    {/* Duration Badge (New) */}
                                                    <div className="absolute bottom-1 right-1 px-1 py-0.5 text-[10px] font-bold bg-black/80 text-white">
                                                        {ep.duration ? `${ep.duration}m` : '24m'}
                                                    </div>
                                                    {/* Play Indicator Overlay */}
                                                    {Number(ep.episode_number) === Number(episodeNum) && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                            <Play className="w-8 h-8 text-white fill-white opacity-90" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-start h-full py-1">
                                                    <h4 className={`text-sm font-bold mb-1 line-clamp-2 ${Number(ep.episode_number) === Number(episodeNum) ? 'text-[#f47521]' : 'text-gray-900 dark:text-white'}`}>
                                                        {(lang === 'ar' ? ep.title : ep.title_en) || `Episode ${ep.episode_number}`}
                                                    </h4>

                                                    {/* Episode Description */}
                                                    {(ep.description || ep.description_en) && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                                            {lang === 'ar' ? (ep.description || ep.description_en) : (ep.description_en || ep.description)}
                                                        </p>
                                                    )}

                                                    {/* Meta Info */}
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">
                                                        <span>{getRelativeTime(ep.created_at || new Date().toISOString(), lang)}</span>
                                                        {ep.views_count && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" />
                                                                    {ep.views_count}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Sidebar Watch Later Button */}
                                                <div className="self-center pl-1">
                                                    <WatchLaterButton
                                                        animeId={Number(animeId)}
                                                        episodeId={Number(ep.id)}
                                                        variant="sidebar"
                                                        episodeTitle={(lang === 'ar' ? ep.title : ep.title_en) || `Episode ${ep.episode_number}`}
                                                        episodeNumber={ep.episode_number}
                                                        episodeImage={getImageUrl(ep.thumbnail || ep.banner)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Expand/Collapse Button for Mobile */}
                                    {isMobile && filteredEpisodes.length > 1 && (
                                        <button
                                            onClick={() => setIsEpisodesExpanded(!isEpisodesExpanded)}
                                            className="w-full py-3 mt-4 flex items-center justify-center gap-3 bg-black border-2 border-white text-white font-bold text-sm tracking-wide hover:bg-gray-900 transition-colors"
                                        >
                                            {isEpisodesExpanded ? (
                                                <>
                                                    <span>{lang === 'ar' ? 'أخفاء باقي الحلقات' : 'Hide remaining episodes'}</span>
                                                    <ChevronUp className="w-5 h-5" />
                                                </>
                                            ) : (
                                                <>
                                                    <span>{lang === 'ar' ? 'تفقد المزيد من الحلقات' : 'Check more episodes'}</span>
                                                    <Library className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Comments Content */}
                            {/* Comments Content - Controlled by Tab */}
                            {activeTab === 'comments' && (
                                <div className="mt-0 lg:h-[550px] lg:overflow-y-auto custom-scrollbar">
                                    <CommentsSection episodeId={Number(currentEpisode?.id)} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Latest Episodes Section (Bottom) */}
                <div className="flex flex-col  mb-10">
                    <h3 className={`font-bold text-xl mb-4 text-gray-900 dark:text-white ${lang === 'ar' ? 'border-r-4 pr-3' : 'border-l-4 pl-3'} border-[#f47521]`}>
                        {lang === 'ar' ? 'آخر الحلقات المضافة' : 'Latest Episodes'}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-1 md:gap-6 relative z-0 px-2 md:px-0">
                        {/* Reusing the card design from AnimeBrowsePage for consistency */}
                        {(latestEpisodesData || []).map((episode: any, index: number) => {
                            // Logic matching Vue/BrowsePage
                            const image = episode.banner || episode.image || episode.thumbnail;
                            const title = lang === 'ar' ? (episode.title || episode.series?.title) : (episode.title_en || episode.series?.title_en || episode.title);
                            const displayTitle = title || (lang === 'ar' ? 'عنوان غير متوفر' : 'Title not available');
                            const subText = episode.title || `Episode ${episode.episode_number}`;
                            const year = new Date(episode.created_at || Date.now()).getFullYear();

                            return (
                                <div
                                    key={episode.id + '_latest'}
                                    className="group cursor-pointer relative z-0"
                                    onClick={() => navigate(`/${lang}/watch/${episode.anime_id}/${episode.episode_number}`)}
                                    onMouseEnter={() => handleMouseEnter(index)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {/* Cover Container */}
                                    <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] mb-1 md:mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                                        <img
                                            src={getImageUrl(image)}
                                            alt={displayTitle}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        {/* Badges */}
                                        <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold text-white z-10 bg-black/80">
                                            {episode.episode_number}
                                        </div>

                                        {/* NEW Badge */}
                                        {index < 6 && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold bg-green-500 rounded text-white z-10">
                                                {lang === 'ar' ? 'جديد' : 'NEW'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata Below Card */}
                                    <div className="space-y-1 px-0 md:px-1 text-center">
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 line-clamp-2 leading-tight">
                                            {displayTitle}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                            {subText}
                                        </p>
                                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                                            <span className="text-gray-600">•</span>
                                            <span>{year}</span>
                                        </div>
                                    </div>

                                    {hoveredCardIndex === index && (
                                        <div className="absolute inset-0 z-50">
                                            <AnimeHoverCard
                                                data={episode}
                                                lang={lang}
                                                onMouseEnter={keepCardOpen}
                                                onMouseLeave={handleMouseLeave}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Episodes Modal */}
                <EpisodesModal
                    isOpen={isEpisodesModalOpen}
                    onClose={() => setIsEpisodesModalOpen(false)}
                    episodes={filteredEpisodes}
                    activeEpisodeNum={Number(episodeNum)}
                    animeId={Number(animeId)}
                    lang={lang}
                    isLoading={isQueryLoading || isEpisodesLoading}
                    getImageUrl={getImageUrl}
                    getRelativeTime={getRelativeTime}
                />

                {/* Mobile Comments Modal */}
                <MobileCommentsModal
                    isOpen={isMobileCommentsOpen}
                    onClose={() => setIsMobileCommentsOpen(false)}
                    episodeId={Number(currentEpisode?.id)}
                />

                {/* Share Modal */}
                {
                    currentEpisode && (
                        <ShareModal
                            episode={currentEpisode}
                            anime={anime}
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                        />
                    )
                }

                {/* Episode Info Modal */}
                {
                    currentEpisode && (
                        <EpisodeInfoMenu
                            episode={currentEpisode}
                            anime={anime}
                            onDownload={() => console.log('Download clicked')}
                            onReport={() => setIsReportModalOpen(true)}
                            onShare={() => setIsShareModalOpen(true)}
                            isOpen={isEpisodeInfoOpen}
                            onClose={() => setIsEpisodeInfoOpen(false)}
                        />
                    )
                }

                {/* Report Modal */}
                {
                    currentEpisode && (
                        <ReportModal
                            isOpen={isReportModalOpen}
                            closeModal={() => setIsReportModalOpen(false)}
                            episodeNumber={currentEpisode.episode_number}
                            episodeLink={window.location.href}
                            serverName={servers[selectedServer]?.name || 'Unknown Server'}
                            episode={currentEpisode}
                            anime={anime}
                            getImageUrl={getImageUrl}
                        />
                    )
                }
            </div >
        </div >
    );
}
