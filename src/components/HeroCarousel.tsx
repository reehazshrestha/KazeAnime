'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiBookmark, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { BsBookmarkFill } from 'react-icons/bs';
import { useWatchlist } from '@/context/WatchlistContext';
import type { AnimeResult } from '@/types/anime';

interface HeroCarouselProps {
  items: AnimeResult[];
}

const AUTOPLAY_INTERVAL = 6000;

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const paginate = useCallback(
    (dir: number) => {
      setDirection(dir);
      setIndex((i) => (i + dir + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    const id = setInterval(() => paginate(1), AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [paginate]);

  if (!items.length) return null;

  const current = items[index];
  const inList = isInWatchlist(current.id);

  return (
    <div className="relative w-full h-[520px] md:h-[620px] overflow-hidden rounded-2xl">
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <motion.div
          key={current.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          {/* Background image — use wide bannerImage when available, fall back to poster */}
          <Image
            src={current.bannerImage ?? current.image}
            alt={current.title}
            fill
            priority
            quality={90}
            className={`object-cover object-center ${current.bannerImage ? '' : 'scale-105 blur-sm'}`}
            sizes="100vw"
          />
          {/* Poster overlay (top-right) — visible only when using a wide banner */}
          {current.bannerImage && (
            <div className="absolute top-6 right-6 hidden md:block w-24 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <Image
                src={current.image}
                alt={current.title}
                width={96}
                height={136}
                quality={90}
                className="object-cover"
              />
            </div>
          )}

          {/* Layered gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-accent text-black mb-4">
                {current.subOrDub ?? 'sub'} &nbsp;·&nbsp; {current.releaseDate ?? 'Now Airing'}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-xl mb-4"
            >
              {current.title}
            </motion.h1>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link href={`/anime/${current.id}`}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-black font-bold text-sm shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-shadow duration-300"
                >
                  <FiPlay className="fill-black" />
                  Watch Now
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() =>
                  inList ? removeFromWatchlist(current.id) : addToWatchlist(current)
                }
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border transition-colors duration-200 ${
                  inList
                    ? 'bg-accent border-accent text-black'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {inList ? <BsBookmarkFill /> : <FiBookmark />}
                {inList ? 'Saved' : 'Watchlist'}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
        aria-label="Previous"
      >
        <FiChevronLeft className="text-xl" />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
        aria-label="Next"
      >
        <FiChevronRight className="text-xl" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            className={`rounded-full transition-all duration-300 ${
              i === index ? 'w-6 h-2 bg-accent' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
