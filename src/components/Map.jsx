import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { auth, db } from '../firebase'; // dbを追加インポート
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; // データ読み込み用
import PostUploader from './PostUploader';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const defaultCenter = {
  lat: 35.681236,
  lng: 139.767125
};

export default function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // ★追加：投稿データを管理するState
  const [posts, setPosts] = useState([]); 
  const [selectedPost, setSelectedPost] = useState(null); // ピンをクリックした時の詳細

  // ★追加：データベースから投稿をリアルタイム取得する処理
  useEffect(() => {
    // 投稿を新しい順に取得するクエリ
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    // データベースに変更があるたびに自動実行される
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe(); // クリーンアップ
  }, []);

  const onLoad = useCallback(function callback(map) {
    setMap(map);

    // ブラウザの現在地取得
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(pos);
          map.panTo(pos);
        },
        () => {
          console.log("現在地取得失敗");
        }
      );
    }
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handlePostSuccess = () => {
    console.log("投稿完了！");
    // onSnapshotを使っているため、自動でピンが増えます
  };

  if (loadError) return <div className="flex items-center justify-center h-screen">Error loading maps</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading Maps...</div>;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <button 
        onClick={() => auth.signOut()}
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-white text-red-600 rounded-full shadow-md font-bold text-sm"
      >
        ログアウト
      </button>

      <PostUploader onPostSuccess={handlePostSuccess} />

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || defaultCenter}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{ disableDefaultUI: true, zoomControl: false, gestureHandling: "greedy" }}
      >
        {/* 自分自身の現在地（青い丸） */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            zIndex={999} // 自分を一番手前に
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }}
          />
        )}

        {/* ★追加：みんなの投稿ピンを表示 */}
        {posts.map((post) => (
          <Marker
            key={post.id}
            position={{ lat: post.lat, lng: post.lng }}
            onClick={() => setSelectedPost(post)} // クリックしたら詳細表示
          />
        ))}

        {/* ★追加：ピンをクリックした時に出る吹き出し */}
        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.lat, lng: selectedPost.lng }}
            onCloseClick={() => setSelectedPost(null)}
          >
            <div className="max-w-xs">
              <img src={selectedPost.imageUrl} alt="memory" className="w-full h-32 object-cover rounded mb-2" />
              <p className="text-sm font-bold text-gray-800">{selectedPost.caption}</p>
              <p className="text-xs text-gray-500 mt-1">by {selectedPost.username}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}