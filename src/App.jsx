import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// ★修正: Signup ではなく Auth をインポート
import Auth from './components/Auth'; 
import Map from './components/Map';
import PostPage from './components/PostPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// ログインしていないと入れないようにするガード
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  // ★修正: 未ログイン時は /auth へ転送
  return currentUser ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ★修正: パスを /auth にし、Authコンポーネントを表示 */}
          <Route path="/auth" element={<Auth />} />

          {/* 地図画面（トップ） */}
          <Route path="/" element={
            <PrivateRoute>
              <Map />
            </PrivateRoute>
          } />

          {/* 投稿画面 */}
          <Route path="/post" element={
            <PrivateRoute>
              <PostPage />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;