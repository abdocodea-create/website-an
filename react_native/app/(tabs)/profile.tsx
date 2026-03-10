import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { User, LogOut, Mail } from 'lucide-react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    if (!isAuthenticated || !user) {
        return (
            <View className="flex-1 bg-background items-center justify-center p-4">
                <Text className="text-2xl font-bold text-foreground mb-4">Not Logged In</Text>
                <Text className="text-muted-foreground mb-6 text-center">
                    Please log in to access your profile
                </Text>
                <Button onPress={() => router.push('/(auth)/login')}>
                    <Text className="text-primary-foreground font-semibold">Go to Login</Text>
                </Button>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="p-4">
                {/* Header */}
                <View className="items-center mb-8 mt-4">
                    <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-4">
                        <User size={48} color="#fff" />
                    </View>
                    <Text className="text-2xl font-bold text-foreground">{user.name}</Text>
                    <Text className="text-muted-foreground mt-1">{user.email}</Text>
                    {user.role && (
                        <View className="mt-2 bg-primary/10 px-3 py-1 rounded">
                            <Text className="text-primary font-semibold">{user.role.name}</Text>
                        </View>
                    )}
                </View>

                {/* User Info Card */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>
                            <Text className="text-xl font-bold text-foreground">Account Information</Text>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="gap-4">
                        <View className="flex-row items-center gap-3">
                            <Mail size={20} color="hsl(215.4 16.3% 46.9%)" />
                            <View>
                                <Text className="text-muted-foreground text-xs">Email</Text>
                                <Text className="text-foreground font-medium">{user.email}</Text>
                            </View>
                        </View>
                        {user.created_at && (
                            <View className="flex-row items-center gap-3">
                                <User size={20} color="hsl(215.4 16.3% 46.9%)" />
                                <View>
                                    <Text className="text-muted-foreground text-xs">Member Since</Text>
                                    <Text className="text-foreground font-medium">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </CardContent>
                </Card>

                {/* Logout Button */}
                <Button onPress={handleLogout} variant="destructive" className="mt-4">
                    <View className="flex-row items-center gap-2">
                        <LogOut size={20} color="#fff" />
                        <Text className="text-destructive-foreground font-semibold text-lg">Logout</Text>
                    </View>
                </Button>
            </View>
        </ScrollView>
    );
}
