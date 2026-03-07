import type {
  AnimeInfo,
  AnimeResult,
  EpisodeSource,
  SearchResult,
  TopAiringResult,
} from '@/types/anime';

// ─────────────────────────────────────────────────────────────────────────────
// AniList GraphQL  (free, no key, always available)
// ─────────────────────────────────────────────────────────────────────────────
const ANILIST_URL = 'https://graphql.anilist.co';

async function anilistQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json = await res.json() as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}


// ─────────────────────────────────────────────────────────────────────────────
// aniwatch-api  (local — full HLS streaming via HiAnime)
// github.com/ghoshRitesh12/aniwatch-api
// ─────────────────────────────────────────────────────────────────────────────
const ANIWATCH_URL = (process.env.NEXT_PUBLIC_ANIWATCH_API_URL ?? '').replace(/\/$/, '');

// On the server: hit aniwatch-api directly. On the client: proxy through Next.js to avoid CORS.
function aniwatchBase(): string {
  if (typeof window === 'undefined') {
    return `${ANIWATCH_URL}/api/v2/hianime`;
  }
  return '/api/aniwatch';
}

export function isStreamingConfigured(): boolean {
  return Boolean(ANIWATCH_URL);
}

// Search aniwatch-api to get the HiAnime slug for an anime title
async function getAniwatchSlug(title: string): Promise<string | null> {
  if (!ANIWATCH_URL) return null;
  try {
    const res = await fetch(
      `${aniwatchBase()}/search?q=${encodeURIComponent(title)}&page=1`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = await res.json() as {
      data: { animes: { id: string; name: string; type: string }[] };
    };
    const animes = json.data?.animes ?? [];
    if (!animes.length) return null;
    const titleLower = title.toLowerCase();
    return animes.find((a) => a.name.toLowerCase() === titleLower)?.id ?? animes[0].id;
  } catch {
    return null;
  }
}

// Fetch episode list from aniwatch-api — IDs stored as "{anilistId}:{aniwatchEpId}"
async function getAniwatchEpisodes(slug: string, anilistId: string) {
  if (!ANIWATCH_URL) return [];
  try {
    const res = await fetch(
      `${aniwatchBase()}/anime/${slug}/episodes`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    const json = await res.json() as {
      data: { episodes: { episodeId: string; number: number; title: string }[] };
    };
    // ID format: "{anilistId}:{epNumber}:{aniwatchEpId}" so the watch page can always read epNumber from URL
    return (json.data?.episodes ?? []).map((ep) => ({
      id: `${anilistId}:${ep.number}:${ep.episodeId}`,
      number: ep.number,
      title: ep.title,
    }));
  } catch {
    return [];
  }
}

interface AniwatchSourceResponse {
  status: number;
  data: {
    tracks: { url: string; lang: string }[];
    intro:  { start: number; end: number };
    outro:  { start: number; end: number };
    sources: { url: string; type: string }[];
  };
}

async function fetchAniwatchSources(episodeId: string): Promise<EpisodeSource> {
  if (!ANIWATCH_URL) throw new Error('NEXT_PUBLIC_ANIWATCH_API_URL is not configured');
  // episodeId is already in aniwatch format: "one-piece-100?ep=2142"
  const url = `${aniwatchBase()}/episode/sources?animeEpisodeId=${encodeURIComponent(episodeId)}&server=hd-1&category=sub`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`aniwatch ${res.status}`);
  const json = await res.json() as AniwatchSourceResponse;

  const data = json.data;
  if (!data?.sources?.length) throw new Error('No sources returned');

  return {
    sources: data.sources.map((s) => ({
      url: s.url,
      isM3U8: s.type === 'hls' || s.url.includes('.m3u8'),
      quality: 'default',
    })),
    subtitles: data.tracks
      .filter((t) => t.lang !== 'thumbnails' && t.url.includes('.vtt'))
      .map((t) => ({ url: t.url, lang: t.lang })),
    intro: data.intro?.end > 0 ? data.intro : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AniList internal types
// ─────────────────────────────────────────────────────────────────────────────
interface AnilistMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { large: string; extraLarge: string };
  bannerImage: string | null;
  startDate: { year: number | null } | null;
  format: string | null;
  episodes: number | null;
  status: string | null;
  genres: string[];
  description: string | null;
  averageScore: number | null;
}

function mapStatus(s: string | null): string {
  if (s === 'RELEASING') return 'Ongoing';
  if (s === 'FINISHED') return 'Completed';
  if (s === 'NOT_YET_RELEASED') return 'Upcoming';
  if (s === 'CANCELLED') return 'Cancelled';
  if (s === 'HIATUS') return 'Hiatus';
  return s ?? 'Unknown';
}

function mediaToResult(m: AnilistMedia): AnimeResult {
  return {
    id: String(m.id),
    title: m.title.english || m.title.romaji,
    image: m.coverImage.extraLarge || m.coverImage.large,
    bannerImage: m.bannerImage ?? undefined,
    url: `/anime/${m.id}`,
    releaseDate: m.startDate?.year ? String(m.startDate.year) : undefined,
    subOrDub: 'sub',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Episode stubs (used when Consumet is unavailable)
// ─────────────────────────────────────────────────────────────────────────────
// IDs are prefixed with "stub:" so the watch page can detect them
export function isStubEpisodeId(id: string): boolean {
  return id.startsWith('stub:');
}

function makeStubEpisodes(animeId: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `stub:${animeId}:${i + 1}`,
    number: i + 1,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — Metadata (AniList)
// ─────────────────────────────────────────────────────────────────────────────

const MEDIA_FRAGMENT = `
  id
  title { romaji english native }
  coverImage { large extraLarge }
  bannerImage
  startDate { year }
  format
  episodes
  status
  genres
  description(asHtml: false)
  averageScore
`;

/** Trending / top-airing anime */
export async function getTopAiring(page = 1): Promise<TopAiringResult> {
  const data = await anilistQuery<{
    Page: { pageInfo: { hasNextPage: boolean; currentPage: number }; media: AnilistMedia[] };
  }>(
    `query ($page: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage currentPage }
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false, status: RELEASING) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { page },
  );
  return {
    currentPage: data.Page.pageInfo.currentPage,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    results: data.Page.media.map(mediaToResult),
  };
}

/** Recently updated — uses UPDATED_AT sort as a proxy for recent episodes */
export async function getRecentEpisodes(
  page = 1,
): Promise<{ currentPage: number; hasNextPage: boolean; results: AnimeResult[] }> {
  const data = await anilistQuery<{
    Page: { pageInfo: { hasNextPage: boolean; currentPage: number }; media: AnilistMedia[] };
  }>(
    `query ($page: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage currentPage }
        media(sort: UPDATED_AT_DESC, type: ANIME, isAdult: false, status_in: [RELEASING, FINISHED]) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { page },
  );
  return {
    currentPage: data.Page.pageInfo.currentPage,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    results: data.Page.media.map(mediaToResult),
  };
}

/** Search anime by title */
export async function searchAnime(query: string, page = 1): Promise<SearchResult> {
  const data = await anilistQuery<{
    Page: { pageInfo: { hasNextPage: boolean }; media: AnilistMedia[] };
  }>(
    `query ($search: String, $page: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage }
        media(search: $search, type: ANIME, isAdult: false) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { search: query, page },
  );
  return {
    currentPage: page,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    results: data.Page.media.map(mediaToResult),
  };
}

/** Search by genre */
export async function getAnimeByGenre(genre: string, page = 1): Promise<SearchResult> {
  const data = await anilistQuery<{
    Page: { pageInfo: { hasNextPage: boolean }; media: AnilistMedia[] };
  }>(
    `query ($genre: String, $page: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage }
        media(genre: $genre, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
          ${MEDIA_FRAGMENT}
        }
      }
    }`,
    { genre, page },
  );
  return {
    currentPage: page,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    results: data.Page.media.map(mediaToResult),
  };
}

/** Full anime info + episode list (AniList metadata + Consumet episodes) */
export async function getAnimeInfo(id: string): Promise<AnimeInfo> {
  // 1. Fetch metadata from AniList
  const data = await anilistQuery<{ Media: AnilistMedia & {
    title: { romaji: string; english: string | null; native: string | null };
    studios: { nodes: { name: string }[] };
  } }>(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FRAGMENT}
        title { romaji english native }
        studios(isMain: true) { nodes { name } }
        bannerImage
      }
    }`,
    { id: parseInt(id, 10) },
  );

  const m = data.Media;
  const epCount = m.episodes ?? 0;

  // 2. Get episode list from aniwatch-api via HiAnime
  const title = m.title.english || m.title.romaji;
  const slug = await getAniwatchSlug(title);
  let episodes: AnimeInfo['episodes'] = slug ? await getAniwatchEpisodes(slug, id) : [];
  if (!episodes.length) {
    episodes = epCount > 0 ? makeStubEpisodes(id, epCount) : [];
  }

  return {
    id,
    title: m.title.english || m.title.romaji,
    url: `/anime/${id}`,
    image: m.coverImage.extraLarge || m.coverImage.large,
    releaseDate: m.startDate?.year ? String(m.startDate.year) : undefined,
    description: m.description?.replace(/<[^>]*>/g, '') ?? undefined,
    genres: m.genres,
    subOrDub: 'sub',
    type: m.format ?? undefined,
    status: mapStatus(m.status),
    otherName: m.title.native ?? m.title.romaji ?? undefined,
    totalEpisodes: epCount,
    episodes,
  };
}

/** Get streaming sources for an episode via aniwatch-api */
export async function getEpisodeSources(episodeId: string): Promise<EpisodeSource> {
  if (isStubEpisodeId(episodeId)) throw new Error('STUB_EPISODE');
  // Format: "{anilistId}:{epNumber}:{aniwatchEpId}" e.g. "21:1:one-piece-100?ep=2142"
  const parts = episodeId.split(':');
  const aniwatchId = parts.length >= 3 ? parts.slice(2).join(':') : episodeId;
  return fetchAniwatchSources(aniwatchId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Static constants
// ─────────────────────────────────────────────────────────────────────────────
export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];

export const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
export const STATUSES = ['Ongoing', 'Completed', 'Upcoming'];
export const TYPES = ['TV', 'Movie', 'OVA', 'ONA', 'Special'];

// Kept for any remaining references
export const MOCK_ANIME_LIST: AnimeResult[] = [];
export function getMockAnimeInfo(_id: string) { return null; }
