// src/context/AuthContext.jsx
import React, { useContext, useState, useEffect, createContext } from "react";
import { auth } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

// Contextの作成
const AuthContext = createContext();

// カスタムフック：これを各コンポーネントで呼び出して使う
export function useAuth() {
  return useContext(AuthContext);
}

// Providerコンポーネント：アプリ全体をこれで囲む
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. 新規登録機能
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // 2. ログイン機能（今後ログイン画面を作る時に使います）
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // 3. ログアウト機能
  function logout() {
    return signOut(auth);
  }

  // ログイン状態の監視（Firebaseが自動でやってくれる）
  // アプリを開いたとき、すでにログイン済みかチェックします
  useEffect(() => {
    console.log("AuthContext: Start monitoring auth state...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AuthContext: Auth state changed:", user);
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
        console.error("AuthContext: Auth error:", error);
        setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Contextとして提供する値
  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}