// ─── App Root ─────────────────────────────────────────────────────────────
// Sets up React Router and passes the anonymous user ID to all pages
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAnonUser } from './hooks/useAnonUser';
import Navbar        from './components/Navbar';
import HomePage      from './pages/HomePage';
import ChatPage      from './pages/ChatPage';
import ResourcesPage from './pages/ResourcesPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const { userId } = useAnonUser();

  return (
    <BrowserRouter>
      <Navbar userId={userId} />
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/chat"      element={<ChatPage userId={userId} />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Catch-all → Home */}
        <Route path="*"          element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
