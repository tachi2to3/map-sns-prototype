import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView, OverlayViewF } from '@react-google-maps/api';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import PostUploader from './PostUploader';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const defaultCenter = {
  lat: 35.681236,
  lng: 139.767125
};

// 地図のスタイル（変更なし）
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

// ズームレベルを受け取り、サイズを動的に変更する投稿表示コンポーネント
const PostOverlay = ({ post, onClick, zoomLevel }) => {
  // ★変更点1：基準となるズームレベルを下げて、全体的に大きく表示されるように調整
  const baseZoom = 15; // 以前は16
  const scale = Math.pow(1.2, zoomLevel - baseZoom);

  // 基準サイズ（ズームレベル15の時のサイズになります）
  const baseWidth = 100;
  const baseImageHeight = 80;
  const baseFontSize = 12;
  const baseUsernameFontSize = 10;

  // ★変更点2：最大サイズ制限を少し緩和して、より大きくなれるように調整
  const currentWidth = Math.min(Math.max(baseWidth * scale, 60), 250); // 最大幅を220→250へ拡大
  const currentImageHeight = Math.min(Math.max(baseImageHeight * scale, 40), 180); // 最大高さを160→180へ拡大
  const currentFontSize = Math.min(Math.max(baseFontSize * scale, 10), 18); // 最大フォントを16→18へ拡大
  const currentUsernameFontSize = Math.min(Math.max(baseUsernameFontSize * scale, 8), 14); // 最大フォントを12→14へ拡大

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-pointer hover:z-20 transition-all duration-200 ease-out"
      onClick={onClick}
      style={{ zIndex: Math.floor(zoomLevel) + 10 }}
    >
      <div 
        className="bg-white p-1 rounded-lg shadow-md overflow-hidden flex flex-col" 
        style={{ width: `${currentWidth}px` }}
      >
        <img 
          src={post.imageUrl} 
          alt={post.caption} 
          className="w-full object-cover rounded" 
          style={{ height: `${currentImageHeight}px` }}
        />
        <div className="mt-1">
          <p 
            className="truncate text-gray-800 font-bold leading-tight"
            style={{ fontSize: `${currentFontSize}px` }}
          >
            {post.caption}
          </p>
          <p 
            className="truncate text-gray-500 text-right leading-tight"
            style={{ fontSize: `${currentUsernameFontSize}px` }}
          >
            by {post.username}
          </p>
        </div>
      </div>
      {/* しっぽ部分 */}
      <div 
        className="border-l-transparent border-r-transparent border-t-white mx-auto filter drop-shadow-md"
        style={{
          borderLeftWidth: `${8 * scale}px`,
          borderRightWidth: `${8 * scale}px`,
          borderTopWidth: `${8 * scale}px`,
        }}
      ></div>
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

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
    if (map) {
      setZoomLevel(map.getZoom());
    }
  }, [map]);

  const handlePostSuccess = () => {
    console.log("投稿完了！");
  };

  // ★変更点3：表示を切り替えるズームレベルの閾値を下げる
  const SHOW_POST_ZOOM_LEVEL = 15; // 以前は16

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
        zoom={zoomLevel}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onZoomChanged={handleZoomChanged}
        options={{ 
          disableDefaultUI: true, 
          zoomControl: false, 
          gestureHandling: "greedy",
          styles: mapStyles
        }}
      >
        {/* 現在地マーカー */}
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
          const marker = (
            <Marker
              key={`marker-${post.id}`}
              position={{ lat: post.lat, lng: post.lng }}
              onClick={() => setSelectedPost(post)}
            />
          );

          const isSelected = selectedPost && selectedPost.id === post.id;
          const showOverlay = zoomLevel >= SHOW_POST_ZOOM_LEVEL && !isSelected;

          if (showOverlay) {
            return (
              <React.Fragment key={post.id}>
                {marker}
                <OverlayViewF
                  position={{ lat: post.lat, lng: post.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <PostOverlay 
                    post={post} 
                    onClick={() => setSelectedPost(post)}
                    zoomLevel={zoomLevel}
                  />
                </OverlayViewF>
              </React.Fragment>
            );
          } else {
            return marker;
          }
        })}

        {/* 詳細表示のInfoWindow */}
        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.lat, lng: selectedPost.lng }}
            onCloseClick={() => setSelectedPost(null)}
            zIndex={10000}
          >
            <div className="max-w-xs">
              <img src={selectedPost.imageUrl} alt="memory" className="w-full h-40 object-cover rounded mb-2" />
              <p className="text-base font-bold text-gray-800">{selectedPost.caption}</p>
              <p className="text-xs text-gray-500 mt-2 text-right">by {selectedPost.username}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}