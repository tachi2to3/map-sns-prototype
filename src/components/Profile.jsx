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
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#121212] shadow-2xl animate-slideInRight border-l border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-display font-bold text-white tracking-wider">PROFILE</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-white/5">
            <div className="flex items-center mb-6">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-20 h-20 rounded-full border-2 border-[#Decbb7] shadow-[0_0_20px_rgba(222,203,183,0.2)]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="ml-4">
                <h3 className="text-lg font-bold text-white font-display">{currentUser?.displayName || "Guest User"}</h3>
                <p className="text-sm text-white/40 font-sans">{currentUser?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                <p className="text-2xl font-display font-bold text-[#Decbb7]">{myPosts.length}</p>
                <p className="text-xs text-white/40 font-sans tracking-wider uppercase">Records</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                <p className="text-2xl font-display font-bold text-white/50">0</p>
                <p className="text-xs text-white/40 font-sans tracking-wider uppercase">Followers</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-sm font-bold text-white/50 mb-4 font-display tracking-widest uppercase">My Records</h4>
            {isLoading ? (
              <p className="text-sm text-white/30">Loading...</p>
            ) : myPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {myPosts.map(post => (
                  <div key={post.id} className="relative aspect-square group overflow-hidden rounded-md bg-white/5">
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                <p className="text-sm text-white/30">No records yet</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/10">
            <button
              onClick={() => auth.signOut()}
              className="w-full py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold rounded-xl transition-colors font-display tracking-wide"
            >
              LOG OUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
