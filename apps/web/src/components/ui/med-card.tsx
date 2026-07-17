import React from 'react';

interface MedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MedCard({ children, className = '', onClick }: MedCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface border border-border rounded-[16px] p-4
        shadow-[0_4px_12px_rgba(0,0,0,0.03)]
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
