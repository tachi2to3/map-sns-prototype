import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
// getDoc, doc を追加（ユーザー詳細取得のため）
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import FollowButton from './FollowButton';

export default function Profile({ onClose }) {
  const { currentUser } = useAuth();
  
  // ★追加: タブ切り替え用の状態管理
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'followers' | 'following'
  
  const [myPosts, setMyPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ★追加: プロフィール画像変更用のrefなどは今回は省略（前回のコードと組み合わせる場合は残してください）
  // シンプルにリスト機能の復活に焦点を当てます

  useEffect(() => {
    if (!currentUser) return;

    // 1. 自分の投稿
    const q = query(
      collection(db, "posts"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyPosts(postsData);
      setIsLoading(false);
    });

    // 2. フォロワー一覧の取得
    const unsubscribeFollowers = onSnapshot(collection(db, "users", currentUser.uid, "followers"), async (snap) => {
      const uids = snap.docs.map(d => d.id);
      if (uids.length > 0) {
        // IDリストからユーザー情報を並列取得
        const userPromises = uids.map(uid => getDoc(doc(db, "users", uid)));
        const userSnaps = await Promise.all(userPromises);
        const usersData = userSnaps
          .filter(docSnap => docSnap.exists())
          .map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
        setFollowers(usersData);
      } else {
        setFollowers([]);
      }
    });

    // 3. フォロー中一覧の取得
    const unsubscribeFollowing = onSnapshot(collection(db, "users", currentUser.uid, "following"), async (snap) => {
      const uids = snap.docs.map(d => d.id);
      if (uids.length > 0) {
        const userPromises = uids.map(uid => getDoc(doc(db, "users", uid)));
        const userSnaps = await Promise.all(userPromises);
        const usersData = userSnaps
          .filter(docSnap => docSnap.exists())
          .map(docSnap => ({ uid: docSnap.id, ...docSnap.data() }));
        setFollowing(usersData);
      } else {
        setFollowing([]);
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [currentUser]);

  // ★追加: ユーザーリスト表示用コンポーネント
  const UserList = ({ users, emptyMessage }) => (
    <div className="space-y-3">
      {users.length > 0 ? (
        users.map(user => (
          <div key={user.uid} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border border-[#Decbb7]/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                  <span className="text-white/50 text-xs font-bold">{user.username?.charAt(0) || "?"}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white/90">{user.username || "Guest"}</span>
              </div>
            </div>
            <div className="transform scale-90">
              <FollowButton targetUserId={user.uid} />
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
          <p className="text-sm text-white/30">{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#121212] shadow-2xl animate-slideInRight border-l border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-display font-bold text-white tracking-wider">PROFILE</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pb-safe">
          <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-white/5">
            <div className="flex items-center mb-6">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-20 h-20 rounded-full border-2 border-[#Decbb7] object-cover shadow-[0_0_20px_rgba(222,203,183,0.2)]" />
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

            {/* ★修正: タブ切り替えボタンとして実装 */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`p-3 rounded-xl text-center border transition-all ${
                  activeTab === 'posts' ? 'bg-[#Decbb7]/10 border-[#Decbb7]/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <p className={`text-xl font-display font-bold ${activeTab === 'posts' ? 'text-[#Decbb7]' : 'text-white/90'}`}>
                  {myPosts.length}
                </p>
                <p className="text-[10px] text-white/40 font-sans tracking-wider uppercase">Records</p>
              </button>
              
              <button 
                onClick={() => setActiveTab('followers')}
                className={`p-3 rounded-xl text-center border transition-all ${
                  activeTab === 'followers' ? 'bg-[#Decbb7]/10 border-[#Decbb7]/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <p className={`text-xl font-display font-bold ${activeTab === 'followers' ? 'text-[#Decbb7]' : 'text-white/90'}`}>
                  {followers.length}
                </p>
                <p className="text-[10px] text-white/40 font-sans tracking-wider uppercase">Followers</p>
              </button>

              <button 
                onClick={() => setActiveTab('following')}
                className={`p-3 rounded-xl text-center border transition-all ${
                  activeTab === 'following' ? 'bg-[#Decbb7]/10 border-[#Decbb7]/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <p className={`text-xl font-display font-bold ${activeTab === 'following' ? 'text-[#Decbb7]' : 'text-white/90'}`}>
                  {following.length}
                </p>
                <p className="text-[10px] text-white/40 font-sans tracking-wider uppercase">Following</p>
              </button>
            </div>
          </div>

          <div className="p-6 min-h-[300px]">
            <h4 className="text-sm font-bold text-white/50 mb-4 font-display tracking-widest uppercase">
              {activeTab === 'posts' && 'My Records'}
              {activeTab === 'followers' && 'Followers List'}
              {activeTab === 'following' && 'Following List'}
            </h4>

            {/* 1. 投稿一覧 */}
            {activeTab === 'posts' && (
              isLoading ? (
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
              )
            )}

            {/* 2. フォロワー一覧 */}
            {activeTab === 'followers' && (
              <UserList users={followers} emptyMessage="No followers yet" />
            )}

            {/* 3. フォロー中一覧 */}
            {activeTab === 'following' && (
              <UserList users={following} emptyMessage="Not following anyone yet" />
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