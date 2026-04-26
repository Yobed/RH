/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [
      { source: "/", destination: "/rh", permanent: false },
      { source: "/rh/analyses", destination: "/analyses", permanent: true },
      { source: "/rh/heures-sup", destination: "/heures-sup", permanent: true },
      { source: "/rh/evaluations", destination: "/evaluations", permanent: true },
    ];
  },
};

export default nextConfig;
