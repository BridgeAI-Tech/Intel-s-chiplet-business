/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/**': ['./intel_signals.db'],
  },
};

export default nextConfig;
