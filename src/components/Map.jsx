import React, { useCallback, useState, useEffect, useRef } from 'react'; // ★ useRef 追加
import { GoogleMap, useJsApiLoader, Marker, OverlayView, OverlayViewF, InfoWindow } from '@react-google-maps/api';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import PostList from './PostList';
import PostDetail from './PostDetail';

// ■■■ スタイル定義 ■■■
const containerStyle = {
  width: '100%',
  height: '100dvh', 
};

// ダークモードマップスタイル
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

// 地図上の投稿ピン
const PostOverlay = ({ post, onClick, zoomLevel }) => {
  const baseZoom = 15;
  const scale = Math.pow(1.2, zoomLevel - baseZoom);
  const currentWidth = Math.min(Math.max(100 * scale, 60), 250);
  const currentImageHeight = Math.min(Math.max(80 * scale, 40), 180);
  const currentFontSize = Math.min(Math.max(12 * scale, 10), 18);
  const currentUsernameFontSize = Math.min(Math.max(10 * scale, 8), 14);

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-pointer hover:z-20 transition-all duration-200 ease-out"
      onClick={onClick}
      style={{ zIndex: Math.floor(zoomLevel) + 10 }}
    >
      <div className="bg-white p-1 rounded-lg shadow-md overflow-hidden flex flex-col" style={{ width: `${currentWidth}px` }}>
        <img src={post.imageUrl} alt="" className="w-full object-cover rounded" style={{ height: `${currentImageHeight}px` }} />
        <div className="mt-1">
          <p className="truncate text-gray-800 font-bold leading-tight" style={{ fontSize: `${currentFontSize}px` }}>{post.caption}</p>
          <p className="truncate text-gray-500 text-right leading-tight mb-1" style={{ fontSize: `${currentUsernameFontSize}px` }}>by {post.username}</p>
        </div>
      </div>
      <div className="border-l-transparent border-r-transparent border-t-white mx-auto filter drop-shadow-md"
        style={{ borderLeftWidth: `${8 * scale}px`, borderRightWidth: `${8 * scale}px`, borderTopWidth: `${8 * scale}px` }}></div>
    </div>
  );
};

export default function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null); // ★追加: カメラ起動用のref

  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(15);
  const SHOW_POST_ZOOM_LEVEL = 15;

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  const onLoad = useCallback((map) => {
    setMap(map);
    setZoomLevel(map.getZoom());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          map.panTo(loc);
        }
      );
    }
  }, []);

  const onUnmount = useCallback(() => setMap(null), []);

  const handleZoomChanged = useCallback(() => {
    if (map) setZoomLevel(map.getZoom());
  }, [map]);

  // ★追加: カメラで撮影された後の処理
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // 撮影されたファイルを持って投稿ページへ移動
    navigate('/post', { state: { selectedFile: file } });
    e.target.value = ''; // reset
  };


  if (loadError) return <div className="bg-[#1a1a1a] text-[#Decbb7] h-screen flex items-center justify-center">Error</div>;
  if (!isLoaded) return <div className="bg-[#1a1a1a] text-[#Decbb7] h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="relative w-full h-[100dvh] bg-[#1a1a1a] overflow-hidden font-sans text-[#Decbb7]">
      
      {/* ログアウトボタン */}
      <button 
        onClick={() => auth.signOut()}
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-[#Decbb7]/30 text-[#Decbb7] rounded-full shadow-lg font-bold text-xs"
      >
        ログアウト
      </button>

      {/* ★追加: 隠しカメラ起動ボタン */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        capture="environment" // スマホでカメラを直接起動
        className="hidden"
      />

      {/* ★変更: 投稿ボタン（プラス） */}
      <div className="absolute bottom-40 right-6 z-40">
        <button
          onClick={() => fileInputRef.current.click()} // ★変更: 隠しカメラボタンをクリック
          className="bg-[#Decbb7] text-[#1a1a1a] border-4 border-[#1a1a1a] rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
          style={{ width: '72px', height: '72px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 下部リスト */}
      <PostList posts={posts} />

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || { lat: 35.681236, lng: 139.767125 }}
        zoom={zoomLevel}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onZoomChanged={handleZoomChanged}
        options={{ disableDefaultUI: true, zoomControl: false, gestureHandling: "greedy", styles: mapStyles, backgroundColor: '#1a1a1a' }}
      >
        {currentLocation && (
          <Marker
            position={currentLocation}
            zIndex={999}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#Decbb7',
              fillOpacity: 1,
              strokeColor: '#1a1a1a',
              strokeWeight: 4
            }}
          />
        )}

        {posts.map((post) => {
          const marker = <Marker key={`marker-${post.id}`} position={{ lat: post.lat, lng: post.lng }} onClick={() => setSelectedPost(post)} />;
          const isSelected = selectedPost && selectedPost.id === post.id;
          const showOverlay = zoomLevel >= SHOW_POST_ZOOM_LEVEL && !isSelected;

          if (showOverlay) {
            return (
              <React.Fragment key={post.id}>
                {marker}
                <OverlayViewF position={{ lat: post.lat, lng: post.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <PostOverlay post={post} onClick={() => setSelectedPost(post)} zoomLevel={zoomLevel} />
                </OverlayViewF>
              </React.Fragment>
            );
          } else {
            return marker;
          }
        })}

        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.lat, lng: selectedPost.lng }}
            onCloseClick={() => setSelectedPost(null)}
            zIndex={10000}
            options={{ headerContent: '<div class="hidden"></div>', padding: 0 }} 
          >
            <div className="p-1 overflow-hidden">
              <PostDetail post={selectedPost} />
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}