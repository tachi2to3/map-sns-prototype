import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth'; 
import Map from './components/Map';
import PostPage from './components/PostPage';
import PostDetailPage from './components/PostDetailPage'; // ★追加
import { useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        {/* ★変更: 地図画面はログイン不要 */}
        <Route path="/" element={<Map />} />

        <Route path="/post" element={
          <PrivateRoute>
            <PostPage />
          </PrivateRoute>
        } />

        {/* ★変更: 詳細ページもログイン不要 */}
        <Route path="/post/:id" element={<PostDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;