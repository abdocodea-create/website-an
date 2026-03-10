import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Image,
    Pressable,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, X, Star } from 'lucide-react-native';
import api from '../../lib/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${BASE_URL}${cleanPath}`;
};

export default function SearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search animes
    const { data: animes, isLoading } = useQuery({
        queryKey: ['search-animes', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return [];
            const response = await api.get('/animes/search', {
                params: { search: debouncedQuery },
            });
            return response.data || [];
        },
        enabled: debouncedQuery.length > 0,
    });

    const clearSearch = () => {
        setSearchQuery('');
        setDebouncedQuery('');
    };

    const renderAnimeCard = ({ item: anime }: any) => {
        const image = anime.image || anime.cover;
        const title = anime.title || 'Untitled';
        const subText = anime.status || 'Ongoing';

        return (
            <Pressable
                onPress={() => router.push(`/anime/${anime.id}`)}
                className="flex-1 m-2"
                style={{ width: '45%' }}
            >
                <View className="overflow-hidden rounded-md">
                    <Image
                        source={{ uri: getImageUrl(image) }}
                        style={{ width: '100%', aspectRatio: 2 / 3 }}
                        className="bg-muted"
                        resizeMode="cover"
                    />
                    <View className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded">
                        <Text className="text-xs font-bold text-white">
                            {anime.type === 'tv' ? 'Series' : 'Movie'}
                        </Text>
                    </View>
                </View>

                <View className="mt-2">
                    <Text className="text-sm font-bold text-foreground" numberOfLines={2}>
                        {title}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">{subText}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                        <Star size={12} color="#facc15" fill="#facc15" />
                        <Text className="text-xs text-muted-foreground">{anime.rating || 'N/A'}</Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View className="flex-1 bg-background">
            {/* Search Bar */}
            <View className="p-4 border-b border-border">
                <View className="relative">
                    <SearchIcon
                        size={20}
                        color="hsl(215.4 16.3% 46.9%)"
                        style={{ position: 'absolute', left: 12, top: 10, zIndex: 1 }}
                    />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search for anime..."
                        placeholderTextColor="hsl(215.4 16.3% 46.9%)"
                        className="h-10 pl-10 pr-10 bg-background border-b-2 border-input text-foreground"
                        autoFocus
                    />
                    {searchQuery && (
                        <Pressable
                            onPress={clearSearch}
                            style={{ position: 'absolute', right: 12, top: 10 }}
                        >
                            <X size={20} color="hsl(215.4 16.3% 46.9%)" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Results */}
            {debouncedQuery ? (
                <View className="flex-1 p-4">
                    <Text className="text-2xl font-bold mb-4 text-foreground">Results</Text>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="hsl(222.2 47.4% 11.2%)" className="mt-10" />
                    ) : animes && animes.length > 0 ? (
                        <FlatList
                            data={animes}
                            renderItem={renderAnimeCard}
                            keyExtractor={(item: any) => item.id.toString()}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between' }}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <Text className="text-center text-muted-foreground mt-10">No anime found</Text>
                    )}
                </View>
            ) : (
                <View className="flex-1 items-center justify-center">
                    <SearchIcon size={80} color="hsl(215.4 16.3% 46.9%)" />
                    <Text className="text-muted-foreground mt-4">Start searching for anime</Text>
                </View>
            )}
        </View>
    );
}
