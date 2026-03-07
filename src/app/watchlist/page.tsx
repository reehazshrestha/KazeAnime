'use client';

import { motion } from 'framer-motion';
import { FiBookmark } from 'react-icons/fi';
import { useWatchlist } from '@/context/WatchlistContext';
import AnimeGrid from '@/components/AnimeGrid';
import Link from 'next/link';

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-10 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <FiBookmark className="text-accent text-2xl" />
        <h1 className="text-text text-2xl font-bold">My Watchlist</h1>
        <span className="text-muted text-sm">({watchlist.length})</span>
      </div>

      {watchlist.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-5 text-center"
        >
          <FiBookmark className="text-border text-6xl" />
          <p className="text-muted text-lg">Your watchlist is empty.</p>
          <p className="text-muted text-sm max-w-sm">
            Browse anime and click the bookmark icon to save titles for later.
          </p>
          <Link href="/">
            <button className="mt-2 px-6 py-3 rounded-xl bg-accent text-black font-bold text-sm">
              Browse Anime
            </button>
          </Link>
        </motion.div>
      ) : (
        <AnimeGrid anime={watchlist} />
      )}
    </div>
  );
}
