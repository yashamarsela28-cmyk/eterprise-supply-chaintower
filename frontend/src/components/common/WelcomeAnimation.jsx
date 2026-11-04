import React, { useState, useEffect } from 'react';
import { Warehouse, Layers } from 'lucide-react';

/**
 * Cinematic Warehouse Welcome Animation
 * Premium first-impression experience with industrial gate opening sequence
 */
export function WelcomeAnimation({ onComplete }) {
  const [stage, setStage] = useState('loading'); // loading -> gates -> branding -> complete
  const [gateProgress, setGateProgress] = useState(0);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Skip animation immediately for accessibility
      setTimeout(() => onComplete(), 100);
      return;
    }

    // Animation sequence timing
    const sequence = [
      { delay: 300, action: () => setStage('loading') },
      { delay: 1200, action: () => setStage('gates') },
      { delay: 1400, action: () => {
        // Animate gate opening
        let progress = 0;
        const gateInterval = setInterval(() => {
          progress += 2;
          setGateProgress(progress);
          if (progress >= 100) {
            clearInterval(gateInterval);
            setStage('branding');
          }
        }, 15);
      }},
      { delay: 3200, action: () => setStage('complete') },
      { delay: 4000, action: () => onComplete() }
    ];

    const timers = sequence.map(({ delay, action }) => setTimeout(action, delay));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  if (stage === 'complete') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      className="welcome-animation"
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: 'var(--space-6)',
          right: 'var(--space-6)',
          padding: '0.5rem 1rem',
          backgroundColor: 'rgba(247, 247, 245, 0.08)',
          border: '1px solid rgba(247, 247, 245, 0.15)',
          borderRadius: 'var(--radius-md)',
          color: 'rgba(247, 247, 245, 0.6)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(247, 247, 245, 0.12)';
          e.currentTarget.style.color = 'rgba(247, 247, 245, 0.9)';
          e.currentTarget.style.borderColor = 'rgba(247, 247, 245, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(247, 247, 245, 0.08)';
          e.currentTarget.style.color = 'rgba(247, 247, 245, 0.6)';
          e.currentTarget.style.borderColor = 'rgba(247, 247, 245, 0.15)';
        }}
      >
        Skip Intro
      </button>

      {/* Initial Loading Stage */}
      {stage === 'loading' && (
        <div
          style={{
            animation: 'fadeIn 0.6s ease-out',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              fontWeight: 800,
              fontSize: '26px',
              letterSpacing: '-0.03em',
              boxShadow: '0 0 40px rgba(247, 247, 245, 0.3)'
            }}
          >
            CT
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'rgba(247, 247, 245, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600
            }}
          >
            Initializing Control Tower
          </div>
        </div>
      )}

      {/* Warehouse Gate Opening Stage */}
      {stage === 'gates' && (
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
          {/* Background Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />

          {/* Warehouse Gate Container */}
          <div
            style={{
              position: 'relative',
              width: '600px',
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Left Gate Door */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '0',
                width: '50%',
                height: '100%',
                backgroundColor: '#1a1a1a',
                border: '2px solid #2a2a2a',
                borderLeft: 'none',
                transform: `translateX(${-100 + gateProgress}%)`,
                transition: 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)',
                boxShadow: '-5px 0 20px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
              }}
            >
              {/* Gate Panel Details */}
              <div style={{ padding: 'var(--space-6)' }}>
                <div style={{ width: '100%', height: '80px', borderBottom: '1px solid #2a2a2a', marginBottom: 'var(--space-6)' }} />
                <div style={{ width: '100%', height: '80px', borderBottom: '1px solid #2a2a2a', marginBottom: 'var(--space-6)' }} />
                <div style={{ width: '100%', height: '80px', borderBottom: '1px solid #2a2a2a' }} />
              </div>
            </div>

            {/* Right Gate Door */}
            <div
              style={{
                position: 'absolute',
                right: '50%',
                top: '0',
                width: '50%',
                height: '100%',
                backgroundColor: '#1a1a1a',
                border: '2px solid #2a2a2a',
                borderRight: 'none',
                transform: `translateX(${100 - gateProgress}%)`,
                transition: 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)',
                boxShadow: '5px 0 20px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
              }}
            >
              {/* Gate Panel Details */}
              <div style={{ padding: 'var(--space-6)' }}>
                <div style={{ width: '100%', height: '80px', borderBottom: '1px solid #2a2a2a', marginBottom: 'var(--space-6)' }} />
                <div style={{ width: '100%', height: '80px', borderBottom: '1px solid #2a2a2a', marginBottom: 'var(--space-6)' }} />
                <div style={{ width: '100%', height: '80px', borderBottom: '1px solid #2a2a2a' }} />
              </div>
            </div>

            {/* Center Warehouse Icon - Revealed */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                opacity: gateProgress / 100,
                transform: `scale(${0.8 + (gateProgress / 100) * 0.2})`,
                transition: 'all 0.8s cubic-bezier(0.65, 0, 0.35, 1)'
              }}
            >
              <Warehouse
                size={120}
                style={{
                  color: 'var(--color-text-primary)',
                  filter: 'drop-shadow(0 0 30px rgba(247, 247, 245, 0.3))'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Branding Reveal Stage */}
      {stage === 'branding' && (
        <div
          style={{
            animation: 'fadeIn 0.8s ease-out',
            textAlign: 'center',
            maxWidth: '600px',
            padding: 'var(--space-8)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)'
            }}
          >
            <Warehouse
              size={56}
              style={{
                color: 'var(--color-text-primary)',
                filter: 'drop-shadow(0 0 20px rgba(247, 247, 245, 0.2))'
              }}
            />
            <Layers
              size={40}
              style={{
                color: 'var(--color-accent-blue)',
                filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 'var(--font-size-5xl)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-3)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1
            }}
          >
            Control Tower
          </h1>

          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-2)',
              fontWeight: 500
            }}
          >
            Enterprise Supply Chain Command Center
          </p>

          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: 600
            }}
          >
            Real-Time Multi-Echelon Intelligence
          </p>

          {/* Loading Progress Bar */}
          <div
            style={{
              marginTop: 'var(--space-8)',
              width: '200px',
              height: '2px',
              backgroundColor: 'rgba(247, 247, 245, 0.1)',
              margin: 'var(--space-8) auto 0',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--color-text-primary)',
                animation: 'slideInRight 1s ease-out',
                boxShadow: '0 0 10px rgba(247, 247, 245, 0.5)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomeAnimation;
