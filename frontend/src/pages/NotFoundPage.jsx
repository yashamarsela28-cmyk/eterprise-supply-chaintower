import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        padding: 'var(--space-8)'
      }}
    >
      <div
        style={{
          padding: '0.35rem 0.85rem',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          color: 'var(--color-warning-text)',
          marginBottom: 'var(--space-4)',
          textTransform: 'uppercase'
        }}
      >
        TELEMETRY ROUTING // 404 EXCEPTION
      </div>

      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <Compass size={32} />
      </div>

      <h1
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: 'var(--space-2)'
        }}
      >
        Operational Node Not Found
      </h1>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          maxWidth: '440px',
          lineHeight: '1.6',
          marginBottom: 'var(--space-6)'
        }}
      >
        The requested supply chain control tower resource, telemetry telemetry stream, or route could not be resolved within the active control grid.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={() => window.history.back()}
        >
          Previous Node
        </Button>
        <Button
          variant="primary"
          icon={Home}
          onClick={() => navigate('/dashboard')}
        >
          Return to Control Tower
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
