import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Auth() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      if (mode === 'signup') {
        // 1. Authenticationでユーザー作成
        const userCredential = await signup(email, password);
        const user = userCredential.user;

        // 2. Firestoreにユーザー情報を保存
        await setDoc(doc(db, "users", user.uid), {
          username: username,
          email: email,
          createdAt: new Date(),
          photoURL: ""
        });

        alert("登録完了！");
      } else {
        // ログインのみ（Firestore書き込み不要）
        await login(email, password);
        alert("ログイン完了！");
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          {mode === 'signup' ? 'アカウント作成' : 'ログイン'}
        </h2>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="マップ上の表示名"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {mode === 'signup' ? '登録する' : 'ログイン'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {mode === 'signup' ? (
              <>
                すでにアカウントをお持ちですか？{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:underline font-medium"
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
                  className="text-blue-600 hover:underline font-medium"
                >
                  新規登録
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
