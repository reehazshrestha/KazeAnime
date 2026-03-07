'use client';

import { motion } from 'framer-motion';
import AnimeCard from './AnimeCard';
import type { AnimeResult } from '@/types/anime';

interface AnimeGridProps {
  anime: AnimeResult[];
  title?: string;
  isLoading?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="rounded-xl aspect-[2/3] bg-surface shimmer-bg" />
      <div className="mt-2.5 space-y-1.5">
        <div className="h-3 bg-surface rounded w-4/5" />
        <div className="h-3 bg-surface rounded w-1/2" />
      </div>
    </div>
  );
}

export default function AnimeGrid({ anime, title, isLoading }: AnimeGridProps) {
  return (
    <section className="w-full">
      {title && (
        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-6 rounded-full bg-accent" />
          <h2 className="text-text text-xl font-bold tracking-tight">{title}</h2>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-8 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-8 gap-4"
        >
          {anime.map((item, idx) => (
            <AnimeCard key={item.id} anime={item} index={idx} />
          ))}
        </motion.div>
      )}
    </section>
  );
}
