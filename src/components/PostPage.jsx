import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import exifr from 'exifr'; 
import imageCompression from 'browser-image-compression';
import { useJsApiLoader } from '@react-google-maps/api';

export default function PostPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const locationState = useLocation();
  const fileInputRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState(null);
  const [locationSource, setLocationSource] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const selectedFile = locationState.state?.selectedFile;
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  // ★修正: 住所を「日本語」で取得する設定を追加
  useEffect(() => {
    if (location && isLoaded && window.google) {
      const fetchAddress = async () => {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({ 
            location: { lat: location.lat, lng: location.lng },
            language: 'ja' // ★ここを追加：強制的に日本語にする
          });
          
          if (result.results && result.results[0]) {
            let address = result.results[0].formatted_address;
            // "日本、" や郵便番号を削除してスッキリさせる
            address = address.replace(/^日本、/, ''); 
            address = address.replace(/〒\d{3}-\d{4}\s*/, ''); 
            
            setLocationSource(address);
          } else {
            setLocationSource("住所不明");
          }
        } catch (error) {
          console.error("住所の取得に失敗:", error);
          setLocationSource("位置情報のみ");
        }
      };
      fetchAddress();
    }
  }, [location, isLoaded]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile) => {
    if (!selectedFile) return;
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(selectedFile, options);
      
      setFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
      extractLocation(selectedFile);
    } catch (error) {
      console.error(error);
      alert("画像の読み込みに失敗しました");
    }
  };

  const extractLocation = async (originalFile) => {
    setIsLoadingLocation(true);
    setLocationSource("位置情報を解析中...");
    try {
      const gps = await exifr.gps(originalFile);
      if (gps && gps.latitude && gps.longitude) {
        setLocation({ lat: gps.latitude, lng: gps.longitude });
        // locationSourceはuseEffectで住所に上書きされます
        setIsLoadingLocation(false);
      } else {
        fetchCurrentPosition();
      }
    } catch (error) {
      fetchCurrentPosition();
    }
  };

  const fetchCurrentPosition = () => {
    if (!navigator.geolocation) {
      setIsLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoadingLocation(false);
      },
      () => {
        setIsLoadingLocation(false);
        setLocationSource("位置情報なし");
        alert("位置情報が取得できませんでした。");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUpload = async () => {
    if (!file || !location) return;
    setIsUploading(true);

    try {
      const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "posts"), {
        imageUrl: downloadURL,
        caption: caption,
        lat: location.lat,
        lng: location.lng,
        locationSource: locationSource, // 日本語の住所が保存されます
        userId: currentUser.uid,
        username: currentUser.displayName || "名無し",
        createdAt: serverTimestamp(),
      });

      alert("投稿しました！");
      navigate('/');
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#Decbb7] flex flex-col font-sans">
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#Decbb7]/20 bg-[#1a1a1a] sticky top-0 z-50">
        <button 
          onClick={() => navigate('/')} 
          className="text-sm font-bold opacity-70 hover:opacity-100 transition"
        >
          キャンセル
        </button>
        <h1 className="font-bold text-lg tracking-wider">NEW RECORD</h1>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center max-w-md mx-auto w-full">
        
        <div className="w-full aspect-square bg-white/5 rounded-2xl border-2 border-[#Decbb7]/20 border-dashed flex items-center justify-center overflow-hidden relative mb-3">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-[#Decbb7]/50 animate-pulse">
              <p className="text-sm font-bold">写真を読み込んでいます...</p>
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current.click()}
          className="flex items-center space-x-2 text-[#Decbb7] opacity-80 hover:opacity-100 hover:bg-white/5 px-4 py-2 rounded-full transition mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-bold underline">写真を撮り直す</span>
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
        />

        <div className="w-full mb-2 text-xs font-bold uppercase tracking-wider text-center h-6 overflow-hidden text-ellipsis whitespace-nowrap px-4">
          {isLoadingLocation ? (
            <span className="text-orange-400 animate-pulse">📡 GPS取得中...</span>
          ) : location ? (
            <span className="text-[#Decbb7]">📍 {locationSource}</span>
          ) : (
            <span className="text-red-400 opacity-50">LOCATION MISSING</span>
          )}
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="この場所での思い出..."
          className="w-full bg-white/5 text-[#Decbb7] p-4 rounded-xl mb-8 resize-none focus:outline-none focus:bg-white/10 transition border border-transparent focus:border-[#Decbb7]/30 h-32 placeholder-[#Decbb7]/30"
        />

        <button
          onClick={handleUpload}
          disabled={!location || isUploading || !file}
          className={`w-full py-4 font-bold rounded-full text-[#1a1a1a] text-lg transition-all shadow-xl ${
            location && file && !isUploading
              ? 'bg-[#Decbb7] hover:bg-white hover:scale-105 active:scale-95' 
              : 'bg-gray-700 cursor-not-allowed opacity-50'
          }`}
        >
          {isUploading ? "保存中..." : "記録を残す"}
        </button>
      </div>
    </div>
  );
}