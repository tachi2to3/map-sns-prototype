import React from 'react';

export default function PostList({ posts }) {
  // 投稿がない場合は何も表示しない
  if (!posts || posts.length === 0) return null;

  return (
    // ■ 全体の枠組み
    // absolute bottom-0 left-0: 親要素(Mapのdiv)の左下に絶対配置
    // w-full: 横幅いっぱい
    // z-30: 地図より手前
    // max-h-[40vh]: 高さの上限を画面の40%に制限（これ以上は伸びない）
    <div className="absolute bottom-0 left-0 w-full z-30 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex flex-col max-h-[40vh] border-t border-gray-100">
      
      {/* ■ ヘッダー部分（引き手） */}
      {/* sticky top-0: スクロールしてもここは常に上に張り付く */}
      <div className="p-3 bg-white rounded-t-3xl sticky top-0 z-10 border-b border-gray-50 shrink-0">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2"></div>
        <h3 className="text-xs font-bold text-gray-500 text-center uppercase tracking-wider">
          近くの記録 ({posts.length})
        </h3>
      </div>

      {/* ■ リスト部分 */}
      {/* overflow-y-auto: 投稿が多いときはここだけスクロールする */}
      <div className="overflow-y-auto p-4 space-y-3 bg-gray-50/50 pb-8">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            {/* 画像サムネイル */}
            {/* shrink-0: 画像が潰れないように固定 */}
            <img 
              src={post.imageUrl} 
              alt="" 
              className="w-12 h-12 rounded-lg object-cover bg-gray-200 border border-gray-100 shrink-0"
            />
            
            {/* テキスト情報 */}
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">
                {post.caption}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                by {post.username}
              </p>
            </div>
            
            {/* ★修正: 矢印アイコンを削除しました */}
          </div>
        ))}
      </div>
    </div>
  );
}