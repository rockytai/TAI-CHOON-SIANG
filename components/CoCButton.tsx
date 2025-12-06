import React from 'react';
import { playSfx } from '../services/audio';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'orange' | 'blue' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

export const CoCButton: React.FC<Props> = ({ children, variant = 'orange', size = 'md', className = '', ...props }) => {
  
  const baseStyles = "font-titan uppercase tracking-wider border-b-4 rounded-xl transition-all transform active:border-b-0 active:translate-y-1 relative outline-none shadow-lg flex items-center justify-center";
  
  const variants = {
    green: "bg-green-500 hover:bg-green-400 border-green-800 text-white shadow-green-900/50",
    orange: "bg-amber-500 hover:bg-amber-400 border-amber-800 text-white shadow-amber-900/50",
    blue: "bg-blue-500 hover:bg-blue-400 border-blue-800 text-white shadow-blue-900/50",
    gray: "bg-gray-200 hover:bg-gray-100 border-gray-400 text-gray-700 shadow-gray-500/50",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm h-8",
    md: "px-6 py-3 text-lg h-14",
    lg: "px-10 py-4 text-2xl h-20 w-full",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={(e) => {
        if (!props.disabled) playSfx('click');
        props.onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
};