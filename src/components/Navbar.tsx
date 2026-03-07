'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiBookmark, FiMenu, FiX } from 'react-icons/fi';
import { useWatchlist } from '@/context/WatchlistContext';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/search?filter=top-airing', label: 'Top Airing' },
  { href: '/search?filter=movies', label: 'Movies' },
  { href: '/search?filter=schedule', label: 'Schedule' },
];

export default function Navbar() {
  const router = useRouter();
  const { watchlist } = useWatchlist();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/90 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-border/40'
          : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}
    >
      <nav className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-accent font-extrabold text-2xl tracking-tight"
          >
            Kaze<span className="text-text">Anime</span>
          </motion.div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-text hover:bg-surface/60 transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search icon button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface/60 transition-colors"
            aria-label="Search"
          >
            <FiSearch className="text-lg" />
          </motion.button>

          {/* Watchlist */}
          <Link href="/watchlist">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-surface/60 transition-colors"
              aria-label="Watchlist"
            >
              <FiBookmark className="text-lg" />
              {watchlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {watchlist.length > 99 ? '99+' : watchlist.length}
                </span>
              )}
            </motion.button>
          </Link>

          <ThemeToggle />

          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-muted hover:text-text hover:bg-surface/60 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-b border-border/40"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-muted hover:text-text hover:bg-surface/60 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex flex-col items-center pt-24 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-2xl"
            >
              <form onSubmit={handleSearch} className="relative">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-muted text-xl pointer-events-none" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anime…"
                  className="w-full bg-surface/90 border border-border text-text text-lg rounded-2xl pl-14 pr-14 py-4 outline-none focus:border-accent transition-colors shadow-2xl"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted hover:text-text transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </form>
              <p className="text-muted text-sm text-center mt-4">Press Enter to search · Esc to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
