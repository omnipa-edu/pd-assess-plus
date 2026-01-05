import { Stethoscope } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'default' | 'admin';
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ 
  className, 
  iconClassName,
  showText = false,
  textClassName,
  variant = 'default',
  size = 'md'
}: LogoProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Use icon for admin variant, or if image fails to load
  const useIcon = variant === 'admin' || imageError;
  
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-[200px]'
  };
  
  const containerSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };
  
  const iconSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {useIcon ? (
        <div className={cn(
          'flex shrink-0 items-center justify-center rounded-lg',
          containerSizeClasses[size],
          variant === 'admin' 
            ? 'bg-gradient-to-br from-red-600 to-red-500' 
            : 'bg-gradient-to-br from-primary to-primary/70'
        )}>
          <Stethoscope className={cn('text-white', iconSizeClasses[size], iconClassName)} aria-hidden="true" />
        </div>
      ) : (
        <img
          src="/logo.png"
          alt="Adaptive Competency Logo"
          className={cn('object-contain w-auto', sizeClasses[size])}
          style={{ display: 'block' }}
          onError={() => {
            console.error('Logo image failed to load');
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Logo image loaded successfully');
          }}
        />
      )}
      {showText && (
        <div className={textClassName}>
          <div className="text-lg font-bold text-foreground">Adaptive Competency</div>
        </div>
      )}
    </div>
  );
};

