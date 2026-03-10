import { Stack } from 'expo-router';

export default function AnimeLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="[id]" />
            <Stack.Screen name="watch/[...params]" />
        </Stack>
    );
}
