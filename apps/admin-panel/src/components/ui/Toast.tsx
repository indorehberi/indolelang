import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  onClose?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variantClass = `alert-${variant}`;

  return (
    <div
      className={`alert ${variantClass}`}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 1100,
        minWidth: '280px',
        boxShadow: 'var(--shadow-md)',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            marginLeft: '8px',
            color: 'inherit',
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Toast;
