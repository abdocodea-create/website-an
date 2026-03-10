import * as React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

export interface InputProps
    extends React.ComponentPropsWithoutRef<typeof TextInput> {
    label?: string;
    error?: string;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <View className="w-full gap-1.5">
                {label && (
                    <Text className="text-sm font-medium text-foreground">{label}</Text>
                )}
                <TextInput
                    ref={ref}
                    className={cn(
                        'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
                        error && 'border-destructive',
                        className
                    )}
                    placeholderTextColor="hsl(215.4 16.3% 46.9%)"
                    {...props}
                />
                {error && <Text className="text-xs text-destructive">{error}</Text>}
            </View>
        );
    }
);

Input.displayName = 'Input';

export { Input };
