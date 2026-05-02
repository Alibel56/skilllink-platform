import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarsProps {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
  className?: string;
}

export function Stars({ value, size = 16, onChange, className }: StarsProps) {
  const interactive = !!onChange;
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'pointer-events-none',
            )}
            aria-label={`${i + 1} stars`}
          >
            <Star
              size={size}
              className={cn(
                filled ? 'fill-warning text-warning' : 'text-muted-foreground/30',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
