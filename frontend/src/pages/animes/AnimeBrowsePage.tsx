import { useState, useEffect, useRef, useMemo } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTranslation } from "react-i18next";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Search, Star, ThumbsUp, Filter, Facebook, Twitter, Instagram, Youtube, Mail, Globe, UserPlus, LogIn, ShieldAlert, Home, Sparkles, Monitor, Film, PlayCircle, LayoutGrid, ArrowUp, Moon, Sun, ArrowUpDown } from "lucide-react";
import AnimeListHoverCard from "@/components/AnimeListHoverCard";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AnimeHoverCard from "@/components/AnimeHoverCard";
import CrunchyrollSkeleton from "@/components/skeleton/CrunchyrollSkeleton";
import AnimeBrowseMobileSkeleton from "@/components/skeleton/AnimeBrowseMobileSkeleton";
import SpinnerImage from "@/components/ui/SpinnerImage";
import CentralSpinner from "@/components/ui/CentralSpinner";
import SearchModal from "@/components/modals/SearchModal";
import FilterModal from "@/components/modals/FilterModal";
import SearchAnimeModal from "@/components/modals/SearchAnimeModal";
import FilterAnimeModal from "@/components/modals/FilterAnimeModal";
import { SocialNavSidebar } from "@/components/social/SocialNavSidebar";
import { NewsTicker } from "@/components/common/NewsTicker";
import Footer from "@/components/common/Footer";
import { renderEmojiContent } from "@/utils/render-content";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

import { getImageUrl } from '@/utils/image-utils';

export default function AnimeBrowsePage() {
    const { i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const isRtl = i18n.language === 'ar';
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isSearchAnimeModalOpen, setIsSearchAnimeModalOpen] = useState(false);
    const [isFilterAnimeModalOpen, setIsFilterAnimeModalOpen] = useState(false);

    // Simulate initial loading to match Vue
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLanguageSelect = (lang: string) => {
        if (i18n.language === lang) return;
        const currentPath = window.location.pathname;
        const pathSegments = currentPath.split('/').filter(Boolean);

        // Check if first segment is a language code
        if (pathSegments.length > 0 && (pathSegments[0] === 'ar' || pathSegments[0] === 'en')) {
            pathSegments[0] = lang;
            navigate(`/${pathSegments.join('/')}`);
        } else {
            navigate(`/${lang}${currentPath}`);
        }
    };

    const seoTitle = i18n.language === 'ar' ? 'الرئيسية - AnimeLast' : 'Home - AnimeLast';

    return (
        <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f0f2f5] dark:bg-black text-gray-900 dark:text-white font-sans transition-colors duration-300">
            <Helmet>
                <title>{seoTitle}</title>
            </Helmet>

            {/* NewsTicker wrapper with min-height to prevent layout jump */}
            <div className="min-h-[45px]">
                <NewsTicker />
            </div>

            {/* Modals */}
            <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} />
            <SearchAnimeModal isOpen={isSearchAnimeModalOpen} onClose={() => setIsSearchAnimeModalOpen(false)} />
            <FilterAnimeModal isOpen={isFilterAnimeModalOpen} onClose={() => setIsFilterAnimeModalOpen(false)} />

            {/* Main Layout - Same as CommunityPage                        {/* Main Grid: Custom widths for narrower sidebar */}
            <div className="w-full min-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)] gap-0 overflow-visible min-h-screen">

                    {/* Left Sidebar - SocialNavSidebar */}
                    <div className="hidden lg:block sticky top-[105px] h-[calc(100vh-105px)] overflow-y-auto custom-scrollbar bg-transparent z-30 border-r border-gray-100 dark:border-[#333]/50">
                        <SocialNavSidebar />
                    </div>

                    {/* Main Content - wider width */}
                    <div className="min-w-0 w-full px-2 sm:px-6 md:px-8 pt-3 pb-8 lg:pt-5">
                        {isLoading ? (
                            <div className="flex items-center justify-center min-h-[60vh]">
                                <div className="relative w-20 h-20">
                                    <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-black dark:border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Latest Episodes Section - List Design */}
                                <BrowseSection
                                    title={i18n.language === 'ar' ? 'تصفح انميات الجديدة' : 'Browse New Animes'}
                                    endpoint="/episodes/latest"
                                    lang={i18n.language}
                                    isRtl={isRtl}
                                    isEpisodes={true}
                                />

                                {/* Browse All Section */}
                                <BrowseSection
                                    title={i18n.language === 'ar' ? 'تصفح كل الأنميات' : 'Browse All Animes'}
                                    endpoint="/animes"
                                    lang={i18n.language}
                                    isRtl={isRtl}
                                />

                                {/* Latest Animes Section */}
                                <Section
                                    title={i18n.language === 'ar' ? 'أحدث الأنميات' : 'Latest Animes'}
                                    endpoint="/animes/latest"
                                    type="anime"
                                    limit={12}
                                    showActionButtons={true}
                                    onSearchClick={() => setIsSearchAnimeModalOpen(true)}
                                    onFilterClick={() => setIsFilterAnimeModalOpen(true)}
                                    lang={i18n.language}
                                />

                                {/* Movies Section */}
                                <Section
                                    title={i18n.language === 'ar' ? 'أفلام مختارة' : 'Selected Movies'}
                                    endpoint="/animes/type/movie"
                                    type="movie"
                                    limit={12}
                                    showLink={true}
                                    linkTarget={`/${i18n.language}/movies`}
                                    lang={i18n.language}
                                />

                                {/* TV Series Section */}
                                <Section
                                    title={i18n.language === 'ar' ? 'مسلسلات أنمي تلفزيونية' : 'TV Series'}
                                    endpoint="/animes/type/TV"
                                    type="anime"
                                    limit={12}
                                    showLink={true}
                                    linkTarget="/tv-series"
                                    lang={i18n.language}
                                />

                                {/* Top Animes */}
                                <Section
                                    title={i18n.language === 'ar' ? 'أنميات بتقييم عالي' : 'High Rated Animes'}
                                    endpoint="/animes/top-rated"
                                    type="anime"
                                    limit={12}
                                    showLink={true}
                                    linkTarget={`/${i18n.language}/animes`}
                                    lang={i18n.language}
                                />
                            </>
                        )}
                    </div>
                    {/* End Main Content */}
                </div>
                {/* End Main Layout with Sidebar */}
            </div>

            {/* Advanced Footer */}
            <Footer />
        </div>
    );
}

