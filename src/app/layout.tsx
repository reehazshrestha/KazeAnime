import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { WatchlistProvider } from '@/context/WatchlistContext';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'KazeAnime — Watch Anime Free', template: '%s | KazeAnime' },
  description: 'Watch anime online in HD for free. No account required.',
  keywords: ['anime', 'watch anime', 'anime streaming', 'free anime', 'HD anime'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'KazeAnime',
    title: 'KazeAnime — Watch Anime Free',
    description: 'Watch anime online in HD for free. No account required.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d0d0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <WatchlistProvider>
            <Navbar />
            <main className="pt-16 min-h-screen">{children}</main>
            <footer className="border-t border-border/40 mt-20 py-10 text-center text-muted text-sm">
              <p>KazeAnime &mdash; All content belongs to their respective owners.</p>
              <p className="mt-1 text-xs opacity-60">Developed by Reehaz Shrestha</p>
            </footer>
          </WatchlistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
