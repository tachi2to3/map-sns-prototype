import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../context/FollowContext';

export default function FollowButton({ targetUserId }) {
  const { currentUser } = useAuth();
  const { followingSet, toggleFollow } = useFollow();

  // 自分自身かどうかをチェック
  const isMe = currentUser?.uid === targetUserId;

  // Contextからフォロー状態を取得
  const isFollowing = followingSet.has(targetUserId);

  const handleToggleFollow = async (e) => {
    // 親要素へのクリック伝播を防ぐ（リストをクリックして詳細へ飛ぶのを防ぐため）
    e.stopPropagation();

    if (!currentUser || isMe) return;

    // Contextのフォロー操作を呼び出す
    await toggleFollow(targetUserId);
  };

  if (isMe || !currentUser) return null;

  return (
    <button
      onClick={handleToggleFollow}
      className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border transition-all z-20 relative ${
        isFollowing
          ? "border-[#Decbb7]/30 text-[#Decbb7]/50 bg-transparent"
          : "border-[#Decbb7] bg-[#Decbb7] text-[#1a1a1a] hover:bg-white hover:border-white shadow-[0_0_10px_rgba(222,203,183,0.2)]"
      }`}
    >
      {isFollowing ? "FOLLOWING" : "FOLLOW"}
    </button>
  );
}