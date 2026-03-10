import React, { useRef } from 'react';

interface QuickEmojiRowProps {
    onEmojiClick: (emojiUrl: string) => void;
}

// Generate a limited pool of 30 emojis as requested
const QUICK_EMOJIS = [
    '/custom-emojis/unnamed.png',
    '/custom-emojis/unnamed(1).jpg',
    ...Array.from({ length: 28 }, (_, i) => `/custom-emojis/unnamed(${i + 2}).png`)
];

export const QuickEmojiRow: React.FC<QuickEmojiRowProps> = ({ onEmojiClick }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative group/emoji-row">
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
            <div
                ref={scrollRef}
                className="hide-scrollbar max-w-[520px] flex items-center gap-0.5 overflow-x-auto py-1 px-1 select-none h-14 pb-1 cursor-grab active:cursor-grabbing touch-pan-x"
                onMouseDown={(e) => {
                    const ele = scrollRef.current;
                    if (!ele) return;
                    let isDown = true;
                    let startX = e.pageX - ele.offsetLeft;
                    let scrollLeft = ele.scrollLeft;

                    const mouseMoveHandler = (e: MouseEvent) => {
                        if (!isDown) return;
                        e.preventDefault();
                        const x = e.pageX - ele.offsetLeft;
                        const walk = (x - startX) * 2.5; // Scroll-fast
                        ele.scrollLeft = scrollLeft - walk;
                    };

                    const mouseUpHandler = () => {
                        isDown = false;
                        ele.removeEventListener('mousemove', mouseMoveHandler);
                        ele.removeEventListener('mouseup', mouseUpHandler);
                        ele.removeEventListener('mouseleave', mouseUpHandler);
                    };

                    ele.addEventListener('mousemove', mouseMoveHandler);
                    ele.addEventListener('mouseup', mouseUpHandler);
                    ele.addEventListener('mouseleave', mouseUpHandler);
                }}
            >
                {QUICK_EMOJIS.map((url, idx) => (
                    <button
                        key={idx}
                        onClick={() => onEmojiClick(url)}
                        className="flex-shrink-0 w-[42px] h-[42px] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-md transition-all active:scale-95"
                    >
                        <img
                            src={url}
                            alt={`emoji-${idx}`}
                            className="w-full h-full object-contain p-1.5 scale-95 pointer-events-none drag-none select-none"
                            loading="lazy"
                            draggable="false"
                        />
                    </button>
                ))}
            </div>
        </div >
    );
};
