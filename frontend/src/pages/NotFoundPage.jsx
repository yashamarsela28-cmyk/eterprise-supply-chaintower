import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
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
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(51, 65, 85, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <Compass size={36} />
      </div>

      <h1
        style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-2)'
        }}
      >
        404 — Node Not Found
      </h1>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          maxWidth: '420px',
          marginBottom: 'var(--space-6)'
        }}
      >
        The requested supply chain control tower resource or route could not be located in the operational mesh.
      </p>

      <Button
        variant="primary"
        icon={Home}
        onClick={() => navigate('/dashboard')}
      >
        Return to Executive Dashboard
      </Button>
    </div>
  );
}

export default NotFoundPage;
