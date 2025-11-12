import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          // Variants
          'bg-primary text-white hover:bg-primary-dark focus:ring-primary':
            variant === 'primary',
          'bg-accent text-white hover:bg-accent-dark focus:ring-accent':
            variant === 'accent',
          'border border-gray-300 bg-white text-gray-anthracite hover:bg-gray-50':
            variant === 'outline',
          'bg-transparent text-gray-anthracite hover:bg-gray-100':
            variant === 'ghost',
          // Sizes
          'px-3 py-1.5 text-sm rounded-lg': size === 'sm',
          'px-6 py-3 text-base rounded-2xl': size === 'md',
          'px-8 py-4 text-lg rounded-2xl': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
