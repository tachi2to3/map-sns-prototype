import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView, OverlayViewF } from '@react-google-maps/api';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import PostUploader from './PostUploader';
import PostDetail from './PostDetail';
import PostList from './PostList'; // ★追加: 作成したリストコンポーネント
import Header from './Header'; // ★追加: ヘッダーコンポーネント

const containerStyle = {
  width: '100%',
  height: '100dvh' // スマホアドレスバー対策
};

const defaultCenter = {
  lat: 35.681236,
  lng: 139.767125
};

const mapStyles = [
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#818181" }] },
  { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 10 }, { "saturation": -10 }] },
  { "featureType": "road", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c0e4f3" }] }
];

const PostOverlay = ({ post, onClick, zoomLevel }) => {
  const baseZoom = 15;
  const scale = Math.pow(1.2, zoomLevel - baseZoom);
  const baseWidth = 100;
  const baseImageHeight = 80;
  const baseFontSize = 12;
  const baseUsernameFontSize = 10;
  const baseIconSize = 12;

  const currentWidth = Math.min(Math.max(baseWidth * scale, 60), 250);
  const currentImageHeight = Math.min(Math.max(baseImageHeight * scale, 40), 180);
  const currentFontSize = Math.min(Math.max(baseFontSize * scale, 10), 18);
  const currentUsernameFontSize = Math.min(Math.max(baseUsernameFontSize * scale, 8), 14);
  const currentIconSize = Math.min(Math.max(baseIconSize * scale, 10), 16);

  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const unsubscribeLikes = onSnapshot(collection(db, 'posts', post.id, 'likes'), (snap) => setLikeCount(snap.size));
    const unsubscribeComments = onSnapshot(collection(db, 'posts', post.id, 'comments'), (snap) => setCommentCount(snap.size));
    return () => { unsubscribeLikes(); unsubscribeComments(); };
  }, [post.id]);

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-pointer hover:z-20 transition-all duration-200 ease-out"
      onClick={onClick}
      style={{ zIndex: Math.floor(zoomLevel) + 10 }}
    >
      <div className="bg-white p-1 rounded-lg shadow-md overflow-hidden flex flex-col" style={{ width: `${currentWidth}px` }}>
        <img src={post.imageUrl} alt={post.caption} className="w-full object-cover rounded" style={{ height: `${currentImageHeight}px` }} />
        <div className="mt-1">
          <p className="truncate text-gray-800 font-bold leading-tight" style={{ fontSize: `${currentFontSize}px` }}>{post.caption}</p>
          <p className="truncate text-gray-500 text-right leading-tight mb-1" style={{ fontSize: `${currentUsernameFontSize}px` }}>by {post.username}</p>
          <div className="flex items-center justify-end space-x-2 text-gray-500">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-pink-400" fill="currentColor" viewBox="0 0 24 24" style={{ width: currentIconSize, height: currentIconSize }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="ml-0.5 font-bold" style={{ fontSize: `${currentUsernameFontSize}px` }}>{likeCount}</span>
            </div>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-400" fill="currentColor" viewBox="0 0 24 24" style={{ width: currentIconSize, height: currentIconSize }}>
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <span className="ml-0.5 font-bold" style={{ fontSize: `${currentUsernameFontSize}px` }}>{commentCount}</span>
            </div>
          </div>
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

  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isPostListOpen, setIsPostListOpen] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
    setZoomLevel(map.getZoom());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentLocation(pos);
          map.panTo(pos);
        },
        () => console.log("現在地取得失敗")
      );
    }
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleZoomChanged = useCallback(() => {
    if (map) setZoomLevel(map.getZoom());
  }, [map]);

  const handlePostSuccess = () => console.log("投稿完了");
  const SHOW_POST_ZOOM_LEVEL = 15;

  if (loadError) return <div className="flex items-center justify-center h-screen">Error loading maps</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading Maps...</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden">
      {/* ★追加: ヘッダーコンポーネント */}
      <Header />

      {/* ★追加: 投稿ボタンの位置調整 */}
      {/* リスト(z-30)より上に表示(z-40)、リストの開閉状態に応じて位置を調整 */}
      <div className={`absolute ${isPostListOpen ? 'bottom-40' : 'bottom-6'} left-6 z-40 transition-all duration-300`}>
        <PostUploader onPostSuccess={handlePostSuccess} />
      </div>

      {/* ★追加: 近くの投稿リスト（画面下部） */}
      <PostList posts={posts} onOpenStateChange={setIsPostListOpen} />

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || defaultCenter}
        zoom={zoomLevel}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onZoomChanged={handleZoomChanged}
        options={{ disableDefaultUI: true, zoomControl: false, gestureHandling: "greedy", styles: mapStyles }}
      >
        {currentLocation && (
          <Marker
            position={currentLocation}
            zIndex={9999}
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