import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function Profile({ onClose }) {
  const { currentUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "posts"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyPosts(postsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">プロフィール</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center mb-4">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-white shadow-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-800">{currentUser?.displayName || "名無し"}</h3>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                <p className="text-2xl font-bold text-blue-600">{myPosts.length}</p>
                <p className="text-xs text-gray-500">投稿数</p>
              </div>
              <div className="bg-white p-3 rounded-lg text-center shadow-sm">
                <p className="text-2xl font-bold text-purple-600">0</p>
                <p className="text-xs text-gray-500">フォロワー</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h4 className="text-sm font-bold text-gray-600 mb-3">あなたの投稿</h4>
            {isLoading ? (
              <p className="text-sm text-gray-400">読み込み中...</p>
            ) : myPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {myPosts.map(post => (
                  <img
                    key={post.id}
                    src={post.imageUrl}
                    alt=""
                    className="aspect-square object-cover rounded-lg"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">まだ投稿がありません</p>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => auth.signOut()}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
