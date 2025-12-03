import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from 'react-router-dom'; // ★追加: 画面遷移用

export default function Auth() {
  const [mode, setMode] = useState('login'); // 初期値をloginに変更（使いやすさのため）
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();
  const navigate = useNavigate(); // ★追加

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      if (mode === 'signup') {
        let userCredential = null;

        try {
          // 1. Authenticationでユーザー作成
          userCredential = await signup(email, password);
          const user = userCredential.user;

          // 2. Firestoreにユーザー情報を保存
          await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            createdAt: new Date(),
            photoURL: ""
          });

          alert("登録完了！");
          navigate('/'); // ★地図へ移動
        } catch (firestoreError) {
          // Firestore保存に失敗した場合、作成したAuthenticationアカウントを削除
          if (userCredential && userCredential.user) {
            try {
              await userCredential.user.delete();
              console.log('Authenticationアカウントをロールバックしました');
            } catch (deleteError) {
              console.error('ロールバック失敗:', deleteError);
              // ロールバックに失敗した場合でも、元のエラーを優先して表示
            }
          }
          throw firestoreError; // 元のエラーを再スロー
        }
      } else {
        // ログインのみ
        await login(email, password);
        // alert("ログイン完了！"); // 毎回出ると邪魔なのでコメントアウト推奨
        navigate('/'); // ★地図へ移動
      }

    } catch (err) {
      console.error(err);
      setError(
        mode === 'signup'
          ? '登録に失敗しました: ' + err.message
          : 'ログインに失敗しました: ' + err.message
      );
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#Decbb7] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-[#Decbb7]/20 p-8 rounded-3xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 tracking-wider">
          {mode === 'signup' ? 'JOIN US' : 'WELCOME BACK'}
        </h2>
        
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="マップ上の表示名"
                className="w-full bg-[#1a1a1a]/50 border border-[#Decbb7]/30 rounded-xl p-4 text-[#Decbb7] focus:outline-none focus:border-[#Decbb7] transition placeholder-[#Decbb7]/20"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full bg-[#1a1a1a]/50 border border-[#Decbb7]/30 rounded-xl p-4 text-[#Decbb7] focus:outline-none focus:border-[#Decbb7] transition placeholder-[#Decbb7]/20"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#1a1a1a]/50 border border-[#Decbb7]/30 rounded-xl p-4 text-[#Decbb7] focus:outline-none focus:border-[#Decbb7] transition placeholder-[#Decbb7]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#Decbb7] text-[#1a1a1a] font-bold py-4 rounded-xl hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'signup' ? 'SIGN UP' : 'LOG IN'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm opacity-70">
          {mode === 'signup' ? (
            <>
              すでにアカウントをお持ちですか？{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="ml-2 font-bold underline hover:text-white transition"
              >
                ログイン
              </button>
            </>
          ) : (
            <>
              アカウントをお持ちでないですか？{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="ml-2 font-bold underline hover:text-white transition"
              >
                新規登録
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}