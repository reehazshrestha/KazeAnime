import { Suspense } from 'react';
import { getRecentEpisodes, getTopAiring } from '@/lib/api';
import HeroCarousel from '@/components/HeroCarousel';
import AnimeGrid from '@/components/AnimeGrid';
import ContinueWatching from '@/components/ContinueWatching';
import type { AnimeResult } from '@/types/anime';

async function HomeContent() {
  let heroItems: AnimeResult[] = [];
  let topAiring: AnimeResult[] = [];
  let recentEpisodes: AnimeResult[] = [];

  const [topRes, recentRes] = await Promise.allSettled([
    getTopAiring(1),
    getRecentEpisodes(1),
  ]);

  if (topRes.status === 'fulfilled') {
    topAiring = topRes.value.results;
    heroItems = topAiring.slice(0, 8);
  }
  if (recentRes.status === 'fulfilled') {
    recentEpisodes = recentRes.value.results;
  }

  // Cross-populate if one list failed
  if (!heroItems.length) heroItems = recentEpisodes.slice(0, 8);
  if (!recentEpisodes.length) recentEpisodes = topAiring.slice(0, 12);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 space-y-16 pb-20">
      {/* Hero carousel */}
      <section className="pt-6">
        <HeroCarousel items={heroItems} />
      </section>

      {/* Continue Watching (client-side, reads localStorage) */}
      <ContinueWatching />

      {/* New Episodes */}
      <AnimeGrid anime={recentEpisodes} title="New Episodes" />

      {/* Top Airing */}
      <AnimeGrid anime={topAiring} title="Top Airing" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-6 space-y-16 pb-20">
          <div className="w-full h-[520px] md:h-[620px] rounded-2xl bg-surface shimmer-bg" />
          <AnimeGrid anime={[]} isLoading title="New Episodes" />
          <AnimeGrid anime={[]} isLoading title="Top Airing" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
