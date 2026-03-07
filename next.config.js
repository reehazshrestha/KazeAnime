/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gogocdn.net' },
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'img.anili.st' },
      { protocol: 'https', hostname: 'media.kitsu.io' },
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: '**.gogoanime.**' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
  },
};

module.exports = nextConfig;
