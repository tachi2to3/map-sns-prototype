import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView, OverlayViewF } from '@react-google-maps/api';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import PostList from './PostList';
import PostDetail from './PostDetail';
import PostUploader from './PostUploader';
import Header from './Header';

// ■■■ スタイル定義 ■■■
const containerStyle = {
  width: '100%',
  height: '100dvh'
};

const defaultCenter = {
  lat: 35.681236,
  lng: 139.767125
};

// Dark "Noir" Map Style
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
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
  const currentIconSize = Math.min(Math.max(14 * scale, 10), 20);

  // 仮のいいね・コメント数（実際のデータがあればそれを使用）
  const likeCount = post.likeCount || 0;
  const commentCount = post.commentCount || 0;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-pointer hover:z-50 transition-all duration-300 ease-out"
      onClick={onClick}
      style={{ zIndex: Math.floor(zoomLevel) + 10 }}
    >
      <div
        className="bg-[#1a1a1a] border border-[#Decbb7]/30 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        style={{ width: `${currentWidth}px` }}
      >
        <img src={post.imageUrl} alt={post.caption} className="w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" style={{ height: `${currentImageHeight}px` }} />
        <div className="mt-1 p-1">
          <p className="truncate text-[#Decbb7] font-display font-bold leading-tight tracking-wide" style={{ fontSize: `${currentFontSize}px` }}>{post.caption}</p>
          <p className="truncate text-gray-500 text-right leading-tight mb-1 font-sans" style={{ fontSize: `${currentUsernameFontSize}px` }}>by {post.username}</p>
          <div className="flex items-center justify-end space-x-2 text-gray-500">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-pink-500" fill="currentColor" viewBox="0 0 24 24" style={{ width: currentIconSize, height: currentIconSize }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="ml-0.5 font-bold font-display" style={{ fontSize: `${currentUsernameFontSize}px` }}>{likeCount}</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-500" fill="currentColor" viewBox="0 0 24 24" style={{ width: currentIconSize, height: currentIconSize }}>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <span className="ml-0.5 font-bold font-display" style={{ fontSize: `${currentUsernameFontSize}px` }}>{commentCount}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Triangle pointer */}
      <div className="w-0 h-0 border-l-transparent border-r-transparent border-t-[#Decbb7]/30 mx-auto"
        style={{
          borderLeftWidth: `${8 * scale}px`,
          borderRightWidth: `${8 * scale}px`,
          borderTopWidth: `${8 * scale}px`
        }}>
        <div className="w-0 h-0 border-l-transparent border-r-transparent border-t-[#1a1a1a] -mt-[9px] -ml-[7px]"
          style={{
             borderLeftWidth: `${7 * scale}px`,
             borderRightWidth: `${7 * scale}px`,
             borderTopWidth: `${7 * scale}px`,
             marginTop: `-${(8 * scale) + 1}px`,
             marginLeft: `-${7 * scale}px`
          }}
        />
      </div>
    </div>
  );
};

export default function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null); // カメラ起動用のref（将来の機能用に保持）

  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isPostListOpen, setIsPostListOpen] = useState(false);
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

  // カメラで撮影された後の処理（将来の機能用に保持）
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // 撮影されたファイルを持って投稿ページへ移動
    navigate('/post', { state: { selectedFile: file } });
    e.target.value = ''; // reset
  };

  // PostUploader成功時のハンドラー
  const handlePostSuccess = () => {
    // 必要に応じて処理を追加
  };

  if (loadError) return <div className="flex items-center justify-center h-screen bg-black text-white font-display">Error loading maps</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-black text-white font-display">Loading Maps...</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black">
      <Header />

      {/* 隠しカメラ起動ボタン（将来の機能用に保持） */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Post Button - Moves with drawer */}
      <div className={`absolute left-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPostListOpen ? 'bottom-[calc(80vh+20px)]' : 'bottom-28'}`}>
        <PostUploader onPostSuccess={handlePostSuccess} />
      </div>

      <PostList posts={posts} onOpenStateChange={setIsPostListOpen} />

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || defaultCenter}
        zoom={zoomLevel}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onZoomChanged={handleZoomChanged}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: "greedy",
          styles: mapStyles,
          backgroundColor: '#000000'
        }}
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
              strokeColor: '#000000',
              strokeWeight: 3
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