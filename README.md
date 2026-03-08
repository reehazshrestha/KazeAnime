<div align="center">

<br/>

```
██╗  ██╗ █████╗ ███████╗███████╗ █████╗ ███╗   ██╗██╗███╗   ███╗███████╗
██║ ██╔╝██╔══██╗╚════██║██╔════╝██╔══██╗████╗  ██║██║████╗ ████║██╔════╝
█████╔╝ ███████║    ██╔╝█████╗  ███████║██╔██╗ ██║██║██╔████╔██║█████╗
██╔═██╗ ██╔══██║   ██╔╝ ██╔══╝  ██╔══██║██║╚██╗██║██║██║╚██╔╝██║██╔══╝
██║  ██╗██║  ██║   ██║  ███████╗██║  ██║██║ ╚████║██║██║ ╚═╝ ██║███████╗
╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚══════╝
```

**A sleek, modern anime streaming web app — no account needed.**

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-EF008F?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎬 **HLS Streaming** | Smooth M3U8 playback via `hls.js` with native Safari support |
| 🔄 **Auto Server Fallback** | Cycles through HD-1 → HD-2 → HD-4 → Gogoanime automatically on failure |
| 🔀 **Multi-CDN Proxy** | Cloudflare Worker + Hugging Face Space `/hls-proxy` bypass CDN IP blocks |
| 🕐 **Continue Watching** | Resumes from where you left off — persisted in localStorage |
| 📋 **Watchlist** | Save anime for later, no login required |
| 🔍 **Search & Filter** | Real-time search + filter by genre, format, and status |
| 🎨 **3 Themes** | Dark (default), Light, and Otaku (pink) |
| 📱 **Mobile First** | Swipeable hero carousel, horizontal scroll rows, touch-friendly UI |
| ⚡ **No Account** | Everything stored client-side in localStorage |

---

## 🖼️ Screenshots

> Home · Watch · Search · Watchlist

<!-- Add screenshots here -->

---

## 🏗️ Tech Stack

```
Frontend     → Next.js 14 (App Router) + TypeScript
Styling      → Tailwind CSS + Framer Motion
Video        → hls.js (HLS/M3U8 streaming)
Anime Data   → AniList GraphQL API (metadata, search, genres)
Episode IDs  → Consumet API (HiAnime episode slugs)
Streaming    → aniwatch-api (HLS sources)
Fallback     → Consumet Gogoanime (CDN-safe fallback)
Proxy        → Cloudflare Worker + HF Space (bypass datacenter IP blocks)
Storage      → localStorage (history, watchlist, theme)
```

---

## 🌐 API Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     KazeAnime                           │
└────────────┬──────────────┬───────────────┬────────────┘
             │              │               │
     AniList GraphQL   Consumet API    aniwatch-api
    (metadata/search)  (episode IDs)  (HLS sources)
                                           │
                              ┌────────────┴────────────┐
                         CF Worker Proxy        HF Space Proxy
                         (primary)              (fallback)
                                           │
                                    Gogoanime via Consumet
                                    (final fallback)
```

**Streaming fallback chain:**
1. `hd-1 sub` via CF Worker proxy
2. CF Worker fails → retry via HF Space `/hls-proxy`
3. Both proxies fail → auto-try `hd-2 sub`, `hd-4 sub`, `hd-1 dub`
4. All HiAnime servers exhausted → Gogoanime via Consumet

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A running [aniwatch-api](https://github.com/ghoshRitesh12/aniwatch-api) instance

### 1. Clone & Install

```bash
git clone https://github.com/reehazshrestha/KazeAnime.git
cd KazeAnime
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_ANIWATCH_API_URL=https://your-aniwatch-api.hf.space
NEXT_PUBLIC_HLS_PROXY_URL=https://your-worker.workers.dev
NEXT_PUBLIC_CONSUMET_API_URL=https://your-consumet.vercel.app
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_ANIWATCH_API_URL` | Your [aniwatch-api](https://github.com/ghoshRitesh12/aniwatch-api) deployment |
| `NEXT_PUBLIC_HLS_PROXY_URL` | Cloudflare Worker HLS proxy URL |
| `NEXT_PUBLIC_CONSUMET_API_URL` | Your [Consumet API](https://github.com/consumet/api.consumet.org) deployment |

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Home — hero + horizontal scroll rows
│   ├── anime/[id]/page.tsx       # Anime detail + episode grid
│   ├── watch/[episodeId]/page.tsx # Video player + episode list
│   ├── search/page.tsx           # Search with genre/filter
│   └── watchlist/page.tsx        # Saved watchlist
├── components/
│   ├── VideoPlayer.tsx           # Custom hls.js player with proxy fallback
│   ├── HeroCarousel.tsx          # Auto-play carousel with touch swipe
│   ├── AnimeGrid.tsx             # Grid + horizontal scroll mode
│   ├── ContinueWatching.tsx      # Horizontal scroll, progress bars
│   ├── ResumeButton.tsx          # "Resume EP X" on anime detail page
│   ├── Navbar.tsx                # Scroll-aware, inline search, mobile drawer
│   └── ...
├── hooks/
│   └── useWatchHistory.ts        # localStorage watch history + progress
├── context/
│   ├── ThemeContext.tsx           # data-theme on <html>
│   └── WatchlistContext.tsx       # localStorage watchlist
└── lib/
    └── api.ts                    # All API calls (AniList, Consumet, aniwatch)
```

---

## 🎨 Themes

| Theme | Accent Color |
|---|---|
| 🌑 **Dark** (default) | `#f5c518` Gold |
| ☀️ **Light** | `#ff4500` Red-Orange |
| 🌸 **Otaku** | `#ff69b4` Hot Pink |

Switch themes via the toggle in the navbar.

---

## 📦 Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in **Settings → Environment Variables**
4. Deploy

---

## 🤝 Credits

- [AniList](https://anilist.co) — Anime metadata & GraphQL API
- [Consumet](https://github.com/consumet/consumet.ts) — Episode sources
- [aniwatch-api](https://github.com/ghoshRitesh12/aniwatch-api) — HiAnime HLS streaming

---

<div align="center">

Made with passion for anime fans &nbsp;·&nbsp; No login required &nbsp;·&nbsp; Forever free

</div>
