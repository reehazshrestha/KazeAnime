'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useWatchHistory } from '@/hooks/useWatchHistory';

export default function ContinueWatching() {
  const { history, removeEntry } = useWatchHistory();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (history.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-6 rounded-full bg-accent" />
          <h2 className="text-text text-xl font-bold tracking-tight">Continue Watching</h2>
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
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {history.slice(0, 20).map((entry, idx) => {
          const progress =
            entry.duration > 0
              ? Math.min((entry.currentTime / entry.duration) * 100, 100)
              : 0;

          const idParts = entry.episodeId.split(':');
          const epNumFromId = idParts.length >= 3 ? parseInt(idParts[1], 10) : NaN;
          const displayEpNumber = !isNaN(epNumFromId) ? epNumFromId : entry.episodeNumber;

          return (
            <motion.div
              key={entry.animeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative w-36 sm:w-40 shrink-0"
            >
              <Link href={`/watch/${encodeURIComponent(entry.episodeId)}`}>
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface">
                  <Image
                    src={entry.animeImage}
                    alt={entry.animeTitle}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-accent/90 rounded-full p-3">
                      <FiPlay className="text-black fill-black text-lg" />
                    </div>
                  </div>

                  {/* Episode badge */}
                  <span className="absolute bottom-8 left-2 text-[10px] text-white font-medium bg-black/50 px-2 py-0.5 rounded">
                    EP {displayEpNumber}
                  </span>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: idx * 0.05 + 0.3, duration: 0.6 }}
                      className="h-full bg-accent"
                    />
                  </div>
                </div>

                <div className="mt-2 px-0.5">
                  <p className="text-text text-xs font-semibold line-clamp-2 group-hover:text-accent transition-colors">
                    {entry.animeTitle}
                  </p>
                  {progress > 0 && (
                    <p className="text-muted text-[10px] mt-0.5">{Math.round(progress)}% watched</p>
                  )}
                </div>
              </Link>

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeEntry(entry.animeId);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                aria-label="Remove"
              >
                <FiX className="text-xs" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
