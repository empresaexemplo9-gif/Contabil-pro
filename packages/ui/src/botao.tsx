import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './index.js';

const variantes = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variante: {
        primario: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
        secundario: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        contorno: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        fantasma: 'hover:bg-accent hover:text-accent-foreground',
        destrutivo: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      tamanho: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
    },
    defaultVariants: {
      variante: 'primario',
      tamanho: 'md',
    },
  },
);

export interface BotaoProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantes> {}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(
  ({ className, variante, tamanho, ...props }, ref) => (
    <button ref={ref} className={cn(variantes({ variante, tamanho }), className)} {...props} />
  ),
);
Botao.displayName = 'Botao';
