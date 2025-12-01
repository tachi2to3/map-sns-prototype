import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Map from './components/Map';

function App() {
  const { currentUser } = useAuth();

  // ユーザー情報があれば地図を、なければ認証画面を表示
  return (
    <>
      {currentUser ? <Map /> : <Auth />}
    </>
  );
}

export default App;