'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { GENRES, SEASONS, STATUSES, TYPES } from '@/lib/api';
import type { FilterOptions } from '@/types/anime';

interface FilterSidebarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

interface AccordionProps {
  label: string;
  children: React.ReactNode;
}

function Accordion({ label, children }: AccordionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border/50 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-text font-semibold text-sm mb-3"
      >
        {label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected?: string;
  onSelect: (v: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <motion.button
          key={opt}
          whileTap={{ scale: 0.92 }}
          onClick={() => onSelect(selected === opt ? undefined : opt)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-150 ${
            selected === opt
              ? 'bg-accent text-black border-accent font-semibold'
              : 'bg-transparent text-muted border-border hover:border-accent hover:text-text'
          }`}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActive =
    filters.genre || filters.season || filters.status || filters.type;

  const reset = () => onChange({});

  const content = (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-text font-bold text-base">Filters</h3>
        {hasActive && (
          <button
            onClick={reset}
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            <FiX className="text-sm" /> Clear all
          </button>
        )}
      </div>

      <Accordion label="Genre">
        <ChipGroup
          options={GENRES}
          selected={filters.genre}
          onSelect={(v) => onChange({ ...filters, genre: v })}
        />
      </Accordion>

      <Accordion label="Season">
        <ChipGroup
          options={SEASONS}
          selected={filters.season}
          onSelect={(v) => onChange({ ...filters, season: v })}
        />
      </Accordion>

      <Accordion label="Status">
        <ChipGroup
          options={STATUSES}
          selected={filters.status}
          onSelect={(v) => onChange({ ...filters, status: v })}
        />
      </Accordion>

      <Accordion label="Type">
        <ChipGroup
          options={TYPES}
          selected={filters.type}
          onSelect={(v) => onChange({ ...filters, type: v })}
        />
      </Accordion>
    </div>
  );

  return (
    <>
      {/* Desktop: static sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-20 self-start bg-surface/50 border border-border/50 rounded-2xl p-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {content}
      </aside>

      {/* Mobile: floating button + drawer */}
      <div className="lg:hidden">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
            hasActive
              ? 'bg-accent text-black border-accent'
              : 'bg-surface border-border text-text'
          }`}
        >
          <FiFilter />
          Filters
          {hasActive && (
            <span className="bg-black/20 rounded-full text-xs px-1.5 py-0.5">
              {[filters.genre, filters.season, filters.status, filters.type].filter(Boolean).length}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed right-0 top-0 bottom-0 w-80 bg-elevated z-50 p-6 overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-text font-bold text-lg">Filters</h2>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors"
                  >
                    <FiX />
                  </button>
                </div>
                {content}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="mt-6 w-full py-3 rounded-xl bg-accent text-black font-bold"
                >
                  Apply Filters
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
