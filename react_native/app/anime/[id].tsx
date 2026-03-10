import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    Pressable,
    ActivityIndicator,
    FlatList,
    ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Play, Star, Share2, Plus } from 'lucide-react-native';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function AnimeDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    // Fetch anime data
    const { data: anime, isLoading } = useQuery({
        queryKey: ['anime', id],
        queryFn: async () => {
            const response = await api.get(`/animes/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch episodes
    const { data: episodesData } = useQuery({
        queryKey: ['episodes', id],
        queryFn: async () => {
            const response = await api.get(`/episodes`, { params: { anime_id: id } });
            return response.data;
        },
        enabled: !!id,
    });

    const episodes = anime?.episodes || episodesData || [];

    if (isLoading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="hsl(222.2 47.4% 11.2%)" />
            </View>
        );
    }

    if (!anime) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-foreground">Anime not found</Text>
            </View>
        );
    }

    const backgroundUrl = getImageUrl(anime.cover || anime.image);
    const title = anime.title || 'Untitled';

    const renderEpisode = ({ item: episode }: any) => (
        <Pressable
            onPress={() => router.push(`/anime/watch/${id}/${episode.episode_number}`)}
            className="mb-4"
        >
            <View className="flex-row gap-3">
                <View className="w-32 h-20 bg-muted rounded overflow-hidden">
                    <Image
                        source={{ uri: getImageUrl(episode.thumbnail || episode.banner) }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    <View className="absolute inset-0 items-center justify-center">
                        <Play size={24} color="#f47521" fill="#f47521" />
                    </View>
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground" numberOfLines={2}>
                        EP {episode.episode_number}: {episode.title || `Episode ${episode.episode_number}`}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
                        {episode.description || 'No description'}
                    </Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Hero Section */}
            <ImageBackground
                source={{ uri: backgroundUrl }}
                style={{ width: '100%', height: 400 }}
                resizeMode="cover"
            >
                <View className="flex-1 bg-black/60 justify-end p-6">
                    <Text className="text-4xl font-bold text-white mb-2">{title}</Text>
                    {anime.title_en && (
                        <Text className="text-lg text-gray-300 mb-4">{anime.title_en}</Text>
                    )}

                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="px-2 py-1 bg-gray-800 rounded">
                            <Text className="text-white text-xs">14+</Text>
                        </View>
                        <Text className="text-gray-300 text-sm uppercase">{anime.type}</Text>
                        <Text className="text-gray-300">•</Text>
                        <View className="flex-row items-center gap-1">
                            <Star size={14} color="#facc15" fill="#facc15" />
                            <Text className="text-gray-300 text-sm">{anime.rating || 'N/A'}</Text>
                        </View>
                    </View>

                    <Text className="text-gray-200 text-sm mb-6" numberOfLines={3}>
                        {anime.description || 'No description available.'}
                    </Text>

                    <View className="flex-row gap-3">
                        {episodes.length > 0 && (
                            <Button
                                onPress={() => router.push(`/anime/watch/${id}/${episodes[0].episode_number}`)}
                                className="flex-1"
                            >
                                <View className="flex-row items-center gap-2">
                                    <Play size={20} color="#fff" fill="#fff" />
                                    <Text className="text-primary-foreground font-bold">Start Watching</Text>
                                </View>
                            </Button>
                        )}
                        <Pressable className="w-12 h-12 border-2 border-[#f47521] items-center justify-center">
                            <Plus size={24} color="#f47521" />
                        </Pressable>
                        <Pressable className="w-12 h-12 items-center justify-center">
                            <Share2 size={24} color="#fff" />
                        </Pressable>
                    </View>
                </View>
            </ImageBackground>

            {/* Episodes List */}
            <View className="p-4">
                <View className="flex-row items-center mb-4">
                    <View className="w-1 h-6 bg-primary mr-2" />
                    <Text className="text-2xl font-bold text-foreground">
                        Episodes ({episodes.length})
                    </Text>
                </View>

                {episodes.length > 0 ? (
                    <FlatList
                        data={episodes}
                        renderItem={renderEpisode}
                        keyExtractor={(item: any) => item.id.toString()}
                        scrollEnabled={false}
                    />
                ) : (
                    <Text className="text-center text-muted-foreground py-10">No episodes available</Text>
                )}
            </View>
        </ScrollView>
    );
}
