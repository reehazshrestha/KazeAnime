'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiBookmark, FiPlay } from 'react-icons/fi';
import { BsBookmarkFill } from 'react-icons/bs';
import { useWatchlist } from '@/context/WatchlistContext';
import type { AnimeResult } from '@/types/anime';

interface AnimeCardProps {
  anime: AnimeResult;
  index?: number;
}

export default function AnimeCard({ anime, index = 0 }: AnimeCardProps) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const inList = isInWatchlist(anime.id);
  const [interactive, setInteractive] = useState(false);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inList ? removeFromWatchlist(anime.id) : addToWatchlist(anime);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, type: 'spring', damping: 18 }}
      whileHover={interactive ? { y: -6, transition: { duration: 0.2 } } : false}
      onAnimationComplete={() => setInteractive(true)}
      className={`group relative${interactive ? '' : ' pointer-events-none'}`}
    >
      <Link href={`/anime/${anime.id}`} className="block">
        {/* Poster */}
        <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-surface shadow-lg">
          <Image
            src={anime.image}
            alt={anime.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 14vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Hover play button */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7 }}
            whileHover={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-accent/90 rounded-full p-4 shadow-2xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <FiPlay className="text-black text-xl fill-black" />
            </div>
          </motion.div>

          {/* Sub/Dub badge */}
          {anime.subOrDub && (
            <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent text-black">
              {anime.subOrDub.toLowerCase()}
            </span>
          )}

          {/* Watchlist button */}
          <motion.button
            onClick={handleWatchlist}
            whileTap={{ scale: 0.85 }}
            className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-colors duration-200 ${
              inList
                ? 'bg-accent text-black'
                : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'
            }`}
            title={inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            {inList ? (
              <BsBookmarkFill className="text-sm" />
            ) : (
              <FiBookmark className="text-sm" />
            )}
          </motion.button>
        </div>

        {/* Title + metadata */}
        <div className="mt-2.5 px-0.5">
          <h3 className="text-text text-sm font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200">
            {anime.title}
          </h3>
          {anime.releaseDate && (
            <p className="text-muted text-xs mt-0.5">{anime.releaseDate}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
