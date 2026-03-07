'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import AnimeGrid from '@/components/AnimeGrid';
import FilterSidebar from '@/components/FilterSidebar';
import { searchAnime, getTopAiring, getAnimeByGenre, MOCK_ANIME_LIST } from '@/lib/api';
import type { AnimeResult, FilterOptions } from '@/types/anime';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') ?? '';
  const genreParam = searchParams.get('genre') ?? '';
  const filterParam = searchParams.get('filter') ?? '';

  const [results, setResults] = useState<AnimeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    genre: genreParam || undefined,
  });

  const fetchResults = useCallback(
    async (q: string, f: FilterOptions, p: number) => {
      setLoading(true);
      try {
        if (f.genre) {
          const res = await getAnimeByGenre(f.genre, p);
          if (p === 1) setResults(res.results);
          else setResults((prev) => [...prev, ...res.results]);
          setHasNext(res.hasNextPage);
        } else if (q) {
          const res = await searchAnime(q, p);
          if (p === 1) setResults(res.results);
          else setResults((prev) => [...prev, ...res.results]);
          setHasNext(res.hasNextPage);
        } else if (filterParam === 'top-airing') {
          const res = await getTopAiring(p);
          if (p === 1) setResults(res.results);
          else setResults((prev) => [...prev, ...res.results]);
          setHasNext(res.hasNextPage);
        } else {
          // Default: show top airing
          const res = await getTopAiring(p);
          if (p === 1) setResults(res.results);
          else setResults((prev) => [...prev, ...res.results]);
          setHasNext(res.hasNextPage);
        }
      } catch {
        setResults(MOCK_ANIME_LIST);
        setHasNext(false);
      } finally {
        setLoading(false);
      }
    },
    [filterParam],
  );

  useEffect(() => {
    setPage(1);
    fetchResults(query, filters, 1);
  }, [query, filters, fetchResults]);

  const handleFilters = (f: FilterOptions) => {
    setFilters(f);
    // Update URL with genre filter
    if (f.genre) {
      router.push(`/search?genre=${encodeURIComponent(f.genre)}`);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchResults(query, filters, next);
  };

  const title = filters.genre
    ? `Genre: ${filters.genre}`
    : query
    ? `Results for "${query}"`
    : filterParam === 'top-airing'
    ? 'Top Airing'
    : 'Browse Anime';

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <FilterSidebar filters={filters} onChange={handleFilters} />

      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <AnimeGrid
              anime={results}
              title={title}
              isLoading={loading && page === 1}
            />
          </motion.div>
        </AnimatePresence>

        {hasNext && !loading && (
          <div className="mt-10 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadMore}
              className="px-8 py-3 rounded-xl bg-surface border border-border text-text font-medium text-sm hover:border-accent hover:text-accent transition-colors"
            >
              Load More
            </motion.button>
          </div>
        )}

        {loading && page > 1 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-surface shimmer-bg" />
                <div className="mt-2 h-3 bg-surface rounded w-4/5 shimmer-bg" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-8 pb-20">
      <div className="mb-8">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="hidden lg:block w-64 h-96 rounded-2xl bg-surface shimmer-bg shrink-0" />
            <AnimeGrid anime={[]} isLoading title="Browse Anime" />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}
