import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'flex-row items-center justify-center rounded-md font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-primary',
                destructive: 'bg-destructive',
                outline: 'border border-input bg-background',
                secondary: 'bg-secondary',
                ghost: 'bg-transparent',
                link: 'underline-offset-4',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const buttonTextVariants = cva('text-sm font-semibold', {
    variants: {
        variant: {
            default: 'text-primary-foreground',
            destructive: 'text-destructive-foreground',
            outline: 'text-foreground',
            secondary: 'text-secondary-foreground',
            ghost: 'text-foreground',
            link: 'text-primary underline',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

export interface ButtonProps
    extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
    children?: React.ReactNode;
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
    ({ className, variant, size, children, ...props }, ref) => {
        return (
            <Pressable
                ref={ref}
                className={cn(buttonVariants({ variant, size, className }))}
                {...props}
            >
                {({ pressed }) => (
                    <View className={cn('flex-row items-center justify-center gap-2', pressed && 'opacity-70')}>
                        {typeof children === 'string' ? (
                            <Text className={cn(buttonTextVariants({ variant }))}>{children}</Text>
                        ) : (
                            children
                        )}
                    </View>
                )}
            </Pressable>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
