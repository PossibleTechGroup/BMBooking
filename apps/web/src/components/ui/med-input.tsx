import React from 'react';

interface MedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  errorText?: string;
}

export function MedInput({ label, error, errorText, className = '', ...props }: MedInputProps) {
  return (
    <div className="mb-5 w-full">
      <label className={`block text-[12px] font-medium mb-2 ml-1 ${error ? 'text-error' : 'text-muted'}`}>
        {label}
      </label>
      <input
        className={`
          w-full h-14 px-4 text-[16px] rounded-[12px]
          bg-surface border-[1.5px] text-text
          placeholder:text-muted
          focus:outline-none focus:border-border-focus
          transition-colors
          shadow-[0_2px_8px_rgba(0,0,0,0.02)]
          ${error ? 'border-error' : 'border-border'}
          ${className}
        `}
        {...props}
      />
      {error && errorText && (
        <p className="text-error text-[12px] mt-1.5 ml-1">{errorText}</p>
      )}
    </div>
  );
}

interface MedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: boolean;
  errorText?: string;
}

export function MedTextarea({ label, error, errorText, className = '', ...props }: MedTextareaProps) {
  return (
    <div className="mb-5 w-full">
      <label className={`block text-[12px] font-medium mb-2 ml-1 ${error ? 'text-error' : 'text-muted'}`}>
        {label}
      </label>
      <textarea
        className={`
          w-full min-h-[120px] p-3 text-[16px] rounded-[12px]
          bg-surface border-[1.5px] text-text
          placeholder:text-muted
          focus:outline-none focus:border-border-focus
          transition-colors
          shadow-[0_2px_8px_rgba(0,0,0,0.02)]
          ${error ? 'border-error' : 'border-border'}
          ${className}
        `}
        {...props}
      />
      {error && errorText && (
        <p className="text-error text-[12px] mt-1.5 ml-1">{errorText}</p>
      )}
    </div>
  );
}
