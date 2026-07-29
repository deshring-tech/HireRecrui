/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // mammoth (DOCX) is loaded natively rather than webpack-bundled. unpdf (PDF) is
  // serverless-safe and needs no externalization.
  experimental: {
    serverComponentsExternalPackages: ["mammoth"],
  },
};

export default nextConfig;
