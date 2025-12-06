import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, OverlayView, OverlayViewF, MarkerClustererF } from '@react-google-maps/api';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import PostList from './PostList';
import PostDetail from './PostDetail';
import Header from './Header';
import FollowButton from './FollowButton';

// PostListの閉じた状態（80px）を考慮して地図の高さを調整
const containerStyle = { width: '100%', height: 'calc(100dvh - 80px)' };
const defaultCenter = { lat: 35.681236, lng: 139.767125 };

// マップスタイル
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
const clusterStyles = [{ textColor: '#1a1a1a', url: clusterIconUrl, height: 66, width: 66, textSize: 18, fontWeight: 'bold', fontFamily: 'sans-serif' }];

// ピンアイコン
const pinIconSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48"><path fill="#Decbb7" stroke="#1a1a1a" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#1a1a1a"/></svg>`);
const pinIconUrl = `data:image/svg+xml;charset=UTF-8,${pinIconSvg}`;

// スタックマーカー
const StackMarker = ({ posts, onClick }) => {
  const count = posts.length;
  const topImage = posts[0].imageUrl;

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer hover:scale-110 transition-transform duration-200"
      style={{ width: '60px', height: '60px' }}
    >
      <div className="absolute top-0 right-0 w-full h-full bg-white/20 rounded-lg transform rotate-6 border border-white/10"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-white/40 rounded-lg transform -rotate-3 border border-white/10"></div>
      <div className="absolute top-0 right-0 w-full h-full bg-[#1a1a1a] rounded-lg overflow-hidden border-2 border-[#Decbb7] shadow-lg">
        <img src={topImage} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute -top-2 -right-2 bg-[#Decbb7] text-[#1a1a1a] font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md border border-[#1a1a1a] z-10">
        {count}
      </div>
    </div>
  );
};

