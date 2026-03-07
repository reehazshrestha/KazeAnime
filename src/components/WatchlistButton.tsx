'use client';

import { motion } from 'framer-motion';
import { FiBookmark } from 'react-icons/fi';
import { BsBookmarkFill } from 'react-icons/bs';
import { useWatchlist } from '@/context/WatchlistContext';
import type { AnimeResult } from '@/types/anime';

export default function WatchlistButton({ anime }: { anime: AnimeResult }) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const inList = isInWatchlist(anime.id);

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => (inList ? removeFromWatchlist(anime.id) : addToWatchlist(anime))}
      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-colors duration-200 ${
        inList
          ? 'bg-accent border-accent text-black'
          : 'bg-surface border-border text-text hover:border-accent hover:text-accent'
      }`}
    >
      {inList ? <BsBookmarkFill /> : <FiBookmark />}
      {inList ? 'Saved' : 'Add to Watchlist'}
    </motion.button>
  );
}
