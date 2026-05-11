/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@contabilpro/ui', '@contabilpro/contracts', '@contabilpro/utils'],
  typedRoutes: false,
};

export default nextConfig;
