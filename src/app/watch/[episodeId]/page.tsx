'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiList } from 'react-icons/fi';
import { getEpisodeSources, getEpisodeSourcesFromServer, getAnimeInfo, isStubEpisodeId, getGogoEpisodeSources } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import type { EpisodeSource, AnimeInfo } from '@/types/anime';

// Module-level cache so animeInfo persists across episode route navigations
// (Next.js App Router remounts the page component on every [episodeId] change)
const animeInfoCache = new Map<string, AnimeInfo>();

// Throttle helper – saves at most once per N ms
function throttle<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let last = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

export default function WatchPage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const router = useRouter();
  const { saveProgress, getProgress } = useWatchHistory();

  // Parse episode ID before state so animeId is available for the cache initializer
  // Formats: "stub:<animeId>:<N>"  |  "<anilistId>:<epNumber>:<aniwatchEpId>"  |  legacy "<animeId>-episode-<N>"
  const decodedId = decodeURIComponent(episodeId ?? '');
  const isStub = isStubEpisodeId(decodedId);
  const stubMatch = decodedId.match(/^stub:(.+):(\d+)$/);
  const newFormatMatch = !isStub ? decodedId.match(/^(\d+):(\d+):(.+)$/) : null;
  const legacyMatch = !isStub && !newFormatMatch ? decodedId.match(/^(.+)-episode-(\d+)$/) : null;
  const animeId = stubMatch?.[1] ?? newFormatMatch?.[1] ?? legacyMatch?.[1] ?? decodedId;
  const epNumber = stubMatch
    ? parseInt(stubMatch[2], 10)
    : newFormatMatch
    ? parseInt(newFormatMatch[2], 10)
    : legacyMatch
    ? parseInt(legacyMatch[2], 10)
    : 1;

  const [source, setSource] = useState<EpisodeSource | null>(null);
  const [serverLoading, setServerLoading] = useState<string | null>(null);
  // Initialize from cache — avoids full-page skeleton when switching episodes
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(() => animeInfoCache.get(animeId) ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState(0);
  const [showEpList, setShowEpList] = useState(false);
  const currentEpRef = useRef<HTMLAnchorElement>(null);
  const epListRef = useRef<HTMLDivElement>(null);
  const autoServerAttemptRef = useRef(0);
  const [retryLabel, setRetryLabel] = useState<string | null>(null);

  const AUTO_SERVERS = [
    { server: 'hd-1', category: 'sub', label: 'HD-1 Sub' },
    { server: 'hd-2', category: 'sub', label: 'HD-2 Sub' },
    { server: 'hd-4', category: 'sub', label: 'HD-4 Sub' },
    { server: 'hd-1', category: 'dub', label: 'HD-1 Dub' },
  ] as const;

  // Called by VideoPlayer when both proxies fail — auto-cycles HiAnime servers then falls back to Gogoanime
  const handleVideoError = useCallback(async () => {
    const attempt = autoServerAttemptRef.current;
    if (attempt > AUTO_SERVERS.length) return; // already gave up
    autoServerAttemptRef.current = attempt + 1;

    if (attempt < AUTO_SERVERS.length) {
      const { server, category, label } = AUTO_SERVERS[attempt];
      setRetryLabel(`Trying ${label}…`);
      try {
        const s = await getEpisodeSourcesFromServer(decodedId, server, category);
        setRetryLabel(null);
        setSource(s);
      } catch {
        void handleVideoError();
      }
      return;
    }

    // All HiAnime servers exhausted — try Gogoanime via Consumet
    if (animeInfo) {
      setRetryLabel('Trying Gogoanime…');
      try {
        const s = await getGogoEpisodeSources(animeInfo.title, epNumber);
        setRetryLabel(null);
        setSource(s);
      } catch {
        setRetryLabel(null);
        setError('FETCH_FAILED');
      }
    } else {
      setRetryLabel(null);
      setError('FETCH_FAILED');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedId, animeInfo, epNumber]);

  useEffect(() => {
    if (!decodedId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSource(null); // clear old source so previous episode doesn't show while new one loads
    autoServerAttemptRef.current = 0; // reset auto-cycle for new episode

    // Stub IDs mean Consumet isn't configured — skip source fetch
    if (isStub) {
      getAnimeInfo(animeId).then((info) => { if (!cancelled) setAnimeInfo(info); }).catch(() => {});
      setError('STUB');
      setLoading(false);
      return () => { cancelled = true; };
    }

    Promise.allSettled([
      getEpisodeSources(decodedId),
      getAnimeInfo(animeId),
    ]).then(([srcResult, infoResult]) => {
      if (cancelled) return;
      if (srcResult.status === 'fulfilled') {
        setSource(srcResult.value);
      } else {
        setError('FETCH_FAILED');
      }
      if (infoResult.status === 'fulfilled') {
        animeInfoCache.set(animeId, infoResult.value);
        setAnimeInfo(infoResult.value);
      }

      // Restore saved progress
      const saved = getProgress(animeId);
      if (saved && saved.episodeId === decodedId) {
        setInitialTime(saved.currentTime);
      }

      // Immediately write the new episode to history so ContinueWatching
      // reflects the current episode before any time-update fires
      if (infoResult.status === 'fulfilled' && (!saved || saved.episodeId !== decodedId)) {
        const info = infoResult.value;
        const epFromList = info.episodes.find((e) => e.id === decodedId);
        saveProgress({
          animeId,
          animeTitle: info.title,
          animeImage: info.image,
          episodeId: decodedId,
          episodeNumber: epFromList?.number ?? epNumber,
          currentTime: 0,
          duration: 0,
        });
      }

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [decodedId, animeId, getProgress, saveProgress, epNumber]);

  // Throttled save – fires at most every 5 seconds while watching
  const handleTimeUpdate = useCallback(
    throttle((currentTime: number, duration: number) => {
      if (!animeInfo || currentTime < 5) return;
      saveProgress({
        animeId,
        animeTitle: animeInfo.title,
        animeImage: animeInfo.image,
        episodeId: decodedId,
        episodeNumber: resolvedEpNumber,
        currentTime,
        duration,
      });
    }, 5000),
    [animeId, animeInfo, decodedId, epNumber, saveProgress],
  );

  // Resolve episode number: match by ID first, then by number parsed from URL
  const currentEpFromList =
    animeInfo?.episodes.find((e) => e.id === decodedId) ??
    animeInfo?.episodes.find((e) => e.number === epNumber);
  const resolvedEpNumber = currentEpFromList?.number ?? epNumber;
  const currentEpIndex = animeInfo?.episodes.findIndex(
    (e) => e.id === decodedId || e.number === resolvedEpNumber,
  ) ?? -1;
  const nextEp = animeInfo?.episodes[currentEpIndex + 1];

  const goNextEpisode = useCallback(() => {
    if (nextEp) router.push(`/watch/${encodeURIComponent(nextEp.id)}`);
  }, [nextEp, router]);

  // Scroll the episode list to the currently playing episode when data loads
  useEffect(() => {
    if (currentEpRef.current && epListRef.current) {
      currentEpRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [animeInfo, decodedId]);

  // Only show the full-page skeleton on the very first load (no animeInfo yet)
  if (loading && !animeInfo) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-6 pb-20">
        <div className="w-full aspect-video rounded-xl bg-surface shimmer-bg mb-6" />
        <div className="h-6 bg-surface rounded w-1/3 shimmer-bg mb-2" />
        <div className="h-4 bg-surface rounded w-1/4 shimmer-bg" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 pt-6 pb-20">
      {/* Back navigation */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm"
        >
          <FiArrowLeft />
          Back
        </button>
        {animeInfo && (
          <>
            <span className="text-border">/</span>
            <Link href={`/anime/${animeId}`} className="text-muted hover:text-text transition-colors text-sm truncate">
              {animeInfo.title}
            </Link>
            <span className="text-border">/</span>
            <span className="text-text text-sm font-medium">Episode {resolvedEpNumber}</span>
          </>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main player column */}
        <div className="flex-1 min-w-0">
          {error ? (
            <div className="w-full aspect-video rounded-2xl bg-surface border border-border flex flex-col items-center justify-center gap-5 p-8 text-center">
              {error === 'STUB' ? (
                <>
                  <div className="text-4xl">⚙️</div>
                  <h2 className="text-text text-lg font-bold">Streaming Not Configured</h2>
                  <p className="text-muted text-sm max-w-md">
                    This app needs a self-hosted <strong className="text-text">aniwatch-api</strong> instance to stream video. The episode metadata loaded correctly from AniList.
                  </p>
                  <div className="w-full max-w-md bg-elevated border border-border rounded-xl p-4 text-left text-xs font-mono text-muted space-y-1">
                    <p className="text-accent font-bold mb-2 font-sans text-sm">Quick setup:</p>
                    <p>1. Deploy <span className="text-text">github.com/ghoshRitesh12/aniwatch-api</span> to Vercel</p>
                    <p>2. Add to <span className="text-accent">.env.local</span>:</p>
                    <p className="pl-4 text-text">NEXT_PUBLIC_ANIWATCH_API_URL=https://your-instance.vercel.app</p>
                    <p>3. Restart <span className="text-accent">npm run dev</span></p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl">📡</div>
                  <h2 className="text-text text-lg font-bold">Episode Unavailable</h2>
                  <p className="text-muted text-sm max-w-sm">
                    Could not load streaming sources. The episode may not be indexed yet, or the aniwatch-api instance is temporarily unreachable.
                  </p>
                </>
              )}
              <button
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-xl bg-accent text-black font-bold text-sm"
              >
                Go Back
              </button>
            </div>
          ) : source ? (
            <motion.div
              key={decodedId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <VideoPlayer
                source={source}
                onTimeUpdate={handleTimeUpdate}
                initialTime={initialTime}
                episodeTitle={
                  animeInfo
                    ? `${animeInfo.title} — Episode ${resolvedEpNumber}`
                    : `Episode ${resolvedEpNumber}`
                }
                onNextEpisode={nextEp ? goNextEpisode : undefined}
                onError={handleVideoError}
              />
              {retryLabel && (
                <div className="mt-2 text-xs text-muted text-center animate-pulse">{retryLabel}</div>
              )}
            </motion.div>
          ) : loading ? (
            <div className="w-full aspect-video rounded-xl bg-surface shimmer-bg" />
          ) : null}

          {/* Episode info */}
          {animeInfo && (
            <div className="mt-5 flex items-start gap-4">
              <div className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden">
                <Image src={animeInfo.image} alt={animeInfo.title} fill className="object-cover" />
              </div>
              <div>
                <h1 className="text-text text-lg font-bold">{animeInfo.title}</h1>
                <p className="text-muted text-sm mt-0.5">Episode {resolvedEpNumber}</p>
                {initialTime > 0 && (
                  <p className="text-accent text-xs mt-1">
                    Resumed from {Math.floor(initialTime / 60)}:{String(Math.floor(initialTime % 60)).padStart(2, '0')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Server switcher */}
          {source && !error && (() => {
            const SERVERS = [
              { server: 'hd-1', category: 'sub', label: 'HD-1 Sub' },
              { server: 'hd-2', category: 'sub', label: 'HD-2 Sub' },
              { server: 'hd-4', category: 'sub', label: 'HD-4 Sub' },
              { server: 'hd-1', category: 'dub', label: 'HD-1 Dub' },
            ];
            return (
              <div className="mt-5">
                <p className="text-muted text-xs mb-2 font-medium uppercase tracking-wide">Switch Server</p>
                <div className="flex flex-wrap gap-2">
                  {SERVERS.map(({ server, category, label }) => {
                    const key = `${server}-${category}`;
                    const isLoading = serverLoading === key;
                    return (
                      <button
                        key={key}
                        disabled={isLoading}
                        onClick={async () => {
                          setServerLoading(key);
                          try {
                            const s = await getEpisodeSourcesFromServer(decodedId, server, category);
                            setSource(s);
                            setError(null);
                          } catch {
                            // keep current source, show nothing
                          } finally {
                            setServerLoading(null);
                          }
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 bg-surface border-border text-muted hover:border-accent hover:text-accent"
                      >
                        {isLoading ? '...' : label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Episode list sidebar */}
        {animeInfo && animeInfo.episodes.length > 0 && (
          <aside className="xl:w-72 shrink-0">
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowEpList(!showEpList)}
                className="w-full flex items-center justify-between px-4 py-3 text-text font-semibold text-sm xl:cursor-default xl:pointer-events-none"
              >
                <span className="flex items-center gap-2">
                  <FiList className="text-accent" />
                  Episodes ({animeInfo.episodes.length})
                </span>
                <span className="xl:hidden text-muted text-xs">{showEpList ? 'Hide' : 'Show'}</span>
              </button>

              <div ref={epListRef} className={`xl:block ${showEpList ? 'block' : 'hidden'} max-h-[60vh] overflow-y-auto`}>
                {animeInfo.episodes.map((ep) => {
                  // Match by ID first, fall back to episode number (handles slug drift between loads)
                  const isCurrent = ep.id === decodedId || ep.number === resolvedEpNumber;
                  return (
                    <Link
                      key={ep.id}
                      href={`/watch/${encodeURIComponent(ep.id)}`}
                      ref={isCurrent ? currentEpRef : null}
                    >
                      <div
                        className={`flex items-center gap-3 px-4 py-2.5 border-t border-border/50 hover:bg-elevated transition-colors text-sm ${
                          isCurrent
                            ? 'bg-accent/10 text-accent font-semibold border-l-2 border-l-accent'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        <span className="w-8 text-center shrink-0 text-xs opacity-60">
                          {ep.number}
                        </span>
                        <span className="truncate">Episode {ep.number}</span>
                        {isCurrent && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
