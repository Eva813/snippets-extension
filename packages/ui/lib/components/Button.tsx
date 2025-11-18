import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../utils';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // 基礎樣式
          'rounded-base font-bold',
          'border-2 border-black',
          'transform-gpu', // GPU 加速

          // 尺寸變體
          size === 'sm' && 'px-4 py-2 text-sm',
          size === 'md' && 'px-6 py-3 text-base',
          size === 'lg' && 'px-8 py-4 text-lg',

          // 色彩變體
          variant === 'primary' && 'bg-primary shadow-retro text-white',
          variant === 'accent' && 'bg-accent shadow-retro text-black',
          variant === 'outline' && 'shadow-retro-sm bg-transparent text-black',

          // 互動動畫 (motion-safe)
          'motion-safe:transition-all',
          'motion-safe:duration-fast',
          'motion-safe:ease-neo-snap',
          'motion-safe:hover:-translate-y-1',
          'motion-safe:hover:shadow-retro-lg',
          'motion-safe:active:translate-y-0',
          'motion-safe:active:shadow-none',

          // 降低動畫替代方案 (motion-reduce)
          'motion-reduce:transition-colors',
          'motion-reduce:duration-150',
          'motion-reduce:hover:opacity-90',

          // 焦點狀態
          'focus-visible:outline-none',
          'focus-visible:ring-4',
          'focus-visible:ring-ring',
          'focus-visible:ring-offset-2',

          // 停用狀態
          'disabled:opacity-50',
          'disabled:cursor-not-allowed',
          'disabled:motion-safe:hover:translate-y-0',
          'disabled:motion-safe:hover:shadow-retro',

          className,
        )}
        {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
