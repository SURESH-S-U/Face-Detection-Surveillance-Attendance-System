import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LiveFeed from './pages/LiveFeed';
import Attendance from './pages/Attendance';
import VideoAnalysisPage from './pages/upload';
import Venue from './pages/Venue';
import Parking from './pages/Parking';
import Chatbot from './pages/chatbot';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="live" element={<LiveFeed />} />
          <Route path="upload" element={<VideoAnalysisPage />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="venue" element={<Venue />} />
          <Route path="parking" element={<Parking />} />
          <Route path="chatbot" element={<Chatbot />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;