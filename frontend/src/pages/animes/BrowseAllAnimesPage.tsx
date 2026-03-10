import { useState, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, ArrowUpDown, LayoutGrid } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Link, useSearchParams } from 'react-router-dom';
import AnimeListHoverCard from '@/components/AnimeListHoverCard';
import AnimeHoverCard from '@/components/AnimeHoverCard';
import { SocialNavSidebar } from '@/components/social/SocialNavSidebar';
import { NewsTicker } from '@/components/common/NewsTicker';
import Footer from '@/components/common/Footer';
import CentralSpinner from '@/components/ui/CentralSpinner';
import SpinnerImage from '@/components/ui/SpinnerImage';
import { renderEmojiContent } from '@/utils/render-content';
import { slugify } from '@/utils/slug';

export default function BrowseAllAnimesPage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language;
    const isRtl = lang === 'ar';
    const [searchParams] = useSearchParams();

    // State
    const [selectedType, setSelectedType] = useState<'All' | 'TV' | 'Movie'>('All');
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Animes
    // Fetch Animes with Pagination (Infinite Scroll)
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useInfiniteQuery({
        queryKey: ['browse-all-animes', selectedType, selectedLetter, searchQuery, searchParams.get('categoryId')],
        queryFn: async ({ pageParam = 1 }) => {
            const params: any = {
                page: pageParam,
                limit: 10,
                letter: selectedLetter || '',
                search: searchQuery,
                category_id: searchParams.get('categoryId'),
                type: selectedType === 'All' ? '' : selectedType,
            };
            const response = await api.get('/animes', { params });
            return response.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage: any, allPages: any[]) => {
            // If the last page has fewer than limit items, there are no more pages.
            // Assuming limit is 10.
            return lastPage.length === 10 ? allPages.length + 1 : undefined;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Flatten filtered data
    const allAnimes = useMemo(() => {
        return data?.pages.flat() || [];
    }, [data]);

    // Hover Logic
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

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const lettersDisplay = isRtl ? [...alphabet].reverse() : alphabet;

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 font-sans">
            <Helmet>
                <title>{isRtl ? 'تصفح كل الأنميات - AnimeLast' : 'Browse All Animes - AnimeLast'}</title>
            </Helmet>

            <NewsTicker />

            {isLoading ? (
                <CentralSpinner className="min-h-screen" />
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-visible transition-all duration-300">
                        {/* Left Sidebar - narrower width */}
                        <div className="hidden lg:block lg:col-span-2 sticky top-[105px] h-[calc(100vh-105px)] overflow-y-auto custom-scrollbar bg-transparent z-30">
                            <SocialNavSidebar />
                        </div>

                        {/* Main Content - 10 Columns */}
                        <div className="px-3 md:px-8 pb-8 transition-all duration-300 col-span-1 lg:col-span-10">
                            {/* Header Section */}
                            <div className="flex flex-col gap-8 mb-12">
                                {/* Top Bar: Filters & Title */}
                                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4">

                                    {/* Controls (Filter / Sort) - Bigger & Bolder */}
                                    <div className="flex items-center gap-6 text-base md:text-lg font-bold">
                                        <button className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-black dark:hover:text-white transition-colors">
                                            <Filter className="w-6 h-6" />
                                            <span>{isRtl ? 'فلتر' : 'Filter'}</span>
                                        </button>
                                        <button className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-black dark:hover:text-white transition-colors">
                                            <ArrowUpDown className="w-6 h-6" />
                                            <span>{isRtl ? 'أبجدي' : 'Alphabetical'}</span>
                                        </button>
                                    </div>

                                    {/* Page Title */}
                                    <div className="relative">
                                        <div className="absolute top-0 right-0 w-full h-full bg-black/5 dark:bg-white/5 pr-4 -z-10" />
                                        <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white tracking-tighter italic uppercase">
                                            {isRtl ? 'جميع الأنميات' : 'Browse All Animes'}
                                        </h1>
                                        <div className="mt-2 h-2 w-32 bg-black dark:bg-white" />
                                    </div>
                                </div>

                            </div>

                            {/* Alphabet Bar - Centered & Sticky */}
                            <div className="w-full border-b border-gray-200 dark:border-neutral-800 py-4 flex justify-center sticky top-[60px] z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md mb-8">
                                <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base font-bold text-gray-500 dark:text-gray-500 uppercase">
                                    <button
                                        onClick={() => setSelectedLetter(null)}
                                        className={cn(
                                            "hover:text-black dark:hover:text-white transition-colors",
                                            selectedLetter === null ? "text-black dark:text-white" : ""
                                        )}
                                    >
                                        #
                                    </button>

                                    {lettersDisplay.map((letter) => (
                                        <button
                                            key={letter}
                                            onClick={() => setSelectedLetter(letter)}
                                            className={cn(
                                                "hover:text-black dark:hover:text-white transition-colors",
                                                selectedLetter === letter ? "text-black dark:text-white" : ""
                                            )}
                                        >
                                            {letter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* List Container */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8">
                                {allAnimes.length > 0 ? (
                                    allAnimes.map((anime: any, index: number) => (
                                        <CardItem
                                            key={anime.id}
                                            item={anime}
                                            index={index}
                                            type="anime"
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
                                    <div className="col-span-full text-center py-20 text-gray-500">
                                        {isRtl ? 'لا توجد نتائج' : 'No results found'}
                                    </div>
                                )}
                            </div>

                            {/* Show More Button */}
                            {hasNextPage && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>{isRtl ? 'جاري التحميل...' : 'Loading...'}</span>
                                            </>
                                        ) : (
                                            <span>{isRtl ? 'عرض المزيد' : 'Show More'}</span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <Footer />
                </>
            )}
        </div>
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
                <div className={`relative flex-shrink-0 w-full ${isEpisode ? 'aspect-video' : 'aspect-[3/4]'} overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] transition-transform duration-300`}>
                    <SpinnerImage
                        src={getValidImageUrl(image)}
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

// Helper (reused)
const BASE_URL = '';
const getValidImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};
