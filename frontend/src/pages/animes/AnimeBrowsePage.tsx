import { useState, useEffect, useRef } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Search, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AnimeHoverCard from "@/components/AnimeHoverCard";
import CrunchyrollSkeleton from "@/components/skeleton/CrunchyrollSkeleton";
import EpisodeSkeleton from "@/components/skeleton/EpisodeSkeleton";

const BASE_URL = '';

const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function AnimeBrowsePage() {
    const { i18n } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Simulate initial loading to match Vue
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const seoTitle = i18n.language === 'ar' ? 'الرئيسية - AnimeLast' : 'Home - AnimeLast';

    return (
        <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
            <Helmet>
                <title>{seoTitle}</title>
            </Helmet>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[80vh]">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    {/* Placeholder for Hero/News Slider if needed, skipping for now as per minimal request */}

                    <div className="max-w-6xl mx-auto px-2 sm:px-6 md:px-8 py-8">

                        {/* Latest Episodes Section */}
                        <Section
                            title={i18n.language === 'ar' ? 'أحدث الحلقات' : 'Latest Episodes'}
                            endpoint="/episodes/latest"
                            type="episode"
                            limit={15}
                            showSearch={true}
                            search={search}
                            setSearch={setSearch}
                            lang={i18n.language}
                        />

                        {/* Latest Animes Section */}
                        <Section
                            title={i18n.language === 'ar' ? 'أحدث الأنميات' : 'Latest Animes'}
                            endpoint="/animes/latest"
                            type="anime"
                            limit={12}
                            showLink={true}
                            linkTarget="/animes"
                            lang={i18n.language}
                        />

                        {/* Movies Section */}
                        <Section
                            title={i18n.language === 'ar' ? 'أفلام مختارة' : 'Selected Movies'}
                            endpoint="/animes/type/Movie"
                            type="movie"
                            limit={12}
                            showLink={true}
                            linkTarget="/movies"
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

                    </div>

                    {/* Footer - Matching Vue */}
                    <footer className="border-t border-gray-200 dark:border-[#2a2a2a] mt-12 py-8 text-center bg-gray-50 dark:bg-black">
                        <div className="flex flex-col items-center gap-6">
                            <h2 className="text-2xl font-black text-green-500">ANIME LAST</h2>
                            <p className="text-xs text-gray-500">© 2025 Anime Last. All rights reserved.</p>
                        </div>
                    </footer>
                </div>
            )}
        </div>
    );
}

const Section = ({ title, endpoint, type, limit, showSearch, search, setSearch, showLink, linkTarget, lang }: any) => {
    const { elementRef, hasIntersected } = useIntersectionObserver({ threshold: 0.1 });

    // Hover state management
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

    const { data: items, isLoading: isQueryLoading } = useQuery({
        queryKey: [endpoint, limit],
        queryFn: async () => (await api.get(endpoint, { params: { limit } })).data,
        enabled: hasIntersected,
        staleTime: 5 * 60 * 1000,
    });

    const isLoading = !hasIntersected || isQueryLoading;

    return (
        <section className="mb-10" ref={elementRef as React.RefObject<HTMLDivElement>}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>

                {showSearch && (
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2 cursor-pointer" style={{ right: lang === 'ar' ? 'unset' : '0.75rem', left: lang === 'ar' ? '0.75rem' : 'unset' }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            type="text"
                            placeholder={lang === 'ar' ? "بحث..." : "Search..."}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-[#f47521] transition-colors"
                        />
                    </div>
                )}

                {showLink && (
                    <Link to={linkTarget} className="text-sm text-[#f47521] hover:text-[#ff8c42] transition-colors">
                        {lang === 'ar' ? 'عرض الكل' : 'View All'}
                    </Link>
                )}
            </div>

            {isLoading ? (
                type === 'episode' ? <EpisodeSkeleton count={limit} /> : <CrunchyrollSkeleton count={limit} />
            ) : items?.length > 0 ? (
                <div className={`grid ${type === 'episode' ? 'grid-cols-2' : 'grid-cols-2'} sm:grid-cols-3 md:grid-cols-4 ${type === 'episode' ? 'lg:grid-cols-4 xl:grid-cols-4' : 'lg:grid-cols-5 xl:grid-cols-6'} ${type === 'episode' ? 'gap-1 md:gap-6' : 'gap-2 md:gap-6'} relative z-0`}>
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
            ) : (
                <div className="text-center py-10 text-gray-500">No content found</div>
            )}
        </section>
    );
};

const CardItem = ({ item, index, type, lang, isHovered, onMouseEnter, onMouseLeave, keepCardOpen }: any) => {
    const navigate = useNavigate();
    const isEpisode = type === 'episode';
    // Logic matching Vue
    const image = isEpisode ? item.banner || item.image : item.image || item.cover;
    const title = lang === 'ar' ? (item.title || item.series?.title) : (item.title_en || item.series?.title_en || item.title);

    // For episodes, format needs to assume structure
    const displayTitle = title || 'عنوان غير متوفر';
    const subText = isEpisode ? (item.title || `الحلقة ${item.episode_number}`) : (item.status || 'مستمر');

    const year = new Date(item.created_at || Date.now()).getFullYear();

    const handleCardClick = () => {
        if (isEpisode) {
            // Updated to route to WatchPage: /watch/:animeId/:episodeNum
            // Assuming item.anime_id exists for episodes, or item.series.id
            const animeId = item.anime_id || item.series?.id || item.series_id;
            navigate(`/${lang}/watch/${animeId}/${item.episode_number}`);
        } else {
            navigate(`/${lang}/animes/${item.id}`);
        }
    };

    return (
        <div
            className="group cursor-pointer relative z-0"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={handleCardClick}
        >
            {/* Cover Container */}
            <div className={`relative ${isEpisode ? 'aspect-video' : 'aspect-[2/3]'} overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] mb-1`}>
                <img
                    src={getImageUrl(image)}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />

                {/* Badges */}
                <div className={`absolute top-2 left-2 px-2 py-0.5 text-xs font-bold text-white z-10 ${isEpisode ? 'bg-black/80' : 'bg-black/80'}`}>
                    {isEpisode ? item.episode_number : (item.type === 'tv' ? 'مسلسل' : 'فيلم')}
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
                <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                    {displayTitle}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {subText}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                    {!isEpisode && (
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{item.rating || 'N/A'}</span>
                        </div>
                    )}
                    <span className="text-gray-600">•</span>
                    <span>{year}</span>
                </div>
            </div>

            {/* Hover Card Component - Covers full card with gradient */}
            {isHovered && (
                <div className="absolute inset-0 z-50">
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
