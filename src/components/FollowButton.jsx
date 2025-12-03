import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function FollowButton({ targetUserId }) {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMe, setIsMe] = useState(false);

  useEffect(() => {
    if (!currentUser || !targetUserId) return;

    if (currentUser.uid === targetUserId) {
      setIsMe(true);
      return;
    }

    // リアルタイムでフォロー状態を監視
    const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid, "following", targetUserId), (docSnap) => {
      setIsFollowing(docSnap.exists());
    });

    return () => unsubscribe();
  }, [currentUser, targetUserId]);

  const toggleFollow = async (e) => {
    // 親要素へのクリック伝播を防ぐ（リストをクリックして詳細へ飛ぶのを防ぐため）
    e.stopPropagation(); 
    
    if (!currentUser || isMe) return;

    const myFollowingRef = doc(db, "users", currentUser.uid, "following", targetUserId);
    const userFollowersRef = doc(db, "users", targetUserId, "followers", currentUser.uid);

    if (isFollowing) {
      // フォロー解除
      await deleteDoc(myFollowingRef);
      await deleteDoc(userFollowersRef);
    } else {
      // フォロー登録
      await setDoc(myFollowingRef, { createdAt: serverTimestamp() });
      await setDoc(userFollowersRef, { createdAt: serverTimestamp() });
    }
  };

  if (isMe || !currentUser) return null;

  return (
    <button
      onClick={toggleFollow}
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