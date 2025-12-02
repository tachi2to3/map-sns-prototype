import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import exifr from 'exifr'; 
import imageCompression from 'browser-image-compression';

export default function PostUploader({ onPostSuccess }) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState('initial'); 
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState(null);
  const [locationSource, setLocationSource] = useState("");
  // ★追加：GPS取得中フラグ
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const compressionOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      console.log("圧縮開始...");
      const compressedFile = await imageCompression(selectedFile, compressionOptions);
      setFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
      setStep('preview');

      // 位置情報の取得開始（圧縮前の元のファイルを使う）
      extractLocation(selectedFile); 

    } catch (error) {
      console.error("画像処理エラー:", error);
      alert("画像の読み込みに失敗しました");
    }
  };

  const extractLocation = async (originalFile) => {
    setIsLoadingLocation(true); // ロード開始
    try {
      // 1. 写真のExif情報をチェック
      const gps = await exifr.gps(originalFile);
      if (gps && gps.latitude && gps.longitude) {
        setLocation({ lat: gps.latitude, lng: gps.longitude });
        setLocationSource("写真の位置情報");
        setIsLoadingLocation(false);
      } else {
        // 2. 写真にGPSがない場合、スマホの現在地を取得
        fetchCurrentPosition();
      }
    } catch (error) {
      console.log("Exif解析エラー:", error);
      fetchCurrentPosition(); 
    }
  };

  // ★GPS取得ロジックの強化版
  const fetchCurrentPosition = () => {
    if (!navigator.geolocation) {
      alert("お使いのブラウザは位置情報をサポートしていません");
      setIsLoadingLocation(false);
      return;
    }

    // オプション設定: タイムアウトを10秒に延長
    const options = {
      enableHighAccuracy: true, // GPS優先
      timeout: 10000,           // 10秒待つ
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationSource("現在地");
        setIsLoadingLocation(false);
      },
      (err) => {
        console.warn("高精度GPS失敗、低精度で再試行します...", err);
        // ★失敗時のフォールバック：低精度（Wi-Fiなど）で再トライ
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationSource("現在地(低精度)");
            setIsLoadingLocation(false);
          },
          (err2) => {
            console.error("位置情報取得完全失敗:", err2);
            // スマホ実機でHTTPSでない場合はここで失敗します
            alert("位置情報が取得できませんでした。\n※スマホの場合はHTTPS(ngrok等)が必要です。");
            setIsLoadingLocation(false);
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      options
    );
  };

  const handleUpload = async () => {
    if (!file || !location) {
      alert("位置情報がまだ取得できていません。");
      return;
    }
    setStep('uploading');

    try {
      const storageRef = ref(storage, `posts/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, "posts"), {
        imageUrl: downloadURL,
        caption: caption,
        lat: location.lat,
        lng: location.lng,
        locationSource: locationSource,
        userId: currentUser.uid,
        username: currentUser.username || "名無し",
        userIcon: currentUser.photoURL || "",
        createdAt: serverTimestamp(),
      });

      alert("投稿しました！");
      handleCancel();
      if (onPostSuccess) onPostSuccess();

    } catch (error) {
      console.error(error);
      alert("投稿エラーが発生しました");
      setStep('preview');
    }
  };

  const handleCancel = () => {
    setStep('initial');
    setFile(null);
    setPreviewUrl(null);
    setCaption("");
    setLocation(null);
    setIsLoadingLocation(false);
  };

  return (
    <>
      <div className="absolute bottom-6 right-6 z-50">
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-xl transition-all transform hover:scale-110 flex items-center justify-center"
          style={{ width: '64px', height: '64px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/>
      </div>

      {step === 'preview' && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col h-full w-full">
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
            <button onClick={handleCancel} className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2">
              ✕
            </button>
          </div>

          <div className="bg-white p-5 rounded-t-2xl shadow-lg pb-10">
             <div className="flex items-center text-xs text-gray-500 mb-2">
               {/* ★GPS取得中の表示を追加 */}
               {isLoadingLocation ? (
                 <span className="text-orange-500 animate-pulse font-bold">📡 位置情報を取得中...</span>
               ) : location ? (
                 <span className="text-green-600 font-bold">📍 {locationSource}を使用中</span>
               ) : (
                 <span className="text-red-500 font-bold">⚠ 位置情報なし</span>
               )}
             </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="キャプションを入力..."
              className="w-full bg-gray-100 p-3 rounded-xl mb-3 resize-none focus:outline-none"
              rows="3"
            />
            
            <button
              onClick={handleUpload}
              // ★ロード中はボタンを押せないように制御
              disabled={!location || isLoadingLocation} 
              className={`w-full py-3 font-bold rounded-xl text-white transition-colors ${
                location ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoadingLocation ? "位置情報を取得しています..." : "シェアする"}
            </button>
          </div>
        </div>
      )}

      {step === 'uploading' && (
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-80 flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mb-4"></div>
          <p>保存中...</p>
        </div>
      )}
    </>
  );
}