const Section = ({ title, endpoint, type, limit, showSearch, search, setSearch, showActionButtons, onSearchClick, onFilterClick, showLink, linkTarget, lang }: any) => {
    const { elementRef, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

    // Hover state management
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load More state
    const [displayLimit, setDisplayLimit] = useState(limit);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

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

    const { data: items, isLoading: isQueryLoading } = useQuery({
        queryKey: [endpoint, displayLimit],
        queryFn: async () => (await api.get(endpoint, { params: { limit: displayLimit } })).data,
        enabled: hasIntersected,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData, // keepPreviousData logic in v5
    });

    const isLoading = (!hasIntersected || isQueryLoading) && !items;

    const handleLoadMore = async () => {
        setIsLoadingMore(true);
        setDisplayLimit((prev: number) => prev + 12);
        setTimeout(() => setIsLoadingMore(false), 500);
    };

    const canLoadMore = (type === 'episode' || type === 'anime') && items && items.length >= displayLimit;

    const isEpisode = type === 'episode';
    const gridCols = isEpisode
        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6"
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8";

    return (
        <section className="mb-10" ref={elementRef as React.RefObject<HTMLDivElement>}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>

                {showActionButtons && (
                    <div className="flex gap-2">
                        <button
                            onClick={onSearchClick}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm font-medium">
                                {lang === 'ar' ? 'بحث' : 'Search'}
                            </span>
                        </button>
                        <button
                            onClick={onFilterClick}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm font-medium">
                                {lang === 'ar' ? 'فلترة' : 'Filter'}
                            </span>
                        </button>
                    </div>
                )}

                {showSearch && (
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2 cursor-pointer" style={{ right: lang === 'ar' ? 'unset' : '0.75rem', left: lang === 'ar' ? '0.75rem' : 'unset' }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            type="text"
                            placeholder={lang === 'ar' ? "بحث..." : "Search..."}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                    </div>
                )}

                {showLink && (
                    <Link to={linkTarget} className="text-sm text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        {lang === 'ar' ? 'عرض الكل' : 'View All'}
                    </Link>
                )}
            </div>

            {isLoading ? (
                window.innerWidth < 768 ? (
                    <AnimeBrowseMobileSkeleton
                        type={type === 'episode' ? 'episode' : 'anime'}
                        count={limit}
                    />
                ) : (
                    <CrunchyrollSkeleton
                        count={limit}
                        isEpisode={type === 'episode'}
                        layout="grid"
                        gridClassName={gridCols}
                    />
                )
            ) : items?.length > 0 ? (
                <>
                    <div className={cn(gridCols, "relative z-0")}>
                        {items.map((item: any, index: number) => (
                            <CardItem
                                key={item.id}
                                item={item}
                                index={index}
                                type={type}
                                lang={lang}
                                isHovered={hoveredCardIndex === index}
                                onMouseEnter={() => handleMouseEnter(index)}
                                onMouseLeave={handleMouseLeave}
                                keepCardOpen={keepCardOpen}
                            />
                        ))}
                    </div>

                    {/* Load More Button */}
                    {canLoadMore && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                            >
                                {isLoadingMore ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent animate-spin"></div>
                                        <span>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
                                    </div>
                                ) : (
                                    lang === 'ar' ? 'عرض المزيد' : 'Load More'
                                )}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-10 text-gray-500">No content found</div>
            )}
        </section>
    );
};

import { slugify } from "@/utils/slug";

// ─── Component: Browse Section ──────────────────────────────────────────────────

function BrowseSection({ title, endpoint, lang, isRtl, isEpisodes }: { title: string; endpoint: string; lang: string; isRtl: boolean; isEpisodes?: boolean }) {
    const [selectedType, setSelectedType] = useState<'All' | 'TV' | 'Movie'>('All');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [searchQuery] = useState('');

    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (index: number) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredCardIndex(index);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => setHoveredCardIndex(null), 100);
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['browse-section', endpoint, selectedType, selectedLetter, searchQuery],
        queryFn: async ({ pageParam = 1 }) => {
            const params: any = {
                page: pageParam,
                limit: 10,
                letter: selectedLetter || '',
                search: searchQuery,
                type: selectedType === 'All' ? '' : selectedType,
            };
            const response = await api.get(endpoint, { params });
            return response.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any, allPages: any[]) =>
            lastPage.length === 10 ? allPages.length + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });

    const allItems = useMemo(() => data?.pages.flat() || [], [data]);

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const lettersDisplay = ALPHABET;

    return (
        <section className="mb-14">
            {/* Header */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-6 text-base font-bold">
                    <button className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <Filter className="w-5 h-5" />
                        <span>{isRtl ? 'فلتر' : 'Filter'}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <ArrowUpDown className="w-5 h-5" />
                        <span>{isRtl ? 'أبجدي' : 'Alphabetical'}</span>
                    </button>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h2>
            </div>

            {/* Alphabet Bar */}
            <div className="w-full border-b border-gray-200 dark:border-neutral-800 py-3 flex justify-center sticky top-[60px] z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md mb-6">
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-sm md:text-base font-bold text-gray-500 dark:text-gray-500 uppercase">
                    <button
                        onClick={() => setSelectedLetter(null)}
                        className={`hover:text-black dark:hover:text-white transition-colors ${selectedLetter === null ? 'text-black dark:text-white underline decoration-2' : ''}`}
                    >
                        #
                    </button>
                    {lettersDisplay.map((letter) => (
                        <button
                            key={letter}
                            onClick={() => setSelectedLetter(letter)}
                            className={`hover:text-black dark:hover:text-white transition-colors ${selectedLetter === letter ? 'text-black dark:text-white underline decoration-2' : ''}`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            <div className={isEpisodes ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8"}>
                {isLoading ? (
                    window.innerWidth < 768 ? (
                        <AnimeBrowseMobileSkeleton type={isEpisodes ? 'episode' : 'anime'} count={12} />
                    ) : (
                        <CrunchyrollSkeleton count={12} isEpisode={isEpisodes} layout="grid" className="!bg-transparent" />
                    )
                ) : allItems.length > 0 ? (
                    allItems.map((item: any, index: number) => (
                        <CardItem
                            key={item.id}
                            item={item}
                            index={index}
                            type={isEpisodes ? 'episode' : 'anime'}
                            lang={lang}
                            isHovered={hoveredCardIndex === index}
                            onMouseEnter={() => handleMouseEnter(index)}
                            onMouseLeave={handleMouseLeave}
                            keepCardOpen={() => {
                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                            }}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        {isRtl ? 'لا توجد نتائج' : 'No results found'}
                    </div>
                )}
            </div>

            {/* Load More */}
            {hasNextPage && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 rounded-full"
                    >
                        {isFetchingNextPage ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                                <span>{isRtl ? 'جاري التحميل...' : 'Loading...'}</span>
                            </>
                        ) : (
                            <span>{isRtl ? 'عرض المزيد' : 'Show More'}</span>
                        )}
                    </button>
                </div>
            )}
        </section>
    );
}

// ─── Grid Item Design ──────────────────────────────────────────────────────────

const CardItem = ({ item, index, type, lang, isHovered, onMouseEnter, onMouseLeave, keepCardOpen }: any) => {
    const isEpisode = type === 'episode';

    const animeObj = item.anime || item.series;

    // Logic matching Vue
    const image = animeObj?.cover || item.cover || item.image || item.banner;
    const title = lang === 'ar' ? (item.title || item.series?.title || item.anime?.title) : (item.title_en || item.series?.title_en || item.title || item.anime?.title_en);

    // For episodes, format needs to assume structure
    const displayTitle = title || 'عنوان غير متوفر';
    const subText = isEpisode ? (lang === 'ar' ? `الحلقة ${item.episode_number}` : `Episode ${item.episode_number}`) : (lang === 'ar' ? 'ترجمة | دبلجة' : 'Sub | Dub');

    const animeId = animeObj?.id || item.anime_id || item.id;

    // SEO Slug Logic
    const animeTitleForSlug = lang === 'ar' ? (animeObj?.title || item.title) : (animeObj?.title_en || item.title_en || item.title);
    const slug = slugify(animeTitleForSlug);

    const targetLink = isEpisode
        ? `/${lang}/watch/${animeId}/${item.episode_number}/${slug}`
        : `/${lang}/animes/${item.id}/${slug}`;

    return (
        <div
            className="group cursor-pointer relative z-0 flex flex-col"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Link to={targetLink} className="flex flex-col w-full h-full">
                {/* Cover Container */}
                <div className={`relative flex-shrink-0 w-full aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] transition-transform duration-300`}>
                    <SpinnerImage
                        src={getImageUrl(image)}
                        alt={displayTitle}
                        className="w-full h-full"
                        imageClassName="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Metadata Below Card */}
                <div className="mt-2.5 text-center flex flex-col items-center flex-1 w-full px-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-xs md:text-sm line-clamp-2 leading-relaxed group-hover:text-red-500 transition-colors">
                        {renderEmojiContent(displayTitle)}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        {renderEmojiContent(subText)}
                    </p>
                </div>
            </Link>

            {/* Hover Card Component */}
            {isHovered && (
                <div className="absolute inset-0 z-50 pointer-events-none md:pointer-events-auto">
                    <AnimeHoverCard
                        data={item}
                        lang={lang}
                        onMouseEnter={keepCardOpen}
                        onMouseLeave={onMouseLeave}
                    />
                </div>
            )}
        </div>
    );
};
