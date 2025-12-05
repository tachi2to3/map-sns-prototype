// src/context/FollowContext.jsx
import React, { useContext, useState, useEffect, createContext } from "react";
import { db } from "../firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./AuthContext";

// Contextの作成
const FollowContext = createContext();

// カスタムフック：各コンポーネントでフォロー状態を取得・操作するために使用
export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
}

// Providerコンポーネント：アプリ全体をこれで囲む
export function FollowProvider({ children }) {
  const { currentUser } = useAuth();
  const [followingSet, setFollowingSet] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // 1つのonSnapshotでフォロー中リストを監視
  useEffect(() => {
    if (!currentUser) {
      // ログインしていない場合は空のSetを設定してローディング完了
      setFollowingSet(prevSet => prevSet.size === 0 ? prevSet : new Set());
      setLoading(prevLoading => prevLoading ? false : prevLoading);
      return;
    }

    console.log("FollowContext: Start monitoring following list...");

    const unsubscribe = onSnapshot(
      collection(db, "users", currentUser.uid, "following"),
      (snapshot) => {
        const ids = snapshot.docs.map(doc => doc.id);
        setFollowingSet(new Set(ids));
        setLoading(prevLoading => prevLoading ? false : prevLoading);
        console.log(`FollowContext: Following list updated (${ids.length} users)`);
      },
      (error) => {
        console.error("FollowContext: Error monitoring following list:", error);
        setLoading(prevLoading => prevLoading ? false : prevLoading);
      }
    );

    return () => {
      console.log("FollowContext: Cleanup following list listener");
      unsubscribe();
    };
  }, [currentUser]);

  // フォロー/アンフォロー操作
  const toggleFollow = async (targetUserId) => {
    if (!currentUser) {
      console.error("FollowContext: No current user");
      return;
    }

    if (currentUser.uid === targetUserId) {
      console.error("FollowContext: Cannot follow yourself");
      return;
    }

    // 楽観的UI更新（即座にUIを更新）
    const newSet = new Set(followingSet);
    const isCurrentlyFollowing = newSet.has(targetUserId);

    if (isCurrentlyFollowing) {
      newSet.delete(targetUserId);
    } else {
      newSet.add(targetUserId);
    }

    // 即座に状態を更新
    const previousSet = new Set(followingSet);
    setFollowingSet(newSet);

    // Firestoreへの書き込み
    const myFollowingRef = doc(db, "users", currentUser.uid, "following", targetUserId);
    const userFollowersRef = doc(db, "users", targetUserId, "followers", currentUser.uid);

    try {
      if (isCurrentlyFollowing) {
        // フォロー解除
        console.log(`FollowContext: Unfollowing user ${targetUserId}`);
        await deleteDoc(myFollowingRef);
        await deleteDoc(userFollowersRef);
      } else {
        // フォロー登録
        console.log(`FollowContext: Following user ${targetUserId}`);
        await setDoc(myFollowingRef, { createdAt: serverTimestamp() });
        await setDoc(userFollowersRef, { createdAt: serverTimestamp() });
      }
    } catch (error) {
      // エラー時はロールバック
      console.error("FollowContext: Follow operation failed:", error);
      setFollowingSet(previousSet);

      // エラーメッセージを表示（オプション：今後エラー通知機能を追加する場合に使用）
      alert(`フォロー操作に失敗しました: ${error.message}`);
    }
  };

  // Contextとして提供する値
  const value = {
    followingSet,
    toggleFollow,
    isFollowing: (targetUserId) => followingSet.has(targetUserId),
  };

  // ログイン前はローディングを表示しない（AuthContextで既に表示されているため）
  if (loading && currentUser) {
    return null; // 一瞬のローディング状態はスキップ
  }

  return (
    <FollowContext.Provider value={value}>
      {children}
    </FollowContext.Provider>
  );
}
