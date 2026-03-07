export interface AnimeResult {
  id: string;
  title: string;
  url: string;
  image: string;
  bannerImage?: string;
  releaseDate?: string;
  subOrDub?: 'sub' | 'dub';
}

export interface AnimeEpisode {
  id: string;
  number: number;
  title?: string;
  image?: string;
  url?: string;
  isFiller?: boolean;
  isSubbed?: boolean;
  isDubbed?: boolean;
}

export interface AnimeInfo {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate?: string;
  description?: string;
  genres?: string[];
  subOrDub?: 'sub' | 'dub';
  type?: string;
  status?: string;
  otherName?: string;
  totalEpisodes?: number;
  episodes: AnimeEpisode[];
}

export interface EpisodeSource {
  headers?: Record<string, string>;
  sources: {
    url: string;
    isM3U8: boolean;
    quality: string;
  }[];
  subtitles?: {
    url: string;
    lang: string;
  }[];
  intro?: { start: number; end: number };
  download?: string;
}

export interface SearchResult {
  currentPage: number;
  hasNextPage: boolean;
  results: AnimeResult[];
}

export interface RecentEpisode {
  id: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  image: string;
  url: string;
}

export interface TopAiringResult {
  currentPage: number;
  hasNextPage: boolean;
  results: AnimeResult[];
}

export interface WatchHistoryEntry {
  animeId: string;
  animeTitle: string;
  animeImage: string;
  episodeId: string;
  episodeNumber: number;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export type Theme = 'dark' | 'light' | 'otaku';

export interface FilterOptions {
  genre?: string;
  season?: string;
  status?: string;
  type?: string;
}
