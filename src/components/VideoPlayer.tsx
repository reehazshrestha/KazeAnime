'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiSettings, FiSkipForward,
} from 'react-icons/fi';
import { MdOutlineSubtitles } from 'react-icons/md';
import type { EpisodeSource } from '@/types/anime';

interface VideoPlayerProps {
  source: EpisodeSource;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  initialTime?: number;
  episodeTitle?: string;
  onNextEpisode?: () => void;
}

function formatTime(secs: number): string {
  if (!isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({
  source,
  onTimeUpdate,
  initialTime = 0,
  episodeTitle,
  onNextEpisode,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>('default');
  const [subtitleOpen, setSubtitleOpen] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<number | null>(null);
  const [clickFlash, setClickFlash] = useState<{ key: number; paused: boolean } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pick best source URL
  const getSrc = useCallback(
    (quality: string) => {
      const src =
        source.sources.find((s) => s.quality === quality) ??
        source.sources.find((s) => s.quality === 'default') ??
        source.sources[source.sources.length - 1];
      return src?.url ?? '';
    },
    [source],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const url = getSrc(selectedQuality);
    if (!url) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isM3U8 = url.includes('.m3u8') ||
      (source.sources.find((s) => s.quality === selectedQuality || s.quality === 'default')?.isM3U8 ?? false);

    const aniwatchBase = process.env.NEXT_PUBLIC_ANIWATCH_API_URL ?? 'http://localhost:4000';
    const proxiedUrl = `${aniwatchBase}/hls-proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent('https://megacloud.blog/')}`;

    if (isM3U8 && Hls.isSupported()) {
      // Try direct URL first — CDNs block Vercel server IPs but allow browser IPs.
      // If direct load fails fatally, fall back to the server-side proxy.
      let usedProxy = false;

      const createHls = (src: string) => {
        const hls = new Hls({ enableWorker: true });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal && !usedProxy) {
            usedProxy = true;
            hls.destroy();
            createHls(proxiedUrl);
          }
        });
      };

      createHls(url);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS — try direct, proxy as fallback
      video.src = url;
      video.load();
      video.onerror = () => {
        video.src = proxiedUrl;
        video.load();
        video.onerror = null;
      };
    } else {
      video.src = url;
      video.load();
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [getSrc, selectedQuality, source.sources]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || initialTime <= 0) return;
    const onLoaded = () => {
      video.currentTime = initialTime;
    };
    video.addEventListener('loadedmetadata', onLoaded);
    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [initialTime]);

  // Manage subtitle tracks imperatively — React's <track> doesn't reliably control mode
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Remove all existing injected tracks
    video.querySelectorAll('track[data-injected]').forEach((t) => t.remove());
    if (selectedSubtitle !== null && source.subtitles?.[selectedSubtitle]) {
      const sub = source.subtitles[selectedSubtitle];
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = sub.lang;
      track.src = `/api/hls?url=${encodeURIComponent(sub.url)}&referer=${encodeURIComponent('https://megacloud.blog/')}`;
      track.setAttribute('data-injected', '1');
      track.default = true;
      video.appendChild(track);
      // Force mode to showing after the track is added
      const activate = () => {
        const tt = video.textTracks[video.textTracks.length - 1];
        if (tt) tt.mode = 'showing';
      };
      track.addEventListener('load', activate);
      activate();
    }
  }, [selectedSubtitle, source.subtitles]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [resetHideTimer]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    const wasPaused = v.paused;
    if (wasPaused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
    setClickFlash({ key: Date.now(), paused: !wasPaused });
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    onTimeUpdate?.(v.currentTime, v.duration);

    // Buffered
    if (v.buffered.length > 0) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !isFinite(v.duration) || v.duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  const qualities = source.sources
    .map((s) => s.quality)
    .filter((q, i, arr) => arr.indexOf(q) === i);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden select-none group"
    >
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Persistent center play/pause button — z-20 so it sits above the controls overlay */}
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-opacity duration-200 ${
        playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
      }`}>
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="pointer-events-auto bg-black/50 backdrop-blur-sm rounded-full p-5 shadow-xl hover:bg-black/70 transition-colors"
        >
          {playing
            ? <FiPause className="text-white text-4xl" />
            : <FiPlay className="text-white text-4xl fill-white" />}
        </button>
      </div>

      {/* Center click flash — brief play/pause indicator */}
      <AnimatePresence>
        {clickFlash && (
          <motion.div
            key={clickFlash.key}
            initial={{ opacity: 1, scale: 0.75 }}
            animate={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            onAnimationComplete={() => setClickFlash(null)}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="bg-black/50 rounded-full p-5">
              {clickFlash.paused
                ? <FiPause className="text-white text-3xl" />
                : <FiPlay className="text-white text-3xl fill-white" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent"
          >
            {/* Episode title */}
            {episodeTitle && (
              <div className="absolute top-4 left-4 right-4">
                <p className="text-white text-sm font-medium drop-shadow">{episodeTitle}</p>
              </div>
            )}

            {/* Progress bar */}
            <div
              className="relative mx-4 mb-2 h-1.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-3 transition-all duration-150"
              onClick={seek}
            >
              {/* Buffered */}
              <div
                className="h-full bg-white/30 rounded-full absolute top-0 left-0"
                style={{ width: `${buffered}%` }}
              />
              {/* Played */}
              <div
                className="h-full bg-accent rounded-full relative"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-2 px-4 pb-3">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white hover:text-accent transition-colors p-1">
                {playing ? <FiPause className="text-xl" /> : <FiPlay className="text-xl fill-white" />}
              </button>

              {/* Skip forward 10s */}
              <button
                onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
                className="text-white hover:text-accent transition-colors p-1"
              >
                <FiSkipForward className="text-lg" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="text-white hover:text-accent transition-colors p-1">
                  {muted || volume === 0 ? <FiVolumeX className="text-lg" /> : <FiVolume2 className="text-lg" />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolume}
                  className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-accent h-1 cursor-pointer"
                />
              </div>

              {/* Time */}
              <span className="text-white/80 text-xs ml-1 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Next episode */}
              {onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="flex items-center gap-1.5 text-white text-xs hover:text-accent transition-colors px-2 py-1 rounded border border-white/20 hover:border-accent"
                >
                  Next <FiSkipForward />
                </button>
              )}

              {/* Subtitles */}
              {source.subtitles && source.subtitles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => { setSubtitleOpen(!subtitleOpen); setQualityOpen(false); }}
                    className={`transition-colors p-1 ${selectedSubtitle !== null ? 'text-accent' : 'text-white hover:text-accent'}`}
                  >
                    <MdOutlineSubtitles className="text-lg" />
                  </button>
                  <AnimatePresence>
                    {subtitleOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute bottom-full right-0 mb-2 bg-black/90 border border-white/10 rounded-xl overflow-hidden min-w-[130px]"
                      >
                        <button
                          onClick={() => { setSelectedSubtitle(null); setSubtitleOpen(false); }}
                          className={`w-full px-3 py-2 text-xs text-left hover:bg-white/10 transition-colors ${selectedSubtitle === null ? 'text-accent font-semibold' : 'text-white/80'}`}
                        >
                          Off
                        </button>
                        {source.subtitles.map((sub, i) => (
                          <button
                            key={i}
                            onClick={() => { setSelectedSubtitle(i); setSubtitleOpen(false); }}
                            className={`w-full px-3 py-2 text-xs text-left hover:bg-white/10 transition-colors ${selectedSubtitle === i ? 'text-accent font-semibold' : 'text-white/80'}`}
                          >
                            {sub.lang}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Quality selector */}
              <div className="relative">
                <button
                  onClick={() => { setQualityOpen(!qualityOpen); setSubtitleOpen(false); }}
                  className="text-white hover:text-accent transition-colors p-1"
                >
                  <FiSettings className="text-lg" />
                </button>
                <AnimatePresence>
                  {qualityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute bottom-full right-0 mb-2 bg-black/90 border border-white/10 rounded-xl overflow-hidden min-w-[110px]"
                    >
                      {qualities.map((q) => (
                        <button
                          key={q}
                          onClick={() => { setSelectedQuality(q); setQualityOpen(false); }}
                          className={`w-full px-3 py-2 text-xs text-left transition-colors hover:bg-white/10 ${
                            selectedQuality === q ? 'text-accent font-semibold' : 'text-white/80'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white hover:text-accent transition-colors p-1">
                {fullscreen ? <FiMinimize className="text-lg" /> : <FiMaximize className="text-lg" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
