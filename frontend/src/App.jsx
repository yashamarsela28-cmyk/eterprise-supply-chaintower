import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ToastProvider } from './context/ToastContext';
import { AppRoutes } from './routes';
import { CinematicWarehouseIntro } from './components/common/CinematicWarehouseIntro';

export function App() {
  const [showIntro, setShowIntro] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    // The cinematic warehouse opening is preserved exactly as implemented:
    // once per browser session, before the control tower is mounted.
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
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          {showIntro && <CinematicWarehouseIntro onComplete={handleIntroComplete} />}
          {introComplete && <AppRoutes />}
        </ToastProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}

export default App;
