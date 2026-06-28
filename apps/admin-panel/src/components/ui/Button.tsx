import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'gold' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const variantClass = `btn-${variant}`;
  
  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
