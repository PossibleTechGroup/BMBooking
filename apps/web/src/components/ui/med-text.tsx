import React from 'react';

interface MedTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'body' | 'metadata';
  className?: string;
  color?: string;
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'div';
}

const variantStyles: Record<string, string> = {
  h1: 'text-[22px] font-semibold tracking-[-0.4px] leading-[30px]',
  h2: 'text-[17px] font-medium tracking-[-0.2px] leading-[24px]',
  body: 'text-[16px] font-normal leading-[24px]',
  metadata: 'text-[12px] font-medium leading-[16px]',
};

const defaultColors: Record<string, string> = {
  h1: 'text-text',
  h2: 'text-text',
  body: 'text-text-secondary',
  metadata: 'text-muted',
};

export function MedText({ children, variant = 'body', className = '', color, as: Tag = 'p' }: MedTextProps) {
  return (
    <Tag
      className={`${variantStyles[variant]} ${defaultColors[variant]} ${className}`}
      style={color ? { color } : undefined}
    >
      {children}
    </Tag>
  );
}
