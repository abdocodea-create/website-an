import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Video, ResizeMode } from 'expo-av';
import api from '../../../lib/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

const getVideoUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function WatchScreen() {
    const { params } = useLocalSearchParams();
    const [animeId, episodeNumber] = Array.isArray(params) ? params : [params, '1'];

    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<any>({});

    // Fetch episode data
    const { data: episode, isLoading } = useQuery({
        queryKey: ['episode', animeId, episodeNumber],
        queryFn: async () => {
            const response = await api.get(`/episodes`, {
                params: { anime_id: animeId, episode_number: episodeNumber },
            });
            const episodes = response.data || [];
            return episodes.find(
                (ep: any) =>
                    Number(ep.anime_id) === Number(animeId) &&
                    Number(ep.episode_number) === Number(episodeNumber)
            );
        },
        enabled: !!animeId && !!episodeNumber,
    });

    if (isLoading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#f47521" />
                <Text className="text-white mt-4">Loading episode...</Text>
            </View>
        );
    }

    if (!episode) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-white text-lg">Episode not found</Text>
            </View>
        );
    }

    const videoUrl = getVideoUrl(episode.video_url || episode.video);
    const posterUrl = getVideoUrl(episode.thumbnail || episode.banner);

    return (
        <View className="flex-1 bg-black">
            {/* Video Player */}
            <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                posterSource={{ uri: posterUrl }}
                style={{ width: Dimensions.get('window').width, height: 250 }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onPlaybackStatusUpdate={(status) => setStatus(() => status)}
            />

            {/* Episode Info */}
            <ScrollView className="flex-1 bg-background p-4">
                <Text className="text-2xl font-bold text-foreground mb-2">
                    Episode {episode.episode_number}
                </Text>
                <Text className="text-xl text-foreground mb-4">
                    {episode.title || `Episode ${episode.episode_number}`}
                </Text>

                <Text className="text-muted-foreground text-base leading-relaxed">
                    {episode.description || 'No description available.'}
                </Text>

                <View className="mt-6 p-4 bg-muted rounded-lg">
                    <Text className="text-foreground font-semibold mb-2">Video Information</Text>
                    <Text className="text-muted-foreground text-sm">
                        Duration: {episode.duration || '24'} minutes
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                        Release Date: {episode.created_at ? new Date(episode.created_at).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
