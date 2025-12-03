import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView, OverlayViewF, MarkerClustererF } from '@react-google-maps/api';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import PostList from './PostList';
import PostDetail from './PostDetail';
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

// クラスタアイコン
const clusterIconSvg = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="66" height="66" viewBox="0 0 66 66">
    <circle cx="33" cy="33" r="32" fill="none" stroke="#Decbb7" stroke-width="1" opacity="0.6"/>
    <circle cx="33" cy="33" r="28" fill="#Decbb7" stroke="#1a1a1a" stroke-width="4"/>
  </svg>
`);
const clusterIconUrl = `data:image/svg+xml;charset=UTF-8,${clusterIconSvg}`;

const clusterStyles = [
  {
    textColor: '#1a1a1a', 
    url: clusterIconUrl,
    height: 66,
    width: 66,
    textSize: 18,
    fontWeight: 'bold',
    fontFamily: 'sans-serif'
  }
];

// 投稿詳細ピン
const PostOverlay = ({ post, onClick, zoomLevel }) => {
  const baseZoom = 15;
  const scale = Math.pow(1.2, zoomLevel - baseZoom);
  const currentWidth = Math.min(Math.max(100 * scale, 60), 250);
  const currentImageHeight = Math.min(Math.max(80 * scale, 40), 180);
  const currentFontSize = Math.min(Math.max(12 * scale, 10), 18);
  const currentUsernameFontSize = Math.min(Math.max(10 * scale, 8), 14);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-[calc(100%+10px)] cursor-pointer hover:z-50 transition-all duration-300 ease-out"
      onClick={onClick}
      style={{ zIndex: Math.floor(zoomLevel) + 10 }}
    >
      <div className="bg-[#1a1a1a] border border-[#Decbb7]/30 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col" style={{ width: `${currentWidth}px` }}>
        <img src={post.imageUrl} alt={post.caption} className="w-full object-cover transition-all duration-500" style={{ height: `${currentImageHeight}px` }} />
        <div className="mt-1 p-1">
          <p className="truncate text-[#Decbb7] font-display font-bold leading-tight tracking-wide" style={{ fontSize: `${currentFontSize}px` }}>{post.caption}</p>
          <p className="truncate text-gray-500 text-right leading-tight mb-1 font-sans" style={{ fontSize: `${currentUsernameFontSize}px` }}>by {post.username}</p>
        </div>
      </div>
      <div className="w-0 h-0 border-l-transparent border-r-transparent border-t-[#Decbb7]/30 mx-auto"
        style={{ borderLeftWidth: `${8 * scale}px`, borderRightWidth: `${8 * scale}px`, borderTopWidth: `${8 * scale}px` }} />
    </div>
  );
};

export default function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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

  const panToCurrentLocation = () => {
    if (map && currentLocation) {
      map.panTo(currentLocation);
      map.setZoom(16);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          map?.panTo(loc);
          map?.setZoom(16);
        });
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    navigate('/post', { state: { selectedFile: file } });
    e.target.value = ''; 
  };

  if (loadError) return <div className="flex items-center justify-center h-screen bg-black text-white font-display">Error loading maps</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-black text-white font-display">Loading Maps...</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black">
      <Header />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      <div className={`absolute left-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPostListOpen ? 'bottom-[calc(80vh+20px)]' : 'bottom-28'}`}>
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-[#Decbb7] text-[#1a1a1a] rounded-full p-4 shadow-[0_0_30px_rgba(222,203,183,0.4)] transition-all transform hover:scale-110 flex items-center justify-center border-2 border-transparent hover:border-white/20"
          style={{ width: '64px', height: '64px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className={`absolute right-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPostListOpen ? 'bottom-[calc(80vh+20px)]' : 'bottom-28'}`}>
        <button
          onClick={panToCurrentLocation}
          className="bg-[#1a1a1a] text-[#Decbb7] border border-[#Decbb7]/50 rounded-full p-4 shadow-lg transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center"
          style={{ width: '64px', height: '64px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22l10-4 10 4L12 2z" />
          </svg>
        </button>
      </div>

      <PostList posts={posts} onOpenStateChange={setIsPostListOpen} />

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
        {/* ★修正：pointer-events-none を追加してクリック判定を無効化 */}
        {currentLocation && (
          <OverlayViewF
            position={currentLocation}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div 
              className="relative flex items-center justify-center pointer-events-none" 
              style={{ zIndex: 9999 }} 
            >
              <div className="absolute w-20 h-20 bg-[#Decbb7] rounded-full opacity-30 animate-ping"></div>
              <div className="relative w-5 h-5 bg-[#Decbb7] border-2 border-[#1a1a1a] rounded-full shadow-[0_0_15px_#Decbb7] z-10"></div>
            </div>
          </OverlayViewF>
        )}

        {zoomLevel < SHOW_POST_ZOOM_LEVEL ? (
          <MarkerClustererF styles={clusterStyles}>
            {(clusterer) => (
              posts.map((post) => (
                <Marker
                  key={`cluster-marker-${post.id}`}
                  position={{ lat: post.lat, lng: post.lng }}
                  clusterer={clusterer}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: '#Decbb7',
                    fillOpacity: 1,
                    strokeColor: '#1a1a1a',
                    strokeWeight: 2
                  }}
                  onClick={() => {
                    map.panTo({ lat: post.lat, lng: post.lng });
                    map.setZoom(16); 
                    setSelectedPost(post);
                  }}
                />
              ))
            )}
          </MarkerClustererF>
        ) : (
          posts.map((post) => (
            <React.Fragment key={post.id}>
              <Marker 
                position={{ lat: post.lat, lng: post.lng }}
                opacity={0}
                onClick={() => setSelectedPost(post)}
              />
              <OverlayViewF 
                position={{ lat: post.lat, lng: post.lng }} 
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <PostOverlay post={post} onClick={() => setSelectedPost(post)} zoomLevel={zoomLevel} />
              </OverlayViewF>
            </React.Fragment>
          ))
        )}

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