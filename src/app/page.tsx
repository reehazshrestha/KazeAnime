import { Suspense } from 'react';
import { getRecentEpisodes, getTopAiring, getAnimeByGenre } from '@/lib/api';
import HeroCarousel from '@/components/HeroCarousel';
import AnimeGrid from '@/components/AnimeGrid';
import ContinueWatching from '@/components/ContinueWatching';
import type { AnimeResult } from '@/types/anime';

const CATEGORIES = [
  { genre: 'Action',       title: 'Action'       },
  { genre: 'Romance',      title: 'Romance'       },
  { genre: 'Fantasy',      title: 'Fantasy'       },
  { genre: 'Comedy',       title: 'Comedy'        },
  { genre: 'Mystery',      title: 'Mystery'       },
  { genre: 'Supernatural', title: 'Supernatural'  },
  { genre: 'Sci-Fi',       title: 'Sci-Fi'        },
  { genre: 'Thriller',     title: 'Thriller'      },
] as const;

async function HomeContent() {
  let heroItems: AnimeResult[] = [];
  let topAiring: AnimeResult[] = [];
  let recentEpisodes: AnimeResult[] = [];

  const [topRes, recentRes, ...genreResults] = await Promise.allSettled([
    getTopAiring(1),
    getRecentEpisodes(1),
    ...CATEGORIES.map((c) => getAnimeByGenre(c.genre)),
  ]);

  if (topRes.status === 'fulfilled') {
    topAiring = topRes.value.results.slice(0, 10);
    heroItems = topRes.value.results.slice(0, 8);
  }
  if (recentRes.status === 'fulfilled') {
    recentEpisodes = recentRes.value.results.slice(0, 10);
  }

  if (!heroItems.length) heroItems = recentEpisodes.slice(0, 8);
  if (!recentEpisodes.length) recentEpisodes = topAiring.slice(0, 10);

  const genreSections = CATEGORIES.map((cat, i) => ({
    title: cat.title,
    genre: cat.genre,
    anime: genreResults[i]?.status === 'fulfilled'
      ? (genreResults[i] as PromiseFulfilledResult<{ results: AnimeResult[] }>).value.results.slice(0, 10)
      : [],
  })).filter((s) => s.anime.length > 0);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 space-y-14 pb-20">
      {/* Hero carousel */}
      <section className="pt-6">
        <HeroCarousel items={heroItems} />
      </section>

      {/* Continue Watching (client-side, reads localStorage) */}
      <ContinueWatching />

      {/* Top Airing — first */}
      <AnimeGrid anime={topAiring} title="Top Airing" horizontal seeMoreHref="/search?filter=top-airing" />

      {/* New Episodes */}
      <AnimeGrid anime={recentEpisodes} title="New Episodes" horizontal seeMoreHref="/search" />

      {/* Genre categories */}
      {genreSections.map((section) => (
        <AnimeGrid
          key={section.genre}
          anime={section.anime}
          title={section.title}
          horizontal
          seeMoreHref={`/search?genre=${encodeURIComponent(section.genre)}`}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-6 space-y-14 pb-20">
          <div className="w-full h-[520px] md:h-[620px] rounded-2xl bg-surface shimmer-bg" />
          {['Top Airing', 'New Episodes', 'Action', 'Romance', 'Fantasy', 'Comedy'].map((t) => (
            <AnimeGrid key={t} anime={[]} isLoading title={t} horizontal />
          ))}
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
