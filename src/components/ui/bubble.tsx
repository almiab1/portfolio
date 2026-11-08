// ABOUTME: Adapts the shadcn/ui Bubble and BubbleContent for portfolio messages.
// ABOUTME: Source under MIT at https://ui.shadcn.com/docs/ai-elements/radix/bubble.
import type * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const bubbleVariants = cva(
  'group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full',
  {
    variants: {
      variant: {
        muted:
          '*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]',
        outline:
          '*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  },
);

export function Bubble({
  variant = 'outline',
  align = 'start',
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof bubbleVariants> & {
    align?: 'start' | 'end';
  }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  );
}

export function BubbleContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="bubble-content"
      className={cn(
        'w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  );
}
