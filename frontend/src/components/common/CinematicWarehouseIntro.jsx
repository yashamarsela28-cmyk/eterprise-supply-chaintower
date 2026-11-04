import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Warehouse, Layers, Box, Truck, Activity } from 'lucide-react';

/**
 * CINEMATIC WAREHOUSE CONSTRUCTION EXPERIENCE
 *
 * World-class 10-second opening animation that progressively constructs
 * a modern automated warehouse facility with professional cinematic quality.
 *
 * Timeline:
 * 0-2s: Foundation & architectural grid construction
 * 2-4s: Warehouse structure assembly (steel beams, walls, roof)
 * 4-6s: Gates opening & interior lighting activation
 * 6-8s: Automation systems & operational technology reveal
 * 8-10s: Brand reveal & smooth transition to dashboard
 */
export function CinematicWarehouseIntro({ onComplete }) {
  const [stage, setStage] = useState('init'); // init -> foundation -> structure -> gates -> systems -> brand -> complete
  const [constructionProgress, setConstructionProgress] = useState(0);

  useEffect(() => {
    // Respect accessibility preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setTimeout(() => onComplete(), 200);
      return;
    }

    // Professional cinematic sequence orchestration
    const timeline = [
      { delay: 100, action: () => setStage('foundation') },
      { delay: 2000, action: () => setStage('structure') },
      { delay: 4000, action: () => setStage('gates') },
      { delay: 6000, action: () => setStage('systems') },
      { delay: 8000, action: () => setStage('brand') },
      { delay: 10000, action: () => setStage('complete') },
      { delay: 10400, action: () => onComplete() }
    ];

    // Progressive construction animation
    const progressInterval = setInterval(() => {
      setConstructionProgress(prev => (prev >= 100 ? 100 : prev + 0.5));
    }, 50);

    const timers = timeline.map(({ delay, action }) => setTimeout(action, delay));

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  if (stage === 'complete') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      className="cinematic-warehouse-intro"
    >
      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(247, 247, 245, 0.08)',
          border: '1px solid rgba(247, 247, 245, 0.15)',
          borderRadius: '6px',
          color: 'rgba(247, 247, 245, 0.7)',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          zIndex: 10001,
          fontFamily: 'Inter, sans-serif'
        }}
      >
        Skip Intro
      </motion.button>

      {/* Cinematic Warehouse Construction Scene */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1500px'
        }}
      >
        {/* Ambient Background Lighting */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: stage === 'init' || stage === 'foundation' ? 0.3 : 0.5, scale: 1.2 }}
          transition={{ duration: 2, ease: [0.19, 1, 0.22, 1] }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none'
          }}
        />

        {/* Stage 1: Foundation & Architectural Grid (0-2s) */}
        <AnimatePresence>
          {stage === 'foundation' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Construction Grid */}
              <svg width="800" height="500" style={{ opacity: 0.4 }}>
                {/* Horizontal grid lines */}
                {[...Array(10)].map((_, i) => (
                  <motion.line
                    key={`h-${i}`}
                    x1="0"
                    y1={i * 50}
                    x2="800"
                    y2={i * 50}
                    stroke="var(--color-construction-grid)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
                {/* Vertical grid lines */}
                {[...Array(16)].map((_, i) => (
                  <motion.line
                    key={`v-${i}`}
                    x1={i * 50}
                    y1="0"
                    x2={i * 50}
                    y2="500"
                    stroke="var(--color-construction-grid)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
              </svg>

              {/* Foundation Outline */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.19, 1, 0.22, 1] }}
                style={{
                  position: 'absolute',
                  width: '600px',
                  height: '300px',
                  border: '2px solid var(--color-industrial-steel)',
                  borderRadius: '4px',
                  boxShadow: '0 0 30px rgba(139, 146, 153, 0.3)'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 2: Warehouse Structure Assembly (2-4s) */}
        <AnimatePresence>
          {(stage === 'structure' || stage === 'gates' || stage === 'systems' || stage === 'brand') && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              style={{
                position: 'absolute',
                width: '700px',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Warehouse Structure Container */}
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Main Warehouse Building */}
                <svg width="700" height="400" viewBox="0 0 700 400">
                  {/* Foundation */}
                  <motion.rect
                    x="50"
                    y="300"
                    width="600"
                    height="20"
                    fill="var(--color-industrial-concrete)"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'center' }}
                  />

                  {/* Left Wall */}
                  <motion.rect
                    x="50"
                    y="100"
                    width="20"
                    height="200"
                    fill="var(--color-industrial-steel)"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'bottom' }}
                  />

                  {/* Right Wall */}
                  <motion.rect
                    x="630"
                    y="100"
                    width="20"
                    height="200"
                    fill="var(--color-industrial-steel)"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'bottom' }}
                  />

                  {/* Steel Roof Beams (3 parallel beams) */}
                  <motion.line
                    x1="70"
                    y1="100"
                    x2="630"
                    y2="100"
                    stroke="var(--color-industrial-beam)"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.line
                    x1="70"
                    y1="120"
                    x2="630"
                    y2="120"
                    stroke="var(--color-industrial-beam)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <motion.line
                    x1="70"
                    y1="140"
                    x2="630"
                    y2="140"
                    stroke="var(--color-industrial-beam)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />

                  {/* Warehouse Gates (Closed initially) */}
                  <motion.rect
                    x="250"
                    y="150"
                    width="200"
                    height="150"
                    fill="#1a1a1a"
                    stroke="var(--color-industrial-steel)"
                    strokeWidth="2"
                    initial={{ scaleY: 0 }}
                    animate={{
                      scaleY: 1,
                      x: stage === 'gates' || stage === 'systems' || stage === 'brand' ? -100 : 0
                    }}
                    transition={{
                      scaleY: { duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] },
                      x: { duration: 1.2, delay: 0, ease: [0.76, 0, 0.24, 1] }
                    }}
                    style={{ transformOrigin: 'bottom' }}
                  />

                  {/* Interior Rack Storage (visible when gates open) */}
                  {(stage === 'gates' || stage === 'systems' || stage === 'brand') && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.rect
                          key={`rack-${i}`}
                          x={200 + i * 120}
                          y={200}
                          width="80"
                          height="90"
                          fill="none"
                          stroke="var(--color-industrial-concrete)"
                          strokeWidth="1.5"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 0.6, scale: 1 }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                        />
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 3: Lighting Activation & Interior Glow (4-6s) */}
        <AnimatePresence>
          {(stage === 'gates' || stage === 'systems' || stage === 'brand') && (
            <>
              {/* Interior Warehouse Lighting */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute',
                  width: '500px',
                  height: '250px',
                  background: 'radial-gradient(ellipse, var(--color-warehouse-lighting) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  pointerEvents: 'none'
                }}
              />

              {/* Operational Indicator Lights */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '35%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '40px'
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={`light-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.15 }}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: i < 2 ? 'var(--color-success)' : 'var(--color-accent-blue)',
                      boxShadow: `0 0 12px ${i < 2 ? 'var(--color-success)' : 'var(--color-accent-blue)'}`,
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  />
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Stage 4: Automation Systems & Technology (6-8s) */}
        <AnimatePresence>
          {(stage === 'systems' || stage === 'brand') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                position: 'absolute',
                top: '20%',
                display: 'flex',
                gap: '60px',
                alignItems: 'center'
              }}
            >
              {/* Automation Icons */}
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 0.7, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Box size={32} color="var(--color-cyan-accent)" strokeWidth={1.5} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: 180 }}
                animate={{ opacity: 0.7, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Truck size={32} color="var(--color-amber-indicator)" strokeWidth={1.5} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Activity size={32} color="var(--color-success)" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 5: Brand Reveal (8-10s) */}
        <AnimatePresence>
          {stage === 'brand' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
              style={{
                position: 'absolute',
                textAlign: 'center',
                maxWidth: '700px',
                padding: '2rem',
                zIndex: 10000
              }}
            >
              {/* Logo Icon */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}
              >
                <Warehouse
                  size={64}
                  color="var(--color-text-primary)"
                  strokeWidth={1.5}
                  style={{ filter: 'drop-shadow(0 0 20px rgba(247, 247, 245, 0.3))' }}
                />
                <Layers
                  size={48}
                  color="var(--color-accent-blue)"
                  strokeWidth={1.5}
                  style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))' }}
                />
              </motion.div>

              {/* Brand Title */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                ENTERPRISE SUPPLY CHAIN
                <br />
                CONTROL TOWER
              </motion.h1>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                style={{
                  fontSize: '1rem',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '1rem'
                }}
              >
                Intelligence · Visibility · Control
              </motion.p>

              {/* Animated Loading Bar */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '300px' }}
                transition={{ duration: 0.8, delay: 0.8 }}
                style={{
                  height: '2px',
                  backgroundColor: 'rgba(247, 247, 245, 0.1)',
                  borderRadius: '999px',
                  margin: '0 auto',
                  overflow: 'hidden'
                }}
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--color-text-primary)',
                    boxShadow: '0 0 10px rgba(247, 247, 245, 0.5)'
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default CinematicWarehouseIntro;
