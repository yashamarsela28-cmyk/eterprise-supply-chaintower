import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes';
import { CinematicWarehouseIntro } from './components/common/CinematicWarehouseIntro';

export function App() {
  const [showIntro, setShowIntro] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    // Check if user has seen the cinematic intro in this session
    const hasSeenIntro = sessionStorage.getItem('cinematicIntroSeen');

    if (!hasSeenIntro) {
      setShowIntro(true);
    } else {
      setIntroComplete(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('cinematicIntroSeen', 'true');
    setShowIntro(false);
    setIntroComplete(true);
  };

  return (
    <BrowserRouter>
      <ToastProvider>
        {showIntro && <CinematicWarehouseIntro onComplete={handleIntroComplete} />}
        {introComplete && <AppRoutes />}
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
