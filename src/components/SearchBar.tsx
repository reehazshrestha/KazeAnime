'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import { searchAnime } from '@/lib/api';
import type { AnimeResult } from '@/types/anime';
import Image from 'next/image';
import Link from 'next/link';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [suggestions, setSuggestions] = useState<AnimeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const result = await searchAnime(q, 1);
      setSuggestions(result.results.slice(0, 6));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuggestions(debouncedQuery); }, [debouncedQuery, fetchSuggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg pointer-events-none" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search anime by title, genre…"
          className="w-full bg-surface border border-border text-text pl-11 pr-10 py-3.5 rounded-2xl text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-muted"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSuggestions([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors p-1"
          >
            <FiX />
          </button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && (suggestions.length > 0 || loading) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-elevated border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
        >
          {loading ? (
            <div className="px-4 py-3 text-muted text-sm">Searching…</div>
          ) : (
            suggestions.map((item) => (
              <Link
                key={item.id}
                href={`/anime/${item.id}`}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors"
              >
                <div className="relative w-9 h-12 shrink-0 rounded overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-text text-sm font-medium truncate">{item.title}</p>
                  {item.releaseDate && (
                    <p className="text-muted text-xs">{item.releaseDate}</p>
                  )}
                </div>
                {item.subOrDub && (
                  <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent/20 text-accent shrink-0">
                    {item.subOrDub}
                  </span>
                )}
              </Link>
            ))
          )}
          {!loading && suggestions.length > 0 && (
            <button
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="w-full text-center text-sm text-accent py-3 hover:bg-surface transition-colors border-t border-border"
            >
              See all results for &quot;{query}&quot;
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
