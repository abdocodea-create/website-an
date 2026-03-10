import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

const getImageUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

export default function HomeScreen() {
  const router = useRouter();

  // Fetch latest animes
  const { data: latestAnimes, isLoading: loadingLatest } = useQuery({
    queryKey: ['latest-animes'],
    queryFn: async () => {
      const response = await api.get('/animes', { params: { limit: 12 } });
      return response.data || [];
    },
  });

  // Fetch popular animes
  const { data: popularAnimes, isLoading: loadingPopular } = useQuery({
    queryKey: ['popular-animes'],
    queryFn: async () => {
      const response = await api.get('/animes', { params: { sort: 'rating', limit: 12 } });
      return response.data || [];
    },
  });

  const renderAnimeCard = ({ item: anime }: any) => {
    const image = anime.image || anime.cover;
    const title = anime.title || 'Untitled';

    return (
      <Pressable
        onPress={() => router.push(`/anime/${anime.id}`)}
        className="mr-4"
        style={{ width: 120 }}
      >
        <View className="overflow-hidden rounded-md">
          <Image
            source={{ uri: getImageUrl(image) }}
            style={{ width: 120, height: 180 }}
            className="bg-muted"
            resizeMode="cover"
          />
        </View>
        <Text className="text-sm font-semibold text-foreground mt-2 line-clamp-2" numberOfLines={2}>
          {title}
        </Text>
        <View className="flex-row items-center gap-1 mt-1">
          <Star size={12} color="#facc15" fill="#facc15" />
          <Text className="text-xs text-muted-foreground">{anime.rating || 'N/A'}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Hero Section */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">Anime Streaming</Text>
          <Text className="text-base text-muted-foreground">
            Discover your favorite anime series and movies
          </Text>
        </View>

        {/* Latest Animes Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-6 bg-primary mr-2" />
            <Text className="text-2xl font-bold text-foreground">Latest Anime</Text>
          </View>

          {loadingLatest ? (
            <ActivityIndicator size="large" color="hsl(222.2 47.4% 11.2%)" />
          ) : (
            <FlatList
              horizontal
              data={latestAnimes}
              renderItem={renderAnimeCard}
              keyExtractor={(item: any) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        {/* Popular Animes Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-1 h-6 bg-primary mr-2" />
            <Text className="text-2xl font-bold text-foreground">Popular Anime</Text>
          </View>

          {loadingPopular ? (
            <ActivityIndicator size="large" color="hsl(222.2 47.4% 11.2%)" />
          ) : (
            <FlatList
              horizontal
              data={popularAnimes}
              renderItem={renderAnimeCard}
              keyExtractor={(item: any) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
