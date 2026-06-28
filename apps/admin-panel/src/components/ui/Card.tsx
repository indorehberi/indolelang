import React from 'react';

interface CardProps {
  title?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, headerActions, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <span>{title}</span>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
