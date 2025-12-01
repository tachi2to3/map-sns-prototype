import { useAuth } from './context/AuthContext';
import Signup from './components/Signup';
import Map from './components/Map';

function App() {
  const { currentUser } = useAuth();

  // ユーザー情報があれば地図を、なければ登録画面を表示
  return (
    <>
      {currentUser ? <Map /> : <Signup />}
    </>
  );
}

export default App;