// コレクションモーダル
const CollectionModal = ({ posts, onClose, navigate }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
      <div className="bg-[#121212] w-full max-w-lg max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto flex flex-col border border-white/10 m-0 sm:m-4 overflow-hidden animate-[slideInUp_0.3s_ease-out]">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
          <div>
            <h3 className="text-[#Decbb7] font-bold text-lg tracking-widest font-display">COLLECTION</h3>
            <p className="text-xs text-white/40 font-sans">{posts.length} RECORDS HERE</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto bg-[#121212]">
          <div className="grid grid-cols-2 gap-3">
            {posts.map(post => (
              <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="relative aspect-square bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 cursor-pointer group">
                <img src={post.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-sm font-bold truncate">{post.caption}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {post.userIcon ? <img src={post.userIcon} className="w-4 h-4 rounded-full" /> : <div className="w-4 h-4 rounded-full bg-white/20" />}
                    <span className="text-[10px] text-white/70 truncate">{post.username}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 力学シミュレーションで投稿の位置を調整
const applyForceSimulation = (posts, map, zoomLevel) => {
  if (!map || posts.length === 0) return posts;

  // カードサイズを計算
  const scale = Math.pow(1.15, zoomLevel - 15);
  const cardWidth = Math.min(Math.max(96 * scale, 48), 240);
  const cardHeight = Math.min(Math.max(77 * scale, 32), 172) + 60; // 画像+テキスト+余白

  // 地図の中心とboundsを取得
  const bounds = map.getBounds();
  const projection = map.getProjection();
  if (!projection || !bounds) return posts;

  // 投稿を画面ピクセル座標に変換
  const overlay = new window.google.maps.OverlayView();
  overlay.draw = function() {};
  overlay.setMap(map);

  const particles = posts.map(post => {
    const latLng = new window.google.maps.LatLng(post.lat, post.lng);
    // Projection APIを使ってスクリーン座標を取得
    const worldPoint = projection.fromLatLngToPoint(latLng);
    const pixelX = worldPoint.x * Math.pow(2, map.getZoom());
    const pixelY = worldPoint.y * Math.pow(2, map.getZoom());

    return {
      ...post,
      x: pixelX,
      y: pixelY,
      vx: 0,
      vy: 0,
      originalX: pixelX,
      originalY: pixelY
    };
  });

  // 各投稿の周囲密度を事前計算
  const densityRadius = Math.max(cardWidth, cardHeight) * 2;
  particles.forEach((p, i) => {
    let nearbyCount = 0;
    for (let j = 0; j < particles.length; j++) {
      if (i === j) continue;
      const dx = particles[j].x - p.x;
      const dy = particles[j].y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < densityRadius) nearbyCount++;
    }

    // 基本スケール（密集している場合は縮小）
    const baseScale = Math.max(0.6, 1.0 - (nearbyCount * 0.08));

    // 密度ボーナス（周囲が空いている場合は拡大、最大1.5倍）
    if (nearbyCount <= 2) {
      const bonus = 1.5 - (nearbyCount * 0.25); // nearbyCount: 0→1.5倍, 1→1.25倍, 2→1.0倍
      p.scaleFactor = Math.min(1.5, baseScale * bonus);
    } else {
      p.scaleFactor = baseScale;
    }
  });

  // 力学シミュレーション
  const iterations = 60;
  const repulsionStrength = 0.3;
  const anchorStrength = 0.15;

  for (let iter = 0; iter < iterations; iter++) {
    // 反発力の適用
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[j].x - particles[i].x;
        const dy = particles[j].y - particles[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 両方のカードのスケールファクターを考慮
        const avgScale = (particles[i].scaleFactor + particles[j].scaleFactor) / 2;
        const minDistance = Math.max(cardWidth, cardHeight) * avgScale * 1.1;

        if (distance < minDistance && distance > 0) {
          const force = (minDistance - distance) * repulsionStrength;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          particles[i].vx -= fx;
          particles[i].vy -= fy;
          particles[j].vx += fx;
          particles[j].vy += fy;
        }
      }
    }

    // 復元力の適用（元の位置に引き戻す）
    for (let i = 0; i < particles.length; i++) {
      const dx = particles[i].originalX - particles[i].x;
      const dy = particles[i].originalY - particles[i].y;
      particles[i].vx += dx * anchorStrength;
      particles[i].vy += dy * anchorStrength;
    }

    // 位置を更新
    for (let i = 0; i < particles.length; i++) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].vx *= 0.85; // 減衰
      particles[i].vy *= 0.85;
    }
  }

  // ピクセルオフセットを計算（scaleFactorは既に設定済み）
  const result = particles.map(p => ({
    ...p,
    offsetX: p.x - p.originalX,
    offsetY: p.y - p.originalY,
    hasOffset: Math.abs(p.x - p.originalX) > 5 || Math.abs(p.y - p.originalY) > 5
  }));

  return result;
};

// 元の位置からカードへの接続線
const OriginConnector = ({ post }) => {
  if (!post.hasOffset) return null;

  return (
    <>
      {/* 元の位置マーカー */}
      <div className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative">
          <div className="w-2 h-2 bg-[#Decbb7] rounded-full border border-[#1a1a1a] shadow-md"></div>
          <div className="absolute inset-0 w-2 h-2 bg-[#Decbb7] rounded-full animate-ping opacity-40"></div>
        </div>
      </div>

      {/* 接続線 */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: '0',
          top: '0',
          overflow: 'visible',
          width: '1px',
          height: '1px'
        }}
      >
        <line
          x1="0"
          y1="0"
          x2={post.offsetX || 0}
          y2={post.offsetY || 0}
          stroke="#Decbb7"
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.5"
        />
      </svg>
    </>
  );
};

// 2点間の距離を計算（Haversine公式、単位：km）
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 投稿詳細ピン
const PostOverlay = ({ post, onClick, zoomLevel }) => {
  const baseZoom = 15;
  const scale = Math.pow(1.15, zoomLevel - baseZoom);

  // 密度に応じたスケールファクターを適用
  const densityScale = post.scaleFactor || 1.0;
  const finalScale = scale * densityScale;

  const currentWidth = Math.min(Math.max(96 * finalScale, 48), 240);
  const currentImageHeight = Math.min(Math.max(77 * finalScale, 32), 172);
  const currentFontSize = Math.min(Math.max(12 * finalScale, 8), 16);
  const currentIconSize = Math.min(Math.max(15 * finalScale, 10), 22);

  // カードが小さい時はフォローボタンを非表示
  const showFollowButton = densityScale >= 0.7;

  return (
    <div
      className="absolute transform cursor-pointer hover:z-50 transition-all duration-300 ease-out"
      onClick={onClick}
      style={{
        zIndex: Math.floor(zoomLevel) + 10,
        transform: `translate(calc(-50% + ${post.offsetX || 0}px), calc(-100% - 10px + ${post.offsetY || 0}px))`
      }}
    >
      <div className="bg-[#1a1a1a] border border-[#Decbb7]/30 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col" style={{ width: `${currentWidth}px` }}>
        <img src={post.imageUrl} alt={post.caption} className="w-full object-cover transition-all duration-500" style={{ height: `${currentImageHeight}px` }} />
        <div className="mt-1 p-1">
          <p className="truncate text-[#Decbb7] font-display font-bold leading-tight tracking-wide" style={{ fontSize: `${currentFontSize}px` }}>{post.caption}</p>
          {showFollowButton && (
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500 font-sans">by</span>
                {post.userIcon ? (
                  <img src={post.userIcon} alt={post.username} className="rounded-full object-cover border border-[#Decbb7]/30" style={{ width: `${currentIconSize}px`, height: `${currentIconSize}px` }} />
                ) : (
                  <div className="rounded-full bg-white/10 flex items-center justify-center" style={{ width: `${currentIconSize}px`, height: `${currentIconSize}px` }}>
                    <span className="text-[8px] font-bold text-white/50">{post.username?.slice(0, 1)}</span>
                  </div>
                )}
              </div>
              <div className="transform scale-75 origin-right">
                <FollowButton targetUserId={post.userId} />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="w-0 h-0 border-l-transparent border-r-transparent border-t-[#Decbb7]/30 mx-auto" style={{ borderLeftWidth: `${8 * scale}px`, borderRightWidth: `${8 * scale}px`, borderTopWidth: `${8 * scale}px` }} />
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
  const [collectionModalPosts, setCollectionModalPosts] = useState(null);

  // ズームコントロール管理
  const [sliderValue, setSliderValue] = useState(0);
  const startZoomRef = useRef(15);

  const SHOW_POST_ZOOM_LEVEL = 14;

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  // 距離計算付き投稿リスト（NEARBYタブ用）
  const sortedPosts = useMemo(() => {
    // 位置情報がない場合はそのまま返す（createdAt降順を維持）
    if (!currentLocation) {
      return posts;
    }

    // 各投稿に距離情報を追加してソート
    const postsWithDistance = posts.map(post => ({
      ...post,
      distance: calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        post.lat,
        post.lng
      )
    }));

    // 距離でソート（近い順）
    return postsWithDistance.sort((a, b) => a.distance - b.distance);
  }, [posts, currentLocation]);

  const groupedPosts = useMemo(() => {
    if (zoomLevel < SHOW_POST_ZOOM_LEVEL) return [];

    const groups = {};
    let precision;
    if (zoomLevel < 16) precision = 0.002;
    else if (zoomLevel < 18) precision = 0.0005;
    else precision = 0.0001;

    posts.forEach(post => {
      const latKey = Math.floor(post.lat / precision) * precision;
      const lngKey = Math.floor(post.lng / precision) * precision;
      const key = `${latKey}-${lngKey}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(post);
    });

    // 単一投稿のグループ内で重複チェックして放射状配置
    return Object.values(groups).map(group => {
      if (group.length === 1) {
        return group; // そのまま返す（後で放射状チェックする）
      }
      return group; // 複数はStackMarkerで表示
    });
  }, [posts, zoomLevel]);

  // 単一投稿に力学シミュレーションを適用
  const adjustedPosts = useMemo(() => {
    const singles = groupedPosts.filter(g => g.length === 1).map(g => g[0]);
    if (singles.length === 0 || !map) return singles;

    return applyForceSimulation(singles, map, zoomLevel);
  }, [groupedPosts, zoomLevel, map]);

  const onLoad = useCallback((map) => {
    setMap(map);

    const savedCenter = sessionStorage.getItem('map_center');
    const savedZoom = sessionStorage.getItem('map_zoom');

    if (savedCenter && savedZoom) {
      // 保存された位置を復元
      const center = JSON.parse(savedCenter);
      const zoom = parseInt(savedZoom, 10);
      map.setCenter(center);
      map.setZoom(zoom);
      setZoomLevel(zoom);

      // 現在位置マーカー表示用に位置情報を取得（地図は移動させない）
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentLocation(loc);
          }
        );
      }
    } else {
      // 初回アクセス時は現在位置に移動
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
    }
  }, []);

  // マップがアイドル状態（移動終了）になったら現在地を保存
  const handleIdle = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (center) {
        sessionStorage.setItem('map_center', JSON.stringify({ lat: center.lat(), lng: center.lng() }));
      }
      sessionStorage.setItem('map_zoom', zoom.toString());
    }
  }, [map]);

  const onUnmount = useCallback(() => setMap(null), []);

  const handleZoomChanged = useCallback(() => {
    if (map) setZoomLevel(map.getZoom());
  }, [map]);

  const handleMapClick = () => setSelectedPost(null);

  const panToCurrentLocation = () => {
    if (map && currentLocation) { map.panTo(currentLocation); map.setZoom(16); }
    else if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((pos) => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCurrentLocation(loc); map?.panTo(loc); map?.setZoom(16); }); }
  };

  const handleFileSelect = (e) => { const file = e.target.files[0]; if (!file) return; navigate('/post', { state: { selectedFile: file } }); e.target.value = ''; };

  // スライダー操作ロジック
  const handleSliderStart = () => {
    if (map) startZoomRef.current = map.getZoom();
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSliderValue(val);
    if (map) {
      const newZoom = startZoomRef.current + val;
      map.setZoom(newZoom);
    }
  };

  const handleSliderEnd = () => {
    setSliderValue(0);
    if (map) startZoomRef.current = map.getZoom();
  };

  if (loadError) return <div className="flex items-center justify-center h-screen bg-black text-white font-display">Error loading maps</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-black text-white font-display">Loading Maps...</div>;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black">
      <Header />

      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

      {/* ★修正: 視覚的な「つまみ」 + 透明な操作判定 */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 h-64 w-12 flex items-center justify-center"
      >
        {/* 見た目用のつまみ (sliderValueに合わせて動く) */}
        <div
          className="absolute w-10 h-10 bg-[#Decbb7] rounded-full shadow-lg pointer-events-none transition-transform duration-75 ease-out flex items-center justify-center border-2 border-[#1a1a1a]"
          style={{
            // 上(+値)に行くとY座標はマイナスになるので -sliderValue
            // 係数を掛けて移動距離を調整 (例: * 8px)
            transform: `translateY(${-sliderValue * 10}px)`
          }}
        >
          {/* つまみの中の装飾（+/-アイコンなど） */}
          <div className="flex flex-col gap-0.5 opacity-50">
            <div className="w-4 h-0.5 bg-[#1a1a1a] rounded-full"></div>
            <div className="w-4 h-0.5 bg-[#1a1a1a] rounded-full"></div>
            <div className="w-4 h-0.5 bg-[#1a1a1a] rounded-full"></div>
          </div>
        </div>

        {/* 透明なinput (判定用) */}
        <input
          type="range"
          min="-10"
          max="10"
          step="1"
          value={sliderValue}
          onChange={handleSliderChange}
          onTouchStart={handleSliderStart}
          onMouseDown={handleSliderStart}
          onTouchEnd={handleSliderEnd}
          onMouseUp={handleSliderEnd}
          className="w-full h-full opacity-0 cursor-pointer"
          style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
        />
      </div>

      <div className={`absolute left-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPostListOpen ? 'bottom-[calc(80vh+20px)]' : 'bottom-28'}`}>
        <button onClick={() => fileInputRef.current.click()} className="bg-[#Decbb7] text-[#1a1a1a] rounded-full p-4 shadow-[0_0_30px_rgba(222,203,183,0.4)] transition-all transform hover:scale-110 flex items-center justify-center border-2 border-transparent hover:border-white/20" style={{ width: '64px', height: '64px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>
      <div className={`absolute right-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPostListOpen ? 'bottom-[calc(80vh+20px)]' : 'bottom-28'}`}>
        <button onClick={panToCurrentLocation} className="bg-[#1a1a1a] text-[#Decbb7] border border-[#Decbb7]/50 rounded-full p-4 shadow-lg transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center" style={{ width: '64px', height: '64px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22l10-4 10 4L12 2z" /></svg>
        </button>
      </div>

      <PostList posts={sortedPosts} onOpenStateChange={setIsPostListOpen} />
      {collectionModalPosts && <CollectionModal posts={collectionModalPosts} onClose={() => setCollectionModalPosts(null)} navigate={navigate} />}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={zoomLevel}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onIdle={handleIdle}
        onZoomChanged={handleZoomChanged}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          keyboardShortcuts: false,
          gestureHandling: "greedy",
          styles: mapStyles,
          backgroundColor: '#000000'
        }}
      >
        {currentLocation && (
          <OverlayViewF position={currentLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative flex items-center justify-center pointer-events-none" style={{ zIndex: 9999 }}>
              <div className="absolute w-20 h-20 bg-[#Decbb7] rounded-full opacity-30 animate-ping"></div>
              <div className="relative w-5 h-5 bg-[#Decbb7] border-2 border-[#1a1a1a] rounded-full shadow-[0_0_15px_#Decbb7] z-10"></div>
            </div>
          </OverlayViewF>
        )}

        {/* ズームアウト時は MarkerClustererF を使用して画像を再現 */}
        {zoomLevel < SHOW_POST_ZOOM_LEVEL ? (
          <MarkerClustererF styles={clusterStyles}>
            {(clusterer) => (
              posts.map((post) => (
                <Marker
                  key={`cluster-marker-${post.id}`}
                  position={{ lat: post.lat, lng: post.lng }}
                  clusterer={clusterer}
                  icon={{
                    url: pinIconUrl,
                    scaledSize: new window.google.maps.Size(40, 40),
                    anchor: new window.google.maps.Point(20, 40)
                  }}
                  onClick={() => {
                    map.panTo({ lat: post.lat, lng: post.lng });
                    map.setZoom(16);
                    navigate(`/post/${post.id}`);
                  }}
                />
              ))
            )}
          </MarkerClustererF>
        ) : (
          <>
            {/* ズームイン時：groupedPostsを使用（スタック or 詳細カード） */}
            {groupedPosts.map((group, index) => {
              const post = group[0];
              const isMultiple = group.length > 1;

              if (isMultiple) {
                return (
                  <OverlayViewF key={`stack-group-${index}`} position={{ lat: post.lat, lng: post.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 50 }}>
                      <StackMarker posts={group} onClick={() => setCollectionModalPosts(group)} />
                    </div>
                  </OverlayViewF>
                );
              }
              return null; // 単一投稿はradialPostsで処理
            })}

            {/* 単一投稿（力学シミュレーション適用） */}
            {adjustedPosts.map((post) => (
              <React.Fragment key={post.id}>
                {/* オフセットがある場合は元の位置にマーカーと線を表示 */}
                {post.hasOffset && (
                  <OverlayViewF position={{ lat: post.lat, lng: post.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <OriginConnector post={post} />
                  </OverlayViewF>
                )}

                <Marker position={{ lat: post.lat, lng: post.lng }} opacity={0} onClick={() => navigate(`/post/${post.id}`)} />
                <OverlayViewF position={{ lat: post.lat, lng: post.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <PostOverlay post={post} onClick={() => navigate(`/post/${post.id}`)} zoomLevel={zoomLevel} />
                </OverlayViewF>
              </React.Fragment>
            ))}
          </>
        )}

        {selectedPost && (
          <InfoWindow position={{ lat: selectedPost.lat, lng: selectedPost.lng }} onCloseClick={() => setSelectedPost(null)} zIndex={10000} options={{ headerContent: '<div class="hidden"></div>', padding: 0 }}>
            <div className="p-1 overflow-hidden">
              <PostDetail post={selectedPost} />
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}