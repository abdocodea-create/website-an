import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react-native';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth-store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginScreen() {
    const router = useRouter();
    const setAccessToken = useAuthStore((state) => state.setAccessToken);
    const setUser = useAuthStore((state) => state.setUser);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: FormData) => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const response = await api.post('/auth/login', values);
            setAccessToken(response.data.access_token);
            setUser(response.data.user);
            router.replace('/(tabs)');
        } catch (error: any) {
            if (error.response?.status === 401) {
                setErrorMessage('Invalid email or password');
            } else {
                setErrorMessage('Login failed. Please try again.');
            }
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                    padding: 16,
                }}
            >
                <View className="w-full max-w-md mx-auto gap-8">
                    {/* Header */}
                    <View className="gap-2 items-center">
                        <Text className="text-4xl font-bold text-foreground">Login</Text>
                        <Text className="text-lg text-muted-foreground text-center">
                            Enter your email below to login to your account
                        </Text>
                    </View>

                    {/* Form */}
                    <Card className="border-0 shadow-none bg-transparent">
                        <CardContent className="p-0">
                            <View className="gap-6">
                                {errorMessage ? (
                                    <View className="bg-destructive/10 p-3 rounded-md">
                                        <Text className="text-destructive text-center">{errorMessage}</Text>
                                    </View>
                                ) : null}

                                <Controller
                                    control={control}
                                    name="email"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            label="Email"
                                            placeholder="m@example.com"
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            error={errors.email?.message}
                                            editable={!isLoading}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input
                                            label="Password"
                                            placeholder="******"
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                            error={errors.password?.message}
                                            editable={!isLoading}
                                            secureTextEntry
                                        />
                                    )}
                                />

                                <Button
                                    onPress={handleSubmit(onSubmit)}
                                    disabled={isLoading}
                                    className="w-full h-14"
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text className="text-primary-foreground text-xl font-bold">Sign in</Text>
                                    )}
                                </Button>
                            </View>
                        </CardContent>

                        <CardFooter className="flex-col gap-4 mt-6 p-0">
                            <View className="flex-row gap-1">
                                <Text className="text-muted-foreground text-lg">Don't have an account?</Text>
                                <Link href="/(auth)/register" asChild>
                                    <Pressable>
                                        <Text className="text-primary text-lg font-bold">Sign up</Text>
                                    </Pressable>
                                </Link>
                            </View>
                        </CardFooter>
                    </Card>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
