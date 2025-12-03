import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth'; 
import Map from './components/Map';
import PostPage from './components/PostPage';
import PostDetailPage from './components/PostDetailPage'; // ★追加
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route path="/" element={
            <PrivateRoute>
              <Map />
            </PrivateRoute>
          } />

          <Route path="/post" element={
            <PrivateRoute>
              <PostPage />
            </PrivateRoute>
          } />

          {/* ★追加: 詳細ページのルート (:id は動的に変わります) */}
          <Route path="/post/:id" element={
            <PrivateRoute>
              <PostDetailPage />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;