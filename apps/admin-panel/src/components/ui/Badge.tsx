import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variantClass = `badge-${variant}`;
  
  return (
    <span className={`badge ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
};

export default Badge;
