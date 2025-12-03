import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, doc, deleteDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ★追加: 個別の投稿アイテムコンポーネント（いいね・コメント機能付き）
const PostListItem = ({ post }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // リアルタイム監視
  useEffect(() => {
    // いいね監視
    const unsubscribeLikes = onSnapshot(collection(db, 'posts', post.id, 'likes'), (snapshot) => {
      const likesData = snapshot.docs.map(doc => doc.id);
      setLikes(likesData);
      setIsLiked(currentUser ? likesData.includes(currentUser.uid) : false);
    });
    // コメント数監視
    const unsubscribeComments = onSnapshot(collection(db, 'posts', post.id, 'comments'), (snapshot) => {
      setCommentCount(snapshot.size);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [post.id, currentUser]);

  // いいね切り替え処理
  const toggleLike = async (e) => {
    e.stopPropagation(); // ★重要: これがないとクリック時に詳細ページへ飛んでしまう
    if (!currentUser) return;

    const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
    if (isLiked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() });
    }
  };

  return (
    <motion.div
      onClick={() => navigate(`/post/${post.id}`)}
      variants={{
        open: { opacity: 1, y: 0 },
        closed: { opacity: 0, y: 20 }
      }}
      className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex p-3 gap-4">
        {/* サムネイル */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-800">
          <img
            src={post.imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        
        {/* コンテンツ */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <h4 className="text-white font-medium leading-snug line-clamp-1 mb-0.5">
              {post.caption}
            </h4>
            <span className="text-xs text-white/40 font-sans">
              by {post.username}
            </span>
          </div>

          {/* ★修正: VIEWボタンを削除し、いいね・コメント数を表示 */}
          <div className="flex items-center gap-4 mt-2">
            {/* いいねボタン */}
            <button 
              onClick={toggleLike}
              className="flex items-center gap-1.5 group/btn"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`w-5 h-5 transition-colors ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-[#Decbb7] group-hover/btn:text-pink-400'}`} 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                fill={isLiked ? "currentColor" : "none"}
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs font-display text-[#Decbb7] font-bold">{likes.length}</span>
            </button>

            {/* コメント数表示（クリック機能なし） */}
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#Decbb7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs font-display text-[#Decbb7] font-bold">{commentCount}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function PostList({ posts, onOpenStateChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const collapsedHeight = 80;
  const expandedHeight = '80vh'; 

  if (!posts || posts.length === 0) return null;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    onOpenStateChange?.(!isOpen);
  };

  return (
    <>
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
        <div className={cn(
          "relative w-full h-full flex flex-col",
          "bg-[#121212]/90 backdrop-blur-xl",
          "border-t border-white/10",
          "rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
          "overflow-hidden"
        )}>
          
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
          />

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
                 // ★修正: リストアイテムを独立したコンポーネントに変更
                 <PostListItem key={post.id} post={post} />
               ))}
             </motion.div>
          </div>

        </div>
      </motion.div>
    </>
  );
}