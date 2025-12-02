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
      extractLocation(selectedFile); 
    } catch (error) {
      console.error("画像処理エラー:", error);
      alert("画像の読み込みに失敗しました");
    }
  };

  const extractLocation = async (originalFile) => {
    setIsLoadingLocation(true);
    try {
      const gps = await exifr.gps(originalFile);
      if (gps && gps.latitude && gps.longitude) {
        setLocation({ lat: gps.latitude, lng: gps.longitude });
        setLocationSource("写真の位置情報");
        setIsLoadingLocation(false);
      } else {
        fetchCurrentPosition();
      }
    } catch (error) {
      console.log("Exif解析エラー:", error);
      fetchCurrentPosition(); 
    }
  };

  const fetchCurrentPosition = () => {
    if (!navigator.geolocation) {
      alert("お使いのブラウザは位置情報をサポートしていません");
      setIsLoadingLocation(false);
      return;
    }
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationSource("現在地");
        setIsLoadingLocation(false);
      },
      (err) => {
        console.warn("高精度GPS失敗、低精度で再試行します...", err);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLocationSource("現在地(低精度)");
            setIsLoadingLocation(false);
          },
          (err2) => {
            console.error("位置情報取得完全失敗:", err2);
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
      const timestamp = Date.now();
      const storageRef = ref(storage, `posts/${currentUser.uid}/${timestamp}_${file.name}`);
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

      // alert("投稿しました！"); // No alert for smoother UX
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
      <div className="">
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-[#Decbb7] text-[#1a1a1a] rounded-full p-4 shadow-[0_0_30px_rgba(222,203,183,0.4)] transition-all transform hover:scale-110 flex items-center justify-center border-2 border-transparent hover:border-white/20"
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/20 to-black pointer-events-none"></div>
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain z-10 shadow-2xl" />
            <button onClick={handleCancel} className="absolute top-6 left-6 z-20 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-[#121212] p-6 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 pb-10">
             <div className="flex items-center justify-center text-xs mb-4 font-sans tracking-wider">
               {isLoadingLocation ? (
                 <span className="text-[#Decbb7] animate-pulse font-bold flex items-center gap-2">
                   <span className="w-2 h-2 bg-[#Decbb7] rounded-full animate-ping"/> LOCATING...
                 </span>
               ) : location ? (
                 <span className="text-[#Decbb7] font-bold flex items-center gap-2 border border-[#Decbb7]/30 px-3 py-1 rounded-full bg-[#Decbb7]/10">
                   📍 {locationSource}
                 </span>
               ) : (
                 <span className="text-red-500 font-bold flex items-center gap-2">
                   ⚠ NO LOCATION
                 </span>
               )}
             </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full bg-[#1a1a1a] text-white p-4 rounded-xl mb-4 resize-none focus:outline-none border border-white/5 focus:border-[#Decbb7]/50 transition-colors placeholder-white/20 font-sans"
              rows="3"
            />
            
            <button
              onClick={handleUpload}
              disabled={!location || isLoadingLocation} 
              className={`w-full py-4 font-bold rounded-xl text-[#1a1a1a] transition-all transform active:scale-98 font-display tracking-wide ${
                location ? 'bg-[#Decbb7] hover:bg-[#eaddcf] shadow-[0_0_20px_rgba(222,203,183,0.2)]' : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {isLoadingLocation ? "WAITING FOR GPS..." : "SHARE RECORD"}
            </button>
          </div>
        </div>
      )}

      {step === 'uploading' && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#Decbb7] mb-6"></div>
          <p className="font-display tracking-widest text-[#Decbb7]">SAVING RECORD...</p>
        </div>
      )}
    </>
  );
}