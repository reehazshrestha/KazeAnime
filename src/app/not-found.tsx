import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="text-accent text-8xl font-black">404</p>
      <h1 className="text-text text-2xl font-bold">Page not found</h1>
      <p className="text-muted max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or the anime may have been removed.
      </p>
      <Link href="/">
        <button className="px-6 py-3 rounded-xl bg-accent text-black font-bold">
          Go Home
        </button>
      </Link>
    </div>
  );
}
