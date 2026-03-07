'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { AnimeResult } from '@/types/anime';

interface WatchlistContextValue {
  watchlist: AnimeResult[];
  addToWatchlist: (anime: AnimeResult) => void;
  removeFromWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextValue>({
  watchlist: [],
  addToWatchlist: () => undefined,
  removeFromWatchlist: () => undefined,
  isInWatchlist: () => false,
});

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<AnimeResult[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('watchlist');
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {
      // corrupted storage – start fresh
    }
  }, []);

  const persist = (list: AnimeResult[]) => {
    setWatchlist(list);
    localStorage.setItem('watchlist', JSON.stringify(list));
  };

  const addToWatchlist = useCallback((anime: AnimeResult) => {
    setWatchlist((prev) => {
      if (prev.some((a) => a.id === anime.id)) return prev;
      const next = [anime, ...prev];
      localStorage.setItem('watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((id: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((a) => a.id !== id);
      localStorage.setItem('watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const isInWatchlist = useCallback(
    (id: string) => watchlist.some((a) => a.id === id),
    [watchlist],
  );

  return (
    <WatchlistContext.Provider
      value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
