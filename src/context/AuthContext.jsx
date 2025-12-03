// src/context/AuthContext.jsx
import React, { useContext, useState, useEffect, createContext } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: Auth state changed:", user?.uid);

      if (user) {
        try {
          // Firestoreからユーザー情報を取得
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          // 【重要】Race Condition対策
          // 非同期処理中に認証ユーザーが変更されていないか確認（ログアウトまたは別ユーザーへの切り替え）
          if (auth.currentUser?.uid !== user.uid) {
            console.warn("AuthContext: User changed during fetch. Ignoring result.");
            return;
          }

          if (userDocSnap.exists()) {
            // Firestoreのデータをマージ
            const userData = userDocSnap.data();
            setCurrentUser({
              ...user,
              username: userData.username,
              photoURL: userData.photoURL || user.photoURL,
            });
          } else {
            // Firestoreにデータがない場合のフォールバック
            console.warn("User document not found in Firestore");
            setCurrentUser(user);
          }
        } catch (error) {
          // エラー発生時も、ユーザーが変わっていなければstateを更新
          if (auth.currentUser?.uid === user.uid) {
            console.error("Error fetching user data from Firestore:", error);
            setCurrentUser(user);
          }
        }
      } else {
        setCurrentUser(null); // ログアウト時
      }

      setLoading(false);
    }, (error) => {
      console.error("AuthContext: Auth error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
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