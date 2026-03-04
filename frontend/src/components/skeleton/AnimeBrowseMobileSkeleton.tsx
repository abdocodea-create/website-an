import { cn } from '@/lib/utils';
import './AnimeBrowseMobileSkeleton.css';

interface SkeletonProps {
    type: 'episode' | 'anime' | 'browse-all';
    count?: number;
    className?: string;
}

export default function AnimeBrowseMobileSkeleton({ type, count = 6, className }: SkeletonProps) {
    return (
        <div className={cn(
            "browse-mobile-skeleton",
            type === 'episode' || type === 'browse-all' ? "list-mode" : "grid-mode",
            className
        )}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={cn(
                    "browse-mobile-card",
                    type === 'episode' || type === 'browse-all' ? "list" : "grid"
                )}>
                    <div className={cn(
                        "shimmer poster",
                        type === 'episode' && "episode",
                        type === 'browse-all' && "browse-all",
                        type === 'anime' && "anime"
                    )}></div>
                    <div className="info">
                        <div className="shimmer line"></div>
                        <div className="shimmer line short"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
