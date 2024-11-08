/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        hostname: "127.0.0.1",
        port: "3001",
      }
    ],
  },
  output: "standalone",
  basePath: "/ifcloud",
};

export default nextConfig;
