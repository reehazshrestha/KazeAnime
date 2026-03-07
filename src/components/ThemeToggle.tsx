'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { useTheme } from '@/context/ThemeContext';
import type { Theme } from '@/types/anime';

const THEMES: { id: Theme; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'dark',  label: 'Dark',  icon: <FiMoon />,    color: '#fff' },
  { id: 'light', label: 'Light', icon: <FiSun />,     color: '#ff4500' },
  { id: 'otaku', label: 'Otaku', icon: <BsStars />,   color: '#ff69b4' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface/60 transition-colors"
        aria-label="Change theme"
        style={{ color: current.color }}
      >
        {current.icon}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 bg-elevated border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden min-w-[140px] z-50"
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface ${
                  theme === t.id ? 'text-accent font-semibold' : 'text-muted'
                }`}
              >
                <span style={{ color: t.color }}>{t.icon}</span>
                {t.label}
                {theme === t.id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
