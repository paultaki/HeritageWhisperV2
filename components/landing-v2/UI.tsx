import React from 'react';

// --- Typography ---

export const SectionHeading: React.FC<{ children: React.ReactNode; className?: string; centered?: boolean }> = ({
  children,
  className = "",
  centered = false
}) => (
  <h2 className={`text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-navy-900 tracking-tight mb-6 ${centered ? 'text-center' : ''} ${className}`}>
    {children}
  </h2>
);

export const SectionSubheading: React.FC<{ children: React.ReactNode; className?: string; centered?: boolean }> = ({
  children,
  className = "",
  centered = false
}) => (
  <p className={`text-lg md:text-xl text-navy-800/80 leading-relaxed max-w-3xl ${centered ? 'mx-auto text-center' : ''} ${className}`}>
    {children}
  </p>
);

// --- Buttons ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = "",
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream-100";

  const variants = {
    primary: "bg-green-800 text-white hover:bg-green-900 shadow-md shadow-green-900/10 focus:ring-green-800",
    secondary: "bg-navy-900 text-white hover:bg-navy-800 shadow-md shadow-navy-900/10 focus:ring-navy-900",
    outline: "border-2 border-navy-900/20 text-navy-900 hover:border-navy-900 hover:bg-navy-900/5 focus:ring-navy-900",
    ghost: "text-navy-900 hover:bg-navy-900/5 hover:text-green-800",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Card Wrapper ---

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-cream-200/50 p-6 md:p-8 ${className}`}>
    {children}
  </div>
);
