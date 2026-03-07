'use client';

import { useCallback, useEffect, useState } from 'react';
import type { WatchHistoryEntry } from '@/types/anime';

const STORAGE_KEY = 'watchHistory';

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const map: Record<string, WatchHistoryEntry> = JSON.parse(raw);

        // Clean up malformed entries (non-numeric animeId = old format artifact)
        // and deduplicate by animeTitle, keeping the most recently updated entry
        const seenTitles = new Map<string, WatchHistoryEntry>();
        for (const entry of Object.values(map)) {
          if (!/^\d+$/.test(entry.animeId)) continue;
          const prev = seenTitles.get(entry.animeTitle);
          if (!prev || entry.updatedAt > prev.updatedAt) {
            seenTitles.set(entry.animeTitle, entry);
          }
        }
        const cleaned: Record<string, WatchHistoryEntry> = {};
        seenTitles.forEach((entry) => {
          cleaned[entry.animeId] = entry;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));

        const sorted = Object.values(cleaned).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        );
        setHistory(sorted);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveProgress = useCallback(
    (entry: Omit<WatchHistoryEntry, 'updatedAt'>) => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const map: Record<string, WatchHistoryEntry> = raw
          ? JSON.parse(raw)
          : {};

        map[entry.animeId] = { ...entry, updatedAt: Date.now() };

        // Remove stale entries for the same anime stored under a different key
        for (const [key, val] of Object.entries(map)) {
          if (key !== entry.animeId && val.animeTitle === entry.animeTitle) {
            delete map[key];
          }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));

        setHistory(
          Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt),
        );
      } catch {
        // ignore
      }
    },
    [],
  );

  const getProgress = useCallback(
    (animeId: string): WatchHistoryEntry | null => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const map: Record<string, WatchHistoryEntry> = JSON.parse(raw);
        return map[animeId] ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  const removeEntry = useCallback((animeId: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const map: Record<string, WatchHistoryEntry> = JSON.parse(raw);
      delete map[animeId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      setHistory(Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt));
    } catch {
      // ignore
    }
  }, []);

  return { history, saveProgress, getProgress, removeEntry };
}
