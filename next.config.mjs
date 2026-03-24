/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [
      { source: "/", destination: "/rh", permanent: false },
    ];
  },
};

export default nextConfig;
