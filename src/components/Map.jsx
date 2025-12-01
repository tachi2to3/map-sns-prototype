import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { auth } from '../firebase'; // ログアウト用にインポート

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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);

    // ブラウザ対応チェック
    if (!navigator.geolocation) {
      setLocationError('お使いのブラウザは位置情報をサポートしていません。');
      setCurrentLocation(defaultCenter);
      setIsGettingLocation(false);
      return;
    }

    // 現在地取得
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      // 成功時
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);
        setIsGettingLocation(false);
        setLocationError(null);

        // 地図の中心を移動
        map.panTo(location);
      },
      // エラー時
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報の使用が拒否されました。デフォルト位置を表示します。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が取得できませんでした。デフォルト位置を表示します。';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。デフォルト位置を表示します。';
            break;
          default:
            errorMessage = '位置情報の取得中にエラーが発生しました。デフォルト位置を表示します。';
        }
        setLocationError(errorMessage);
        setCurrentLocation(defaultCenter);
        setIsGettingLocation(false);
      },
      // オプション
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (loadError) return <div className="flex items-center justify-center h-screen">Error loading maps</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading Maps...</div>;

  return (
    <div className="relative">
      {/* 仮のログアウトボタン（地図の上に表示） */}
      <button
        onClick={() => auth.signOut()}
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-white text-red-600 rounded shadow hover:bg-gray-100"
      >
        ログアウト
      </button>

      {locationError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 px-6 py-3 bg-red-100 border border-red-400 text-red-700 rounded shadow-lg max-w-md">
          <p className="text-sm">{locationError}</p>
        </div>
      )}

      {isGettingLocation && (
        <div className="absolute inset-0 z-20 bg-white bg-opacity-75 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700">現在地を取得中...</p>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation || defaultCenter}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{ disableDefaultUI: false, zoomControl: true }}
      >
        {currentLocation && (
          <Marker
            position={currentLocation}
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
      </GoogleMap>
    </div>
  );
}