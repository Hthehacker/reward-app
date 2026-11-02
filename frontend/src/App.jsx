import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import GiveawayPage from './pages/Giveaway/GiveawayPage.jsx';
import GiveawayDetailPage from './pages/GiveawayDetail/GiveawayDetailPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminDashboard from './pages/Admin/Dashboard.jsx';
import AdminGiveaways from './pages/Admin/Giveaways.jsx';
import AdminPrizes from './pages/Admin/Prizes.jsx';
import AdminUsers from './pages/Admin/Users.jsx';
import AdminCoins from './pages/Admin/Coins.jsx';
import AdminParticipants from './pages/Admin/Participants.jsx';
import AdminWinners from './pages/Admin/Winners.jsx';
import AdminAnalytics from './pages/Admin/Analytics.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GiveawayPage />} />
          <Route path="/giveaway/:slug" element={<GiveawayDetailPage />} />
          {/* Admin dashboard – protected to admins only */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="giveaways" replace />} />
            <Route path="giveaways" element={<AdminGiveaways />} />
            <Route path="prizes" element={<AdminPrizes />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coins" element={<AdminCoins />} />
            <Route path="participants" element={<AdminParticipants />} />
            <Route path="winners" element={<AdminWinners />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
