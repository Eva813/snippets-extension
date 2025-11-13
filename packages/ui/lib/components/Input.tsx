import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../utils';

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        // 基礎樣式
        'w-full px-4 py-3',
        'bg-white text-foreground',
        'border-2 rounded-base',
        'text-base font-base',
        'placeholder:text-muted-foreground',

        // 邊框和陰影
        error ? 'border-destructive' : 'border-black',
        'shadow-[3px_4px_0px_1px_#000]',

        // 焦點動畫 (motion-safe)
        'motion-safe:transition-all',
        'motion-safe:duration-150',
        'motion-safe:focus:translate-y-1',
        'motion-safe:focus:shadow-[1px_2px_0px_0px_#000]',

        // 焦點狀態
        'focus:outline-none',
        'focus:ring-4',
        'focus:ring-ring',
        'focus:ring-offset-2',

        // 停用狀態
        'disabled:opacity-50',
        'disabled:cursor-not-allowed',

        className,
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
