import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function PostList({ posts, onOpenStateChange }) {
  const [isOpen, setIsOpen] = useState(false); // Default closed for a cleaner start
  
  // 画面の高さに基づくスナップポイント
  const collapsedHeight = 80;
  const expandedHeight = '80vh'; 

  if (!posts || posts.length === 0) return null;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    onOpenStateChange?.(!isOpen);
  };

  return (
    <>
      {/* Backdrop for expanded state (optional, adds focus) */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 z-20 backdrop-blur-[1px]"
        />
      )}

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30 flex flex-col"
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { height: expandedHeight },
          closed: { height: collapsedHeight }
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {/* Glassmorphism Container */}
        <div className={cn(
          "relative w-full h-full flex flex-col",
          "bg-[#121212]/90 backdrop-blur-xl",
          "border-t border-white/10",
          "rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
          "overflow-hidden"
        )}>
          
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
          />

          {/* Handle / Header Area */}
          <motion.div 
            className="w-full pt-5 pb-4 px-6 shrink-0 cursor-grab active:cursor-grabbing z-10"
            onTap={toggleOpen}
          >
            <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="font-display font-bold text-2xl text-[#Decbb7] tracking-tight">
                  NEARBY
                </h3>
                <span className="font-display text-white/40 text-sm font-light">
                   / {posts.length} RECORDS
                </span>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-[#Decbb7]"
              >
                 <svg
                  className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            </div>
          </motion.div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-safe scrollbar-hide">
             <motion.div 
              variants={{
                open: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                closed: { transition: { staggerChildren: 0.01, staggerDirection: -1 } }
              }}
              initial="closed"
              animate={isOpen ? "open" : "closed"}
              className="space-y-3 pb-8"
             >
               {posts.map((post) => (
                 <motion.div
                   key={post.id}
                   variants={{
                     open: { opacity: 1, y: 0 },
                     closed: { opacity: 0, y: 20 }
                   }}
                   className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                 >
                    <div className="flex p-3 gap-4">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-800">
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-white font-medium leading-snug line-clamp-2 mb-1">
                          {post.caption}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-white/40 font-sans">
                            by {post.username}
                          </span>
                          <span className="text-[10px] font-display text-[#Decbb7] px-2 py-1 rounded-full bg-[#Decbb7]/10 border border-[#Decbb7]/20">
                            VIEW
                          </span>
                        </div>
                      </div>
                    </div>
                 </motion.div>
               ))}
             </motion.div>
          </div>

        </div>
      </motion.div>
    </>
  );
}

