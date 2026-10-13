import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import GiveawayPage from './pages/Giveaway/GiveawayPage.jsx';
import GiveawayDetailPage from './pages/GiveawayDetail/GiveawayDetailPage.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GiveawayPage />} />
          <Route path="/giveaway/:slug" element={<GiveawayDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
