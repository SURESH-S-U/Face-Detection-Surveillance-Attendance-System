import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LiveFeed from './pages/LiveFeed';
import Attendance from './pages/Attendance';
import Venue from './pages/Venue';
import Chatbot from './pages/chatbot';
import Register from './pages/Register';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="live" element={<LiveFeed />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="venue" element={<Venue />} />
          <Route path='register' element={<Register/>} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path='*' element={<div>404 page</div>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;