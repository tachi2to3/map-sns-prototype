import React from 'react';

export default function PostList({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    // ■ 全体の枠組み（ダークモード化）
    // bg-brand-dark (黒) を適用。なければ直接カラーコードを指定
    // backdrop-blur: すりガラス効果
    <div className="absolute bottom-0 left-0 w-full z-30 bg-[#1a1a1a]/95 backdrop-blur-md rounded-t-3xl shadow-2xl border-t border-[#Decbb7]/20 flex flex-col max-h-[40vh] transition-all duration-300">
      
      {/* ■ ヘッダー部分 */}
      <div className="p-4 bg-[#1a1a1a]/95 rounded-t-3xl sticky top-0 z-10 border-b border-[#Decbb7]/10 shrink-0">
        <div className="w-12 h-1.5 bg-[#Decbb7]/30 rounded-full mx-auto mb-3"></div>
        <h3 className="text-xs font-bold text-[#Decbb7] text-center uppercase tracking-widest">
          NEARBY RECORDS ({posts.length})
        </h3>
      </div>

      {/* ■ リスト部分 */}
      <div className="overflow-y-auto p-4 space-y-3 pb-8 scrollbar-thin scrollbar-thumb-[#Decbb7]/20">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center bg-white/5 p-3 rounded-xl border border-white/5 active:scale-98 transition-transform">
            {/* 画像サムネイル */}
            <img 
              src={post.imageUrl} 
              alt="" 
              className="w-12 h-12 rounded-lg object-cover border border-[#Decbb7]/20 shrink-0"
            />
            
            {/* テキスト情報 */}
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
        {/* 下部の余白（スクロールしやすくするため） */}
        <div className="h-4"></div>
      </div>
    </div>
  );
}