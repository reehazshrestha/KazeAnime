import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiPlay, FiList } from 'react-icons/fi';
import { getAnimeInfo, isStubEpisodeId } from '@/lib/api';
import WatchlistButton from '@/components/WatchlistButton';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const anime = await getAnimeInfo(params.id);
    return { title: anime.title, description: anime.description ?? undefined };
  } catch {
    return { title: 'Anime Details' };
  }
}

async function AnimeDetailContent({ id }: { id: string }) {
  let anime;
  try {
    anime = await getAnimeInfo(id);
  } catch {
    notFound();
  }

  const firstEpId = anime.episodes[0]?.id;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pb-20">
      {/* Hero banner */}
      <div className="relative w-full h-64 md:h-96 -mx-4 md:-mx-8 mb-8 overflow-hidden">
        <Image
          src={anime.image}
          alt={anime.title}
          fill
          priority
          className="object-cover object-center blur-sm scale-105 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 -mt-32 md:-mt-48 relative">
        {/* Poster */}
        <div className="shrink-0 mx-auto md:mx-0">
          <div className="relative w-44 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-border">
            <Image src={anime.image} alt={anime.title} fill className="object-cover" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 mt-4 md:mt-20">
          <h1 className="text-text text-2xl md:text-4xl font-extrabold leading-tight mb-2">
            {anime.title}
          </h1>
          {anime.otherName && (
            <p className="text-muted text-sm mb-4">{anime.otherName}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {anime.status && (
              <span className="text-xs px-3 py-1 rounded-full border border-border text-muted">
                {anime.status}
              </span>
            )}
            {anime.type && (
              <span className="text-xs px-3 py-1 rounded-full border border-border text-muted">
                {anime.type}
              </span>
            )}
            {anime.releaseDate && (
              <span className="text-xs px-3 py-1 rounded-full border border-border text-muted">
                {anime.releaseDate}
              </span>
            )}
            {anime.subOrDub && (
              <span className="text-xs px-3 py-1 rounded-full bg-accent text-black font-bold uppercase">
                {anime.subOrDub}
              </span>
            )}
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {anime.genres.map((g) => (
                <Link
                  key={g}
                  href={`/search?genre=${encodeURIComponent(g)}`}
                  className="text-xs px-3 py-1 rounded-full bg-accent-dim text-accent hover:bg-accent hover:text-black transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          {/* Description */}
          {anime.description && (
            <p className="text-muted text-sm leading-relaxed mb-6 max-w-2xl">
              {anime.description}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            {firstEpId && (
              <Link href={`/watch/${encodeURIComponent(firstEpId)}`}>
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-black font-bold text-sm shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow">
                  <FiPlay className="fill-black" />
                  Watch Now
                </button>
              </Link>
            )}
            <WatchlistButton
              anime={{
                id: anime.id,
                title: anime.title,
                image: anime.image,
                url: anime.url,
                releaseDate: anime.releaseDate,
                subOrDub: anime.subOrDub,
              }}
            />
          </div>
        </div>
      </div>

      {/* Episodes */}
      {anime.episodes.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center gap-3 mb-5">
            <FiList className="text-accent text-xl" />
            <h2 className="text-text text-xl font-bold">
              Episodes{' '}
              {anime.episodes.length > 0 && (
                <span className="text-muted font-normal text-base">
                  ({anime.episodes.length}
                  {anime.totalEpisodes && anime.totalEpisodes !== anime.episodes.length
                    ? ` of ${anime.totalEpisodes}`
                    : ''}{' '}
                  {anime.episodes.length === 1 ? 'episode' : 'episodes'})
                </span>
              )}
            </h2>
          </div>

          {/* Show notice if episodes are stubs (aniwatch-api not configured) */}
          {anime.episodes[0] && isStubEpisodeId(anime.episodes[0].id) && (
            <div className="mb-4 flex items-center gap-2 text-xs text-muted bg-surface border border-border rounded-xl px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
              Streaming not configured — set <code className="text-accent mx-1">NEXT_PUBLIC_ANIWATCH_API_URL</code> in <code className="text-accent">.env.local</code> to enable playback.
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {anime.episodes.map((ep) => (
              <Link key={ep.id} href={`/watch/${encodeURIComponent(ep.id)}`}>
                <div className="flex items-center justify-center aspect-square rounded-lg bg-surface border border-border text-text text-sm font-medium hover:bg-accent hover:text-black hover:border-accent transition-colors cursor-pointer">
                  {ep.number}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function AnimeDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pt-6 pb-20">
          <div className="w-full h-64 rounded-2xl bg-surface shimmer-bg mb-8" />
          <div className="flex gap-8">
            <div className="w-44 aspect-[2/3] rounded-2xl bg-surface shimmer-bg shrink-0" />
            <div className="flex-1 space-y-4 mt-20">
              <div className="h-8 bg-surface rounded w-3/4 shimmer-bg" />
              <div className="h-4 bg-surface rounded w-1/2 shimmer-bg" />
              <div className="h-20 bg-surface rounded shimmer-bg" />
            </div>
          </div>
        </div>
      }
    >
      <AnimeDetailContent id={params.id} />
    </Suspense>
  );
}
