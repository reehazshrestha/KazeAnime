'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AnimeCard from './AnimeCard';
import type { AnimeResult } from '@/types/anime';

interface AnimeGridProps {
  anime: AnimeResult[];
  title?: string;
  isLoading?: boolean;
  horizontal?: boolean;
  seeMoreHref?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

function SkeletonCard({ slim }: { slim?: boolean }) {
  return (
    <div className={`animate-pulse${slim ? ' w-36 sm:w-40 shrink-0' : ''}`}>
      <div className="rounded-xl aspect-[2/3] bg-surface shimmer-bg" />
      <div className="mt-2.5 space-y-1.5">
        <div className="h-3 bg-surface rounded w-4/5" />
        <div className="h-3 bg-surface rounded w-1/2" />
      </div>
    </div>
  );
}

export default function AnimeGrid({ anime, title, isLoading, horizontal, seeMoreHref }: AnimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  if (horizontal) {
    return (
      <section className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 rounded-full bg-accent" />
            <h2 className="text-text text-xl font-bold tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll(-1)}
              className="p-1.5 rounded-lg bg-surface hover:bg-elevated text-muted hover:text-text transition-colors"
              aria-label="Scroll left"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={() => scroll(1)}
              className="p-1.5 rounded-lg bg-surface hover:bg-elevated text-muted hover:text-text transition-colors"
              aria-label="Scroll right"
            >
              <FiChevronRight />
            </button>
            {seeMoreHref && (
              <Link
                href={seeMoreHref}
                className="ml-2 text-xs font-semibold text-accent hover:underline"
              >
                See More →
              </Link>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} slim />)
            : anime.map((item, idx) => (
                <div key={item.id} className="w-36 sm:w-40 shrink-0">
                  <AnimeCard anime={item} index={idx} />
                </div>
              ))}
        </div>
      </section>
    );
  }

  // Grid mode (search results, genre pages, etc.)
  return (
    <section className="w-full">
      {title && (
        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-6 rounded-full bg-accent" />
          <h2 className="text-text text-xl font-bold tracking-tight">{title}</h2>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {anime.map((item, idx) => (
            <AnimeCard key={item.id} anime={item} index={idx} />
          ))}
        </motion.div>
      )}
    </section>
  );
}
