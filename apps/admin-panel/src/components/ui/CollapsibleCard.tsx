'use client';

import React, { useState } from 'react';

interface CollapsibleCardProps {
  title: string;
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  className = '',
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`card collapsible-card ${className}`}>
      <button
        type="button"
        className="collapsible-card-header"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <h2 className="card-title">{title}</h2>
        <span className={`collapsible-card-icon ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && <div className="collapsible-card-body">{children}</div>}
    </div>
  );
};

export default CollapsibleCard;
