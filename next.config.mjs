/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@modelcontextprotocol/sdk"]
  }
};

export default nextConfig;
