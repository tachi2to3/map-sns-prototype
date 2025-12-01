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

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="relative">
      {/* 仮のログアウトボタン（地図の上に表示） */}
      <button 
        onClick={() => auth.signOut()}
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-white text-red-600 rounded shadow hover:bg-gray-100"
      >
        ログアウト
      </button>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{ disableDefaultUI: false, zoomControl: true }}
      >
        <Marker position={defaultCenter} />
      </GoogleMap>
    </div>
  );
}