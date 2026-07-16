'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface MedButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline';
  className?: string;
  textStyle?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const typeStyles: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 active:scale-[0.97]',
  secondary: 'bg-secondary text-white hover:bg-secondary/90 active:scale-[0.97]',
  outline: 'bg-transparent border-[1.5px] border-border text-text hover:bg-foreground/5 active:scale-[0.97]',
};

const disabledStyles: Record<string, string> = {
  primary: 'bg-disabled text-text-secondary cursor-not-allowed',
  secondary: 'bg-disabled text-text-secondary cursor-not-allowed',
  outline: 'bg-transparent border-border text-text-secondary cursor-not-allowed',
};

export function MedButton({
  title,
  onPress,
  type = 'primary',
  className = '',
  disabled = false,
  loading = false,
  icon,
}: MedButtonProps) {
  return (
    <button
      onClick={onPress}
      disabled={disabled || loading}
      className={`
        py-4 px-6 rounded-[12px] font-medium text-[16px] tracking-[-0.1px]
        flex items-center justify-center gap-2.5 w-full
        transition-all duration-150
        shadow-[0_2px_10px_rgba(0,0,0,0.05)]
        ${disabled || loading ? disabledStyles[type] : typeStyles[type]}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {title}
        </>
      )}
    </button>
  );
}
