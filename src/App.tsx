import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Calculator } from './components/Calculator';
import { Header } from './components/Header';
import { AuthForms } from './components/AuthForms';
import { UserProfile } from './components/UserProfile';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      setShowProfile(false);
    } else if (location.pathname === '/profile') {
      setShowProfile(true);
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || showAuth) {
    return <AuthForms onSuccess={() => setShowAuth(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Header 
        onProfileClick={() => {
          const newShowProfile = !showProfile;
          setShowProfile(newShowProfile);
          navigate(newShowProfile ? '/profile' : '/');
        }} 
        showProfile={showProfile} 
      />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Calculator />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </main>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;