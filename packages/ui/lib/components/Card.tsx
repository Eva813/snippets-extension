import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../utils';

export interface CardProps extends ComponentPropsWithoutRef<'div'> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, padding = 'md', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        // 基礎樣式
        'bg-white',
        'rounded-base',
        'border-2 border-black',
        'shadow-retro-lg',

        // 內距變體
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8',

        // 懸停提升效果 (motion-safe)
        'motion-safe:transition-all',
        'motion-safe:duration-200',
        'motion-safe:ease-neo-pop',
        'motion-safe:hover:-translate-y-2',
        'motion-safe:hover:shadow-retro-xl',

        // 降低動畫替代 (motion-reduce)
        'motion-reduce:hover:border-gray-700',
        'motion-reduce:transition-colors',

        className,
      )}
      {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';
