import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function PostDetail({ post }) {
  const { currentUser } = useAuth();
  const [likes, setLikes] = useState([]); // いいねした人のリスト
  const [comments, setComments] = useState([]); // コメントのリスト
  const [newComment, setNewComment] = useState(""); // 入力中のコメント
  const [isLiked, setIsLiked] = useState(false); // 自分がいいねしたか

  // ■■■ いいね機能の処理 ■■■

  // 1. リアルタイムで「いいね」データを監視
  useEffect(() => {
    // 投稿の下にある 'likes' というサブコレクションを監視します
    // ドキュメントIDをユーザーIDにすることで、重複いいねを防ぎます
    const unsubscribe = onSnapshot(collection(db, 'posts', post.id, 'likes'), (snapshot) => {
      const likesData = snapshot.docs.map(doc => doc.id); // ユーザーIDの配列
      setLikes(likesData);
      // 自分のIDが含まれていれば「いいね済み」とする
      setIsLiked(currentUser ? likesData.includes(currentUser.uid) : false);
    });
    return () => unsubscribe();
  }, [post.id, currentUser]);

  // 2. いいねボタンを押した時の処理
  const toggleLike = async () => {
    if (!currentUser) return;
    // 自分のIDをドキュメント名にした参照を作成
    const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
    if (isLiked) {
      // 既にいいねしていれば削除（いいね解除）
      await deleteDoc(likeRef);
    } else {
      // していなければ追加（いいね！）
      await setDoc(likeRef, { createdAt: serverTimestamp() });
    }
  };

  // ■■■ コメント機能の処理 ■■■

  // 3. リアルタイムで「コメント」データを監視
  useEffect(() => {
    // 投稿の下にある 'comments' サブコレクションを古い順で取得
    const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [post.id]);

  // 4. コメント送信ボタンを押した時の処理
  const sendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    // 'comments' コレクションに新しいコメントを追加
    await addDoc(collection(db, 'posts', post.id, 'comments'), {
      text: newComment,
      userId: currentUser.uid,
      username: currentUser.displayName || "名無し",
      createdAt: serverTimestamp(),
    });
    setNewComment(""); // 入力欄を空にする
  };

  // ■■■ 表示部分 (UI) ■■■
  return (
    <div className="max-w-sm">
      {/* 写真とキャプション */}
      <img src={post.imageUrl} alt="memory" className="w-full h-48 object-cover rounded-lg mb-3" />
      <p className="text-lg font-bold text-gray-800">{post.caption}</p>
      <p className="text-sm text-gray-500 text-right mb-4">by {post.username}</p>

      {/* いいねボタンエリア */}
      <div className="flex items-center mb-4 border-t border-b border-gray-100 py-2">
        <button 
          onClick={toggleLike} 
          className={`flex items-center mr-4 focus:outline-none transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-bold">{likes.length}</span>
        </button>
      </div>

      {/* コメントエリア */}
      <div className="mb-4">
        <h4 className="font-bold text-gray-700 mb-2">コメント ({comments.length})</h4>
        {/* コメント一覧表示 */}
        <div className="max-h-40 overflow-y-auto space-y-2 mb-3 p-1">
          {comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 p-2 rounded text-sm">
              <span className="font-bold mr-2">{comment.username}:</span>
              <span>{comment.text}</span>
            </div>
          ))}
          {comments.length === 0 && <p className="text-gray-400 text-sm">まだコメントはありません</p>}
        </div>

        {/* コメント入力フォーム */}
        <form onSubmit={sendComment} className="flex">
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを追加..." 
            className="flex-grow border border-gray-300 rounded-l px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-r text-sm font-bold hover:bg-blue-600 disabled:bg-gray-300"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
}