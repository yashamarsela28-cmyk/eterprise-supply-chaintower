import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ textAlign: 'center', maxWidth: 420 }}
      >
        <div className="eyebrow" style={{ marginBottom: 10 }}>NAVIGATION / UNRESOLVED</div>
        <div className="mono" style={{ fontSize: 54, letterSpacing: '-0.06em', color: 'var(--color-text-dim)' }}>404</div>
        <h1 style={{ fontSize: 18, marginTop: 6 }}>This route is not in the control tower</h1>
        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.6 }}>
          The address you requested does not map to an operational module. Return to the network overview to continue.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={12} /> Back to control tower
        </button>
        <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-text-dim)', fontSize: 9.5 }}>
          <Compass size={11} /> Enterprise Supply Chain Control Tower
        </div>
      </motion.div>
    </div>
  );
}

export default NotFoundPage;
