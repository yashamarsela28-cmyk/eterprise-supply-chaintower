import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle, HelpCircle } from 'lucide-react';

/**
 * Standard Confirmation Dialog
 */
export function ConfirmDialog({
  isOpen = false,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  loading = false
}) {
  const Icon = variant === 'danger' ? AlertCircle : HelpCircle;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        <div
          style={{
            color: variant === 'danger' ? 'var(--color-danger)' : 'var(--color-primary)',
            flexShrink: 0,
            marginTop: '2px'
          }}
        >
          <Icon size={24} />
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.5
          }}
        >
          {message}
        </p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
