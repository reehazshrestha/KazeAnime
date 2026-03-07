'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiPlay } from 'react-icons/fi';

interface Props {
  animeId: string;
}

export default function ResumeButton({ animeId }: Props) {
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [epNumber, setEpNumber] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('watchHistory');
      if (!raw) return;
      const map = JSON.parse(raw);
      const entry = map[animeId];
      if (!entry?.episodeId) return;
      setEpisodeId(entry.episodeId);
      const parts = entry.episodeId.split(':');
      const epNum = parts.length >= 3 ? parseInt(parts[1], 10) : entry.episodeNumber;
      setEpNumber(isNaN(epNum) ? entry.episodeNumber : epNum);
      if (entry.duration > 0) {
        setProgress(Math.min((entry.currentTime / entry.duration) * 100, 100));
      }
    } catch {
      // ignore
    }
  }, [animeId]);

  if (!episodeId) return null;

  return (
    <Link href={`/watch/${encodeURIComponent(episodeId)}`}>
      <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-elevated border border-accent text-accent font-bold text-sm hover:bg-accent hover:text-black transition-colors relative overflow-hidden">
        {/* progress fill */}
        <span
          className="absolute inset-0 bg-accent/15 pointer-events-none"
          style={{ width: `${progress}%` }}
        />
        <FiPlay className="shrink-0" />
        Resume EP {epNumber}
        {progress > 0 && (
          <span className="text-[10px] opacity-70 font-normal">({Math.round(progress)}%)</span>
        )}
      </button>
    </Link>
  );
}
