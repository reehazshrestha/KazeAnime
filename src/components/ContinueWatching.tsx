'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlay, FiX } from 'react-icons/fi';
import { useWatchHistory } from '@/hooks/useWatchHistory';

export default function ContinueWatching() {
  const { history, removeEntry } = useWatchHistory();

  if (history.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1 h-6 rounded-full bg-accent" />
        <h2 className="text-text text-xl font-bold tracking-tight">Continue Watching</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {history.slice(0, 12).map((entry, idx) => {
          const progress =
            entry.duration > 0
              ? Math.min((entry.currentTime / entry.duration) * 100, 100)
              : 0;

          // Prefer episode number embedded in the new-format ID "{anilistId}:{epNumber}:{aniwatchId}"
          // so stale localStorage entries with wrong episodeNumber still display correctly
          const idParts = entry.episodeId.split(':');
          const epNumFromId = idParts.length >= 3 ? parseInt(idParts[1], 10) : NaN;
          const displayEpNumber = !isNaN(epNumFromId) ? epNumFromId : entry.episodeNumber;

          return (
            <motion.div
              key={entry.animeId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="group relative"
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
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: idx * 0.06 + 0.3, duration: 0.6 }}
                      className="h-full bg-accent"
                    />
                  </div>
                </div>

                <div className="mt-2 px-0.5">
                  <p className="text-text text-xs font-semibold line-clamp-2 group-hover:text-accent transition-colors">
                    {entry.animeTitle}
                  </p>
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
