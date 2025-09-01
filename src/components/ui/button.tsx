'use client'
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
};

const Button: React.FC<Props> = ({ children, className = '', variant = 'default', ...rest }) => {
  const base = 'px-4 py-2 rounded-md inline-flex items-center gap-2 font-medium';
  const v =
    variant === 'outline'
      ? 'border border-gray-500 bg-transparent'
      : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow';
  return (
    <button {...rest} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
