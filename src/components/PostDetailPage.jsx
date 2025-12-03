import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, deleteDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function PostDetailPage() {
  const { id } = useParams(); // URLからIDを取得
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likes, setLikes] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // 投稿データの取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
          navigate('/');
        }
      } catch (e) {
        console.error("Error fetching post:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  // いいね・コメントのリアルタイム監視
  useEffect(() => {
    if (!id) return;

    // いいね
    const unsubscribeLikes = onSnapshot(collection(db, 'posts', id, 'likes'), (snapshot) => {
      const likesData = snapshot.docs.map(doc => doc.id);
      setLikes(likesData);
      setIsLiked(currentUser ? likesData.includes(currentUser.uid) : false);
    });

    // コメント
    const q = query(collection(db, 'posts', id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeLikes();
      unsubscribeComments();
    };
  }, [id, currentUser]);

  const toggleLike = async () => {
    if (!currentUser) return;
    const likeRef = doc(db, 'posts', id, 'likes', currentUser.uid);
    if (isLiked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() });
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addDoc(collection(db, 'posts', id, 'comments'), {
      text: newComment,
      userId: currentUser.uid,
      username: currentUser.displayName || "名無し",
      createdAt: serverTimestamp(),
    });
    setNewComment("");
  };

  if (loading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-[#Decbb7]">Loading...</div>;
  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#Decbb7] flex flex-col font-sans">
      {/* ヘッダー */}
      <div className="h-16 flex items-center px-4 border-b border-[#Decbb7]/20 bg-[#1a1a1a] sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-lg ml-2 tracking-wider font-display">RECORD</h1>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* 画像 */}
        <div className="w-full bg-black">
          <img src={post.imageUrl} alt="" className="w-full max-h-[60vh] object-contain mx-auto" />
        </div>

        <div className="p-6 space-y-6">
          {/* キャプション・ユーザー */}
          <div>
            <div className="flex justify-between items-start mb-2 text-xs text-[#Decbb7]/60 font-sans">
              <span className="flex items-center gap-1">
                📍 {post.locationSource || "Location info"}
              </span>
              <span>by {post.username}</span>
            </div>
            <p className="text-lg font-bold leading-relaxed whitespace-pre-wrap">{post.caption}</p>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center space-x-6 border-y border-[#Decbb7]/10 py-4">
            <button onClick={toggleLike} className="flex items-center space-x-2 group">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-colors ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-[#Decbb7] group-hover:text-pink-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill={isLiked ? "currentColor" : "none"}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-lg font-bold font-display">{likes.length}</span>
            </button>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#Decbb7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-lg font-bold font-display">{comments.length}</span>
            </div>
          </div>

          {/* コメント一覧 */}
          <div>
            <h3 className="text-sm font-bold text-[#Decbb7]/50 mb-4 font-display tracking-widest">COMMENTS</h3>
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-[#Decbb7]/50 font-bold block mb-1">{comment.username}</span>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-[#Decbb7]/30 italic text-center py-4">No comments yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* コメント入力フォーム */}
      <div className="fixed bottom-0 left-0 w-full bg-[#1a1a1a]/95 backdrop-blur-md border-t border-[#Decbb7]/20 p-4 pb-safe">
        <form onSubmit={sendComment} className="flex items-center space-x-3 max-w-md mx-auto">
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..." 
            className="flex-1 bg-white/10 text-[#Decbb7] rounded-full px-5 py-3 text-sm focus:outline-none focus:bg-white/15 transition placeholder-[#Decbb7]/30 border border-transparent focus:border-[#Decbb7]/30"
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()}
            className="text-[#Decbb7] font-bold text-sm disabled:opacity-30 px-3 hover:text-white transition"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
}