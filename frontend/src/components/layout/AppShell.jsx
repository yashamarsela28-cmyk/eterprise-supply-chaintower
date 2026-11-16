import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Application shell.
 * The Transport workspace is intentionally full-bleed; every other module
 * occupies the padded operational canvas.
 */
export function AppShell() {
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const fullBleed = location.pathname === '/shipments';

  useEffect(() => {
    setMobileNav(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Header onToggleSidebar={() => setMobileNav((v) => !v)} />
      <div className="app-body">
        <Sidebar isOpen={mobileNav} isMobile onCloseMobile={() => setMobileNav(false)} />
        {mobileNav && <div className="rail-scrim" onClick={() => setMobileNav(false)} />}

        <main className={`app-main${fullBleed ? ' full-bleed' : ''}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ minHeight: fullBleed ? '100%' : undefined }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
