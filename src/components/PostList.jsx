import React, { useState } from 'react';

export default function PostList({ posts, onOpenStateChange }) {
  const [isOpen, setIsOpen] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  if (!posts || posts.length === 0) return null;

  const MIN_SWIPE_DISTANCE = 50;

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > MIN_SWIPE_DISTANCE;
    const isDownSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isUpSwipe && !isOpen) {
      setIsOpen(true);
      onOpenStateChange?.(true);
    }
    if (isDownSwipe && isOpen) {
      setIsOpen(false);
      onOpenStateChange?.(false);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    onOpenStateChange?.(!isOpen);
  };

  return (
    <div
      className={`absolute bottom-0 left-0 w-full z-30 bg-[#1a1a1a]/95 backdrop-blur-md rounded-t-3xl shadow-2xl border-t border-[#Decbb7]/20 flex flex-col transition-all duration-300 ease-out ${
        isOpen ? 'max-h-[40vh]' : 'max-h-[72px]'
      }`}
    >
      <div
        className="p-4 bg-[#1a1a1a]/95 rounded-t-3xl sticky top-0 z-10 border-b border-[#Decbb7]/10 shrink-0 cursor-pointer"
        onClick={toggleOpen}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-[#Decbb7]/30 rounded-full mx-auto mb-3"></div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#Decbb7] uppercase tracking-widest">
            NEARBY RECORDS ({posts.length})
          </h3>
          <svg
            className={`w-5 h-5 text-[#Decbb7] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="overflow-y-auto p-4 space-y-3 pb-8 scrollbar-thin scrollbar-thumb-[#Decbb7]/20">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center bg-white/5 p-3 rounded-xl border border-white/5 active:scale-98 transition-transform">
              <img
                src={post.imageUrl}
                alt=""
                className="w-12 h-12 rounded-lg object-cover border border-[#Decbb7]/20 shrink-0"
              />
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-bold text-[#Decbb7] truncate">
                  {post.caption}
                </p>
                <p className="text-xs text-[#Decbb7]/60 truncate mt-1">
                  by {post.username}
                </p>
              </div>
            </div>
          ))}
          <div className="h-4"></div>
        </div>
      )}
    </div>
  );
}
