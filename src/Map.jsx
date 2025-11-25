import {
  GoogleMap,
  LoadScriptNext,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import usePosts from "./usePosts";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const center = {
  lat: 35.1815, // 名古屋駅
  lng: 136.9066,
};

function Map() {
  const { posts } = usePosts();
  const [activePost, setActivePost] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [title, setTitle] = useState("");

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setClickedLocation({ lat, lng });
    setTitle(""); // フォーム初期化
  };

  const handleSubmit = async () => {
    if (!title || !clickedLocation) return;

    await addDoc(collection(db, "posts"), {
      title,
      lat: clickedLocation.lat,
      lng: clickedLocation.lng,
      createdAt: serverTimestamp(),
    });

    setClickedLocation(null);
    setTitle("");
  };

  return (
    <LoadScriptNext googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onClick={handleMapClick}
      >
        {/* 投稿マーカー表示 */}
        {posts.map((post) => (
          <Marker
            key={post.id}
            position={{ lat: post.lat, lng: post.lng }}
            onClick={() => setActivePost(post)}
          />
        ))}

        {/* 投稿の吹き出し */}
        {activePost && (
          <InfoWindow
            position={{ lat: activePost.lat, lng: activePost.lng }}
            onCloseClick={() => setActivePost(null)}
          >
            <div>
              <h3>{activePost.title}</h3>
              <p>
                {activePost.createdAt
                  ? new Date(activePost.createdAt.seconds * 1000).toLocaleString()
                  : "日時未設定"}
              </p>
            </div>
          </InfoWindow>
        )}

        {/* 地図クリック時の投稿フォーム */}
        {clickedLocation && (
          <InfoWindow
            position={clickedLocation}
            onCloseClick={() => setClickedLocation(null)}
          >
            <div style={{ maxWidth: 220 }}>
              <input
                type="text"
                placeholder="投稿タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  marginBottom: 8,
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                onClick={handleSubmit}
                style={{
                  width: "100%",
                  backgroundColor: "#4f46e5",
                  color: "white",
                  padding: "6px",
                  borderRadius: "4px",
                  border: "none",
                }}
              >
                投稿する
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScriptNext>
  );
}

export default Map;