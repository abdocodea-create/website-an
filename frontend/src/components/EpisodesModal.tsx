import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye } from 'lucide-react';
import EpisodeSkeleton from '@/components/skeleton/EpisodeSkeleton';

interface EpisodesModalProps {
    isOpen: boolean;
    onClose: () => void;
    episodes: any[];
    activeEpisodeNum: number;
    animeId: number;
    lang: string;
    isLoading?: boolean;
    getImageUrl: (path?: string) => string;
    getRelativeTime: (date: string, lang: string) => string;
}

export default function EpisodesModal({
    isOpen,
    onClose,
    episodes,
    activeEpisodeNum,
    animeId,
    lang,
    isLoading = false,
    getImageUrl,
    getRelativeTime,
}: EpisodesModalProps) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const activeEpisodeRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter episodes based on search
    const filteredEpisodes = useMemo(() => {
        if (!searchQuery) return episodes;
        const query = searchQuery.toLowerCase();
        return episodes.filter((ep: any) =>
            ep.title?.toLowerCase().includes(query) ||
            ep.title_en?.toLowerCase().includes(query) ||
            ep.episode_number.toString().includes(query)
        );
    }, [episodes, searchQuery]);

    // Show loading skeleton when modal first opens
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowLoading(true);
            const timer = setTimeout(() => {
                setShowLoading(false);
            }, 300); // Show skeleton for 300ms when opening
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Auto-scroll to active episode when modal opens
    useEffect(() => {
        if (isOpen && !showLoading && activeEpisodeRef.current && listRef.current && filteredEpisodes.length > 0) {
            setTimeout(() => {
                const element = activeEpisodeRef.current;
                const container = listRef.current;
                if (element && container) {
                    const top = element.offsetTop - container.offsetTop;
                    container.scrollTo({
                        top: Math.max(0, top),
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }, [isOpen, activeEpisodeNum, filteredEpisodes, showLoading]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 bg-white dark:bg-black border-gray-200 dark:border-[#222] rounded-none">
                <DialogHeader className="p-4 border-b border-gray-200 dark:border-[#222]">
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        {lang === 'ar' ? 'حلقات المسلسل' : 'Episodes'}
                    </DialogTitle>
                </DialogHeader>

                {/* Search Box */}
                <div className="p-4 pb-2 border-b border-gray-200 dark:border-[#222]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={lang === 'ar' ? 'بحث عن حلقة...' : 'Search episodes...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] pl-9 pr-4 py-2 text-sm outline-none focus:border-[#f47521] text-gray-900 dark:text-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Episodes List */}
                {(showLoading || isLoading) ? (
                    <EpisodeSkeleton
                        count={6}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pt-2 pb-4 overflow-y-auto custom-scrollbar"
                    />
                ) : (
                    <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pt-2 pb-4 overflow-y-auto custom-scrollbar">
                        {filteredEpisodes.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                {lang === 'ar' ? 'لا توجد حلقات' : 'No episodes found'}
                            </div>
                        ) : (
                            filteredEpisodes.map((ep: any) => (
                                <div
                                    key={ep.id}
                                    ref={Number(ep.episode_number) === Number(activeEpisodeNum) ? activeEpisodeRef : null}
                                    onClick={() => {
                                        navigate(`/${lang}/watch/${animeId}/${ep.episode_number}`);
                                        onClose();
                                    }}
                                    className="group cursor-pointer relative z-0"
                                >
                                    {/* Thumbnail Container */}
                                    <div className={`relative aspect-video overflow-hidden bg-gray-100 dark:bg-[#1c1c1c] mb-2 ${Number(ep.episode_number) === Number(activeEpisodeNum) ? 'ring-2 ring-[#f47521]' : ''}`}>
                                        <img
                                            src={getImageUrl(ep.thumbnail || ep.banner)}
                                            alt={ep.title}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />

                                        {/* Episode Number Badge (Top Left) */}
                                        <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold bg-black/80 text-white z-10">
                                            EP {ep.episode_number}
                                        </div>

                                        {/* Duration Badge (Bottom Right) */}
                                        <div className="absolute bottom-2 right-2 px-1 py-0.5 text-[10px] font-bold bg-black/80 text-white z-10">
                                            {ep.duration ? `${ep.duration}m` : '24m'}
                                        </div>

                                        {/* Play Indicator Overlay */}
                                        {Number(ep.episode_number) === Number(activeEpisodeNum) && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                                <Play className="w-8 h-8 text-white fill-white opacity-90" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata Below Card (Centered) */}
                                    <div className="space-y-1 px-1 text-center">
                                        <h4 className={`text-sm font-bold line-clamp-2 leading-tight ${Number(ep.episode_number) === Number(activeEpisodeNum) ? 'text-[#f47521]' : 'text-gray-900 dark:text-white'}`}>
                                            {(lang === 'ar' ? ep.title : ep.title_en) || `Episode ${ep.episode_number}`}
                                        </h4>

                                        {/* Episode Description / Subtext */}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                            {lang === 'ar' ? (ep.description || ep.description_en) : (ep.description_en || ep.description)}
                                        </p>

                                        {/* Meta Info */}
                                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
                                            <span>{getRelativeTime(ep.created_at || new Date().toISOString(), lang)}</span>
                                            {ep.views_count && (
                                                <>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        {ep.views_count}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
