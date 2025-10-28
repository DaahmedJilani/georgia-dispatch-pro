import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

interface GlowButtonProps extends ButtonProps {
  children: ReactNode;
  glowColor?: 'cyan' | 'purple' | 'pink';
}

export function GlowButton({ children, glowColor = 'cyan', className = '', ...props }: GlowButtonProps) {
  const glowColors = {
    cyan: 'shadow-[0_0_20px_rgba(0,229,255,0.5)] hover:shadow-[0_0_40px_rgba(0,229,255,0.8)]',
    purple: 'shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_40px_rgba(168,85,247,0.8)]',
    pink: 'shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.8)]',
  };

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        className={`relative bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-300 ${glowColors[glowColor]} ${className}`}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}
