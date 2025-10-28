import { motion } from 'framer-motion';

interface HolographicTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
}

export function HolographicText({ text, className = '', as = 'h1' }: HolographicTextProps) {
  const Component = motion[as];

  return (
    <Component
      className={`relative font-bold ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Glow layer */}
      <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-shift blur-sm">
        {text}
      </span>
      
      {/* Main text */}
      <span className="relative bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
        {text}
      </span>
    </Component>
  );
